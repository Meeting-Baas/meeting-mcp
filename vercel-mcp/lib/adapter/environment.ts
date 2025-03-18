import { getApiBaseUrl, setEnvironment } from '../../../src/config';

/**
 * Configures the environment settings for the Meeting BaaS API
 *
 * @returns The configured API base URL
 */
export function configureEnvironment(): string {
  // Default to prod environment unless specified otherwise
  const env = process.env.MEETING_BAAS_ENV || 'prod';

  // Set the environment in the config
  setEnvironment(env as any);

  // Log the environment configuration
  console.log(`[MCP Server] Environment: ${env} (${getApiBaseUrl()})`);

  return getApiBaseUrl();
}
