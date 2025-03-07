/**
 * Resources for meeting transcripts and metadata
 */

import type { ResourceResult, ResourceTemplate } from "fastmcp";
import { apiRequest } from "../api/client.js";
import { formatDuration, formatTime } from "../utils/formatters.js";

// Explicitly define transcript interface instead of importing
interface Transcript {
  speaker: string;
  start_time: number;
  words: { text: string }[];
}

// Define our session auth type
type SessionAuth = { apiKey: string };

/**
 * Meeting transcript resource
 */
export const meetingTranscriptResource: ResourceTemplate<
  [
    {
      name: string;
      description: string;
      required: boolean;
    }
  ]
> = {
  uriTemplate: "meeting:transcript/{botId}",
  name: "Meeting Transcript",
  mimeType: "text/plain",
  arguments: [
    {
      name: "botId",
      description: "ID of the bot that recorded the meeting",
      required: true,
    },
  ],
  load: async function (args: Record<string, string>): Promise<ResourceResult> {
    const { botId } = args;

    try {
      const session = { apiKey: "session-key" }; // This will be provided by the context

      const response = await apiRequest(
        session,
        "get",
        `/bots/meeting_data?bot_id=${botId}`
      );

      const transcripts: Transcript[] = response.bot_data.transcripts;

      // Format all transcripts
      const formattedTranscripts = transcripts
        .map((transcript: Transcript) => {
          const text = transcript.words
            .map((word: { text: string }) => word.text)
            .join(" ");
          const startTime = formatTime(transcript.start_time);
          const speaker = transcript.speaker;

          return `[${startTime}] ${speaker}: ${text}`;
        })
        .join("\n\n");

      return {
        text:
          formattedTranscripts || "No transcript available for this meeting.",
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        text: `Error retrieving transcript: ${errorMessage}`,
      };
    }
  },
};

/**
 * Meeting metadata resource
 */
export const meetingMetadataResource: ResourceTemplate<
  [
    {
      name: string;
      description: string;
      required: boolean;
    }
  ]
> = {
  uriTemplate: "meeting:metadata/{botId}",
  name: "Meeting Metadata",
  mimeType: "application/json",
  arguments: [
    {
      name: "botId",
      description: "ID of the bot that recorded the meeting",
      required: true,
    },
  ],
  load: async function (args: Record<string, string>): Promise<ResourceResult> {
    const { botId } = args;

    try {
      const session = { apiKey: "session-key" }; // This will be provided by the context

      const response = await apiRequest(
        session,
        "get",
        `/bots/meeting_data?bot_id=${botId}`
      );

      // Extract and format metadata for easier consumption
      const metadata = {
        duration: response.duration,
        formattedDuration: formatDuration(response.duration),
        videoUrl: response.mp4,
        bot: {
          name: response.bot_data.bot.bot_name,
          meetingUrl: response.bot_data.bot.meeting_url,
          createdAt: response.bot_data.bot.created_at,
          endedAt: response.bot_data.bot.ended_at,
        },
        transcriptSegments: response.bot_data.transcripts.length,
      };

      return {
        text: JSON.stringify(metadata, null, 2),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        text: `Error retrieving metadata: ${errorMessage}`,
      };
    }
  },
};
