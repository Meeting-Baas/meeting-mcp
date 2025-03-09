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
    .default(false)
    .describe("Whether to use a bot from the pool of bots or a new one (new ones are created on the fly and instances can take up to 4 minutes to boot"),
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
    
    // Basic logging
    log.info("Joining meeting", { 
      url: args.meetingUrl,
      botName: args.botName
    });
    
    // Using type assertion for flexibility with context structure
    const anyContext = context as any;
    
    // Get API key from session or environment variable
    let apiKey = session?.apiKey;
    
    // If not available in session, check environment variable
    if (!apiKey && process.env.MEETING_BAAS_API_KEY) {
      apiKey = process.env.MEETING_BAAS_API_KEY;
      log.info("Using API key from environment variable");
    }
    
    // Verify we have an API key
    if (!apiKey) {
      log.error("Authentication failed - no API key available");
      return {
        content: [
          {
            type: "text" as const,
            text: "Authentication failed. Please configure your API key in Claude Desktop settings."
          }
        ],
        isError: true
      };
    }
    
    // Prepare API request with the meeting details
    const payload = {
      meeting_url: args.meetingUrl,
      bot_name: args.botName,
      reserved: args.reserved,
      recording_mode: args.recordingMode,
      start_time: args.startTime,
      extra: {}, // Can be used to add custom data
    };

    try {
      // Create a session object with the API key
      const effectiveSession = { apiKey };
      
      const response = await apiRequest(effectiveSession, "post", "/bots/", payload);
      log.info("Join meeting success", { botId: response.bot_id });
      return `Bot joined meeting successfully. Bot ID: ${response.bot_id}`;
    } catch (error) {
      log.error("Join meeting failed", { error: String(error) });
      
      // Return a nicer error message
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to join meeting: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
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
