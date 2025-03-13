/**
 * Simple MCP tool for retrieving meeting transcripts
 */

import { z } from 'zod';
import { apiRequest } from '../api/client.js';
import { createValidSession } from '../utils/auth.js';
import { createTool } from '../utils/tool-types.js';

// Define transcript-related interfaces that match the actual API response structure
interface TranscriptWord {
  text: string;
  start_time: number;
  end_time: number;
  id?: number;
  bot_id?: number;
  user_id?: number | null;
}

interface TranscriptSegment {
  speaker: string;
  start_time: number;
  end_time?: number | null;
  words: TranscriptWord[];
  id?: number;
  bot_id?: number;
  user_id?: number | null;
  lang?: string | null;
}

interface BotData {
  bot: {
    bot_name: string;
    meeting_url: string;
    [key: string]: any;
  };
  transcripts: TranscriptSegment[];
}

interface MetadataResponse {
  bot_data: BotData;
  duration: number;
  mp4: string;
}

// Define the simple parameters schema
const getTranscriptParams = z.object({
  botId: z.string().describe('ID of the bot/meeting to retrieve transcript for'),
});

/**
 * Tool to get meeting transcript data
 *
 * This tool retrieves meeting data and returns the transcript,
 * properly handling the API response structure.
 */
export const getTranscriptTool = createTool(
  'getMeetingTranscript',
  'Get a meeting transcript with speaker names and content grouped by speaker',
  getTranscriptParams,
  async (args, context) => {
    const { session, log } = context;
    log.info('Getting meeting transcript', { botId: args.botId });

    try {
      // Create a valid session with fallbacks for API key
      const validSession = createValidSession(session, log);

      // Check if we have a valid session with API key
      if (!validSession) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Authentication failed. Please configure your API key in Claude Desktop settings or provide it directly.',
            },
          ],
          isError: true,
        };
      }

      // Make the API request to get meeting data
      const response = (await apiRequest(
        validSession,
        'get',
        `/bots/meeting_data?bot_id=${args.botId}`,
      )) as MetadataResponse;

      // Check for valid response structure
      if (!response || !response.bot_data) {
        return 'Error: Invalid response structure from API.';
      }

      // Extract meeting information
      const meetingInfo = {
        name: response.bot_data.bot?.bot_name || 'Unknown Meeting',
        url: response.bot_data.bot?.meeting_url || 'Unknown URL',
        duration: response.duration || 0,
      };

      // Extract transcripts from the response
      const transcripts = response.bot_data.transcripts || [];

      // If no transcripts, provide info about the meeting
      if (transcripts.length === 0) {
        return `Meeting "${meetingInfo.name}" has a recording (${Math.floor(meetingInfo.duration / 60)}m ${meetingInfo.duration % 60}s), but no transcript segments are available.`;
      }

      // Group and combine text by speaker
      const speakerTexts: Record<string, string[]> = {};

      // First pass: collect all text segments by speaker
      transcripts.forEach((segment: TranscriptSegment) => {
        const speaker = segment.speaker;
        // Check that words array exists and has content
        if (!segment.words || !Array.isArray(segment.words)) {
          return;
        }

        const text = segment.words
          .map((word) => word.text || '')
          .join(' ')
          .trim();
        if (!text) return; // Skip empty text

        if (!speakerTexts[speaker]) {
          speakerTexts[speaker] = [];
        }

        speakerTexts[speaker].push(text);
      });

      // If after processing we have no text, provide info
      if (Object.keys(speakerTexts).length === 0) {
        return `Meeting "${meetingInfo.name}" has a recording (${Math.floor(meetingInfo.duration / 60)}m ${meetingInfo.duration % 60}s), but could not extract readable transcript.`;
      }

      // Second pass: combine all text segments per speaker
      const combinedBySpeaker = Object.entries(speakerTexts).map(([speaker, texts]) => {
        return {
          speaker,
          text: texts.join(' '),
        };
      });

      // Format the transcript grouped by speaker
      const formattedTranscript = combinedBySpeaker
        .map((entry) => `${entry.speaker}: ${entry.text}`)
        .join('\n\n');

      // Add meeting info header
      const header = `Meeting: "${meetingInfo.name}"\nDuration: ${Math.floor(meetingInfo.duration / 60)}m ${meetingInfo.duration % 60}s\nTranscript:\n\n`;

      return header + formattedTranscript;
    } catch (error) {
      log.error('Error getting transcript', { error: String(error) });
      return `Error getting transcript: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
);
