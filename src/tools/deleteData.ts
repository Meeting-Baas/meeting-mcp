/**
 * Tool for deleting data associated with a bot
 */

import { z } from 'zod';
import { apiRequest } from '../api/client.js';
import { createValidSession } from '../utils/auth.js';
import { createTool } from '../utils/tool-types.js';

// Schema for the delete data tool parameters
const deleteDataParams = z.object({
  botId: z.string().describe('UUID of the bot to delete data for'),
});

// Delete status types from the API
type DeleteStatus = 'deleted' | 'partiallyDeleted' | 'alreadyDeleted' | 'noDataFound';

// DeleteResponse interface matching the API spec
interface DeleteResponse {
  ok: boolean;
  status: DeleteStatus;
}

/**
 * Deletes the transcription, log files, and video recording, along with all data
 * associated with a bot from Meeting Baas servers.
 *
 * The following public-facing fields will be retained:
 * - meeting_url
 * - created_at
 * - reserved
 * - errors
 * - ended_at
 * - mp4_s3_path (null as the file is deleted)
 * - uuid
 * - bot_param_id
 * - event_id
 * - scheduled_bot_id
 * - api_key_id
 *
 * Note: This endpoint is rate-limited to 5 requests per minute per API key.
 */
export const deleteDataTool = createTool(
  'delete_meeting_data',
  'Delete transcription, log files, and video recording, along with all data associated with a bot',
  deleteDataParams,
  async (args, context) => {
    const { session, log } = context;

    log.info('Deleting data for bot', { botId: args.botId });

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

      // Make the API request to delete data
      const response = await apiRequest(
        validSession,
        'post',
        `/bots/${args.botId}/delete_data`,
        null,
      );

      // Format response based on status
      if (response.ok) {
        // Handle the DeleteResponse format according to the API spec
        const statusMessages: Record<DeleteStatus, string> = {
          deleted:
            'Successfully deleted all data. The meeting metadata (URL, timestamps, etc.) has been preserved, but all content (recordings, transcriptions, and logs) has been deleted.',
          partiallyDeleted:
            'Partially deleted data. Some content could not be removed, but most data has been deleted. The meeting metadata has been preserved.',
          alreadyDeleted: 'Data was already deleted. No further action was needed.',
          noDataFound: 'No data was found for the specified bot ID.',
        };

        // Extract the DeleteResponse object from the API response
        const data = response.data as unknown as DeleteResponse;

        // Verify the operation was successful according to the API
        if (data && data.ok) {
          // Return the appropriate message based on the status
          return (
            statusMessages[data.status] || `Successfully processed with status: ${data.status}`
          );
        } else if (data && data.status) {
          return `Operation returned ok: false. Status: ${data.status}`;
        } else {
          // Fallback for unexpected response format
          return `Data deleted successfully, but the response format was unexpected: ${JSON.stringify(response.data)}`;
        }
      } else {
        // Handle error responses
        if (response.status === 401) {
          return 'Unauthorized: Missing or invalid API key.';
        } else if (response.status === 403) {
          return "Forbidden: You don't have permission to delete this bot's data.";
        } else if (response.status === 404) {
          return 'Not found: The specified bot ID does not exist.';
        } else if (response.status === 429) {
          return 'Rate limit exceeded: This endpoint is limited to 5 requests per minute per API key. Please try again later.';
        } else {
          return `Failed to delete data: ${JSON.stringify(response)}`;
        }
      }
    } catch (error) {
      log.error('Error deleting data', { error: String(error), botId: args.botId });

      // Check for rate limit error
      if (error instanceof Error && error.message.includes('429')) {
        return 'Rate limit exceeded: This endpoint is limited to 5 requests per minute per API key. Please try again later.';
      }

      return `Error deleting data: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
);
