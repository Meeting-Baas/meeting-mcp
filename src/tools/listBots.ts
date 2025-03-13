/**
 * Tool for listing bots with metadata
 */

import { z } from 'zod';
import { apiRequest } from '../api/client.js';
import { createValidSession } from '../utils/auth.js';
import { createTool } from '../utils/tool-types.js';

// Schema for the list bots with metadata tool parameters
const listBotsParams = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Maximum number of bots to return (1-50, default: 10)'),
  bot_name: z
    .string()
    .optional()
    .describe('Filter bots by name containing this string (case-insensitive)'),
  meeting_url: z.string().optional().describe('Filter bots by meeting URL containing this string'),
  created_after: z
    .string()
    .optional()
    .describe('Filter bots created after this date (ISO format, e.g., 2023-05-01T00:00:00)'),
  created_before: z
    .string()
    .optional()
    .describe('Filter bots created before this date (ISO format, e.g., 2023-05-31T23:59:59)'),
  filter_by_extra: z
    .string()
    .optional()
    .describe("Filter by extra JSON fields (format: 'field1:value1,field2:value2')"),
  sort_by_extra: z
    .string()
    .optional()
    .describe("Sort by field in extra JSON (format: 'field:asc' or 'field:desc')"),
  cursor: z.string().optional().describe('Cursor for pagination from previous response'),
});

/**
 * Retrieves a paginated list of the user's bots with essential metadata,
 * including IDs, names, and meeting details. Supports filtering, sorting,
 * and advanced querying options.
 */
export const listBotsWithMetadataTool = createTool(
  'list_bots_with_metadata',
  'List recent bots with metadata, including IDs, names, meeting details with filtering and sorting options',
  listBotsParams,
  async (args, context) => {
    const { session, log } = context;

    log.info('Listing bots with metadata', {
      limit: args.limit,
      bot_name: args.bot_name,
      meeting_url: args.meeting_url,
      created_after: args.created_after,
      created_before: args.created_before,
      filter_by_extra: args.filter_by_extra,
      sort_by_extra: args.sort_by_extra,
      cursor: args.cursor,
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

      // Construct query parameters
      const queryParams = new URLSearchParams();

      if (args.limit !== undefined) queryParams.append('limit', args.limit.toString());
      if (args.bot_name) queryParams.append('bot_name', args.bot_name);
      if (args.meeting_url) queryParams.append('meeting_url', args.meeting_url);
      if (args.created_after) queryParams.append('created_after', args.created_after);
      if (args.created_before) queryParams.append('created_before', args.created_before);
      if (args.filter_by_extra) queryParams.append('filter_by_extra', args.filter_by_extra);
      if (args.sort_by_extra) queryParams.append('sort_by_extra', args.sort_by_extra);
      if (args.cursor) queryParams.append('cursor', args.cursor);

      // Make the API request
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await apiRequest(
        validSession,
        'get',
        `/bots/bots_with_metadata${queryString}`,
        null,
      );

      // Check if response contains bots
      if (!response.recentBots || !Array.isArray(response.recentBots)) {
        return 'No bots found or unexpected response format.';
      }

      const bots = response.recentBots;

      // Format the response
      if (bots.length === 0) {
        return 'No bots found matching your criteria.';
      }

      // Format the bot list
      const formattedBots = bots
        .map((bot: any, index: number) => {
          // Extract creation date and format it
          const createdAt = bot.createdAt ? new Date(bot.createdAt).toLocaleString() : 'Unknown';

          // Format duration if available
          const duration = bot.duration
            ? `${Math.floor(bot.duration / 60)}m ${bot.duration % 60}s`
            : 'N/A';

          // Extract any customer ID or meeting info from extra (if available)
          const extraInfo = [];
          if (bot.extra) {
            if (bot.extra.customerId) extraInfo.push(`Customer ID: ${bot.extra.customerId}`);
            if (bot.extra.meetingType) extraInfo.push(`Type: ${bot.extra.meetingType}`);
            if (bot.extra.description) extraInfo.push(`Description: ${bot.extra.description}`);
          }

          return `${index + 1}. Bot: ${bot.name || 'Unnamed'} (ID: ${bot.id})
   Created: ${createdAt}
   Duration: ${duration}
   Meeting URL: ${bot.meetingUrl || 'N/A'}
   Status: ${bot.endedAt ? 'Completed' : 'Active'}
   ${extraInfo.length > 0 ? `Additional Info: ${extraInfo.join(', ')}` : ''}
`;
        })
        .join('\n');

      // Add pagination information if available
      let response_text = `Found ${bots.length} bots:\n\n${formattedBots}`;

      if (response.nextCursor) {
        response_text += `\nMore results available. Use cursor: ${response.nextCursor} to see the next page.`;
      }

      return response_text;
    } catch (error) {
      log.error('Error listing bots', { error: String(error) });
      return `Error listing bots: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
);
