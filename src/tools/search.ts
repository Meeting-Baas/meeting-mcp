/**
 * MCP tools for searching meeting content
 */

import type { Context, TextContent } from "fastmcp";
import { z } from "zod";
import { apiRequest } from "../api/client.js";
import { Transcript } from "../types/index.js";
import { formatTime } from "../utils/formatters.js";

// Define our session auth type
type SessionAuth = { apiKey: string };

// Define the parameters schema
const searchTranscriptParams = z.object({
  botId: z.string().uuid().describe("ID of the bot that recorded the meeting"),
  query: z.string().describe("Text to search for in the transcript"),
});

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

/**
 * Search meeting transcripts
 */
export const searchTranscriptTool: Tool<typeof searchTranscriptParams> = {
  name: "searchTranscript",
  description: "Search through meeting transcripts for specific content",
  parameters: searchTranscriptParams,
  execute: async (args, context) => {
    const { session, log } = context;
    log.info("Searching transcripts", { botId: args.botId, query: args.query });

    const response = await apiRequest(
      session,
      "get",
      `/bots/meeting_data?bot_id=${args.botId}`
    );

    const transcripts: Transcript[] = response.bot_data.transcripts;
    const results = transcripts.filter((transcript: Transcript) => {
      const text = transcript.words
        .map((word: { text: string }) => word.text)
        .join(" ");
      return text.toLowerCase().includes(args.query.toLowerCase());
    });

    if (results.length === 0) {
      return `No results found for "${args.query}"`;
    }

    // Format the results
    const formattedResults = results
      .map((transcript: Transcript) => {
        const text = transcript.words
          .map((word: { text: string }) => word.text)
          .join(" ");
        const startTime = formatTime(transcript.start_time);
        const speaker = transcript.speaker;

        return `[${startTime}] ${speaker}: ${text}`;
      })
      .join("\n\n");

    return `Found ${results.length} results for "${args.query}":\n\n${formattedResults}`;
  },
};
