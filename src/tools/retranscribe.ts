/**
 * Tool for retranscribing a bot's audio
 */

import { z } from 'zod';
import { apiRequest } from '../api/client.js';
import { createValidSession } from '../utils/auth.js';
import { createTool } from '../utils/tool-types.js';

// Schema for the retranscribe tool parameters
const retranscribeParams = z.object({
  botId: z.string().describe('UUID of the bot to retranscribe'),
  speechToTextProvider: z
    .enum(['Gladia', 'Runpod', 'Default'])
    .optional()
    .describe('Speech-to-text provider to use for transcription (optional)'),
  speechToTextApiKey: z
    .string()
    .optional()
    .describe('API key for the speech-to-text provider if required (optional)'),
  webhookUrl: z
    .string()
    .url()
    .optional()
    .describe('Webhook URL to receive notification when transcription is complete (optional)'),
});

/**
 * Retranscribes a bot's audio using the specified speech-to-text provider.
 * This is useful when you want to:
 * 1. Use a different speech-to-text provider than originally used
 * 2. Retry a failed transcription
 * 3. Get a new transcription with different settings
 */
export const retranscribeTool = createTool(
  'retranscribe_bot',
  "Retranscribe a bot's audio using the Default or your provided Speech to Text Provider",
  retranscribeParams,
  async (args, context) => {
    const { session, log } = context;

    log.info('Retranscribing bot', {
      botId: args.botId,
      provider: args.speechToTextProvider,
      hasApiKey: !!args.speechToTextApiKey,
      hasWebhook: !!args.webhookUrl,
    });

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

      // Prepare the request body
      const requestBody = {
        bot_uuid: args.botId,
        speech_to_text: args.speechToTextProvider
          ? {
              provider: args.speechToTextProvider,
              api_key: args.speechToTextApiKey,
            }
          : undefined,
        webhook_url: args.webhookUrl,
      };

      // Make the API request
      const response = await apiRequest(validSession, 'post', '/bots/retranscribe', requestBody);

      // Handle different response status codes
      if (response.status === 200) {
        return 'Retranscription request accepted. The transcription will be processed asynchronously.';
      } else if (response.status === 202) {
        return 'Retranscription request accepted and is being processed.';
      } else {
        return `Unexpected response status: ${response.status}`;
      }
    } catch (error) {
      log.error('Error retranscribing bot', { error: String(error), botId: args.botId });
      return `Error retranscribing bot: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
);
