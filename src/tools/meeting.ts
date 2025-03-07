/**
 * MCP tools for managing meetings
 */

import type { Context, TextContent } from "fastmcp";
import { z } from "zod";
import { apiRequest } from "../api/client.js";

// Define our session auth type
type SessionAuth = { apiKey: string };

// Tool type with correct typing
type Tool<P extends z.ZodType<any, any>> = {
  name: string;
  description: string;
  parameters: P;
  execute: (
    args: z.infer<P>,
    context: Context<SessionAuth>
  ) => Promise<string | { content: TextContent[] }>;
};

// Define the parameters schemas
const joinMeetingParams = z.object({
  meetingUrl: z.string().url().describe("URL of the meeting to join"),
  botName: z.string().describe("Name to display for the bot in the meeting"),
  reserved: z
    .boolean()
    .default(true)
    .describe("Whether to use a dedicated bot"),
  startTime: z
    .number()
    .optional()
    .describe("Unix timestamp when the bot should join"),
  recordingMode: z
    .enum(["speaker_view", "gallery_view", "audio_only"] as const)
    .default("speaker_view")
    .describe("Recording mode"),
});

const leaveMeetingParams = z.object({
  botId: z.string().uuid().describe("ID of the bot to remove from the meeting"),
});

const getMeetingDataParams = z.object({
  botId: z.string().uuid().describe("ID of the bot that recorded the meeting"),
});

/**
 * Join a meeting
 */
export const joinMeetingTool: Tool<typeof joinMeetingParams> = {
  name: "joinMeeting",
  description: "Have a bot join a meeting now or schedule it for the future",
  parameters: joinMeetingParams,
  execute: async (args, context) => {
    const { session, log } = context;
    log.info("Joining meeting", { url: args.meetingUrl });

    const payload = {
      meeting_url: args.meetingUrl,
      bot_name: args.botName,
      reserved: args.reserved,
      recording_mode: args.recordingMode,
      start_time: args.startTime,
      extra: {}, // Can be used to add custom data
    };

    const response = await apiRequest(session, "post", "/bots/", payload);
    return `Bot joined meeting successfully. Bot ID: ${response.bot_id}`;
  },
};

/**
 * Leave a meeting
 */
export const leaveMeetingTool: Tool<typeof leaveMeetingParams> = {
  name: "leaveMeeting",
  description: "Have a bot leave an ongoing meeting",
  parameters: leaveMeetingParams,
  execute: async (args, context) => {
    const { session, log } = context;
    log.info("Leaving meeting", { botId: args.botId });

    const response = await apiRequest(session, "delete", `/bots/${args.botId}`);
    if (response.ok) {
      return "Bot left the meeting successfully";
    } else {
      throw new Error("Failed to leave meeting");
    }
  },
};

/**
 * Get meeting data
 */
export const getMeetingDataTool: Tool<typeof getMeetingDataParams> = {
  name: "getMeetingData",
  description: "Get recording and transcript data from a meeting",
  parameters: getMeetingDataParams,
  execute: async (args, context) => {
    const { session, log } = context;
    log.info("Getting meeting data", { botId: args.botId });

    const response = await apiRequest(
      session,
      "get",
      `/bots/meeting_data?bot_id=${args.botId}`
    );

    // Create a summary of the meeting
    const duration = response.duration;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    const transcriptCount = response.bot_data.transcripts.length;

    return {
      content: [
        {
          type: "text" as const,
          text: `Meeting recording is available. Duration: ${minutes}m ${seconds}s. Contains ${transcriptCount} transcript segments.`,
        },
        {
          type: "text" as const,
          text: `Video URL: ${response.mp4}`,
        },
      ],
    };
  },
};
