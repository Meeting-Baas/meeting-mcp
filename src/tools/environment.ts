/**
 * Environment selection tool
 *
 * Allows switching between different API environments (gmeetbot, preprod, prod)
 */

import { z } from 'zod';
import { Environment, getApiBaseUrl, setEnvironment } from '../config.js';
import { createValidSession } from '../utils/auth.js';
import { createServerLogger } from '../utils/logging.js';
import { createTool } from '../utils/tool-types.js';

const logger = createServerLogger('Environment Tool');

// Define the schema for the environment selection tool parameters
const environmentSelectionSchema = z.object({
  environment: z
    .enum(['gmeetbot', 'preprod', 'prod'])
    .describe('The environment to use (gmeetbot, preprod, or prod)'),
});

// Create the environment selection tool using the helper function
export const selectEnvironmentTool = createTool(
  'select_environment',
  'Select which environment (API endpoint) to use for all MeetingBaaS operations',
  environmentSelectionSchema,
  async (input, context) => {
    const { session, log } = context;

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

      // Set the environment
      setEnvironment(input.environment as Environment);

      // Get the current API base URL to include in the response
      const apiBaseUrl = getApiBaseUrl();

      logger(`Environment switched to: ${input.environment} (${apiBaseUrl})`);

      return `Environment set to ${input.environment} (${apiBaseUrl})`;
    } catch (error) {
      logger(`Error setting environment: ${error}`);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Failed to set environment: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);
