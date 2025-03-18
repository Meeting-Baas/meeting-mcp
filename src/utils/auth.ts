/**
 * Authentication utilities for handling API keys and sessions
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { SessionAuth } from '../api/client.js';

// Define a minimal logger interface rather than importing from fastmcp
interface Logger {
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

/**
 * Get an API key with robust fallback mechanisms.
 * Tries, in order:
 * 1. Session object
 * 2. Environment variable
 * 3. Claude Desktop config file
 *
 * @param session The session object, which may contain an API key
 * @param log Optional logger for debugging
 * @returns An object with { apiKey, source } or null if no API key was found
 */
export function getApiKeyWithFallbacks(
  session: any | undefined,
  log?: Logger,
): { apiKey: string; source: string } | null {
  // Try to get API key from session
  if (session?.apiKey) {
    log?.debug('Using API key from session');
    return { apiKey: session.apiKey, source: 'session' };
  }

  // Try to get API key from environment variable
  if (process.env.MEETING_BAAS_API_KEY) {
    log?.debug('Using API key from environment variable');
    return { apiKey: process.env.MEETING_BAAS_API_KEY, source: 'environment' };
  }

  // Try to get API key from Claude Desktop config
  try {
    const claudeDesktopConfigPath = path.join(
      os.homedir(),
      'Library/Application Support/Claude/claude_desktop_config.json',
    );
    if (fs.existsSync(claudeDesktopConfigPath)) {
      const configContent = fs.readFileSync(claudeDesktopConfigPath, 'utf8');
      const configJson = JSON.parse(configContent);

      if (configJson.mcpServers?.meetingbaas?.headers?.['x-api-key']) {
        const apiKey = configJson.mcpServers.meetingbaas.headers['x-api-key'];
        log?.debug('Using API key from Claude Desktop config');
        return { apiKey, source: 'claude_config' };
      }
    }
  } catch (error) {
    log?.error('Error reading Claude Desktop config', { error });
  }

  // No API key found
  log?.error('No API key found in session, environment, or Claude Desktop config');
  return null;
}

/**
 * Creates a valid session object with an API key
 *
 * @param session The original session, which may be incomplete
 * @param log Optional logger for debugging
 * @returns A valid session object or undefined if no API key could be found
 */
export function createValidSession(
  session: any | undefined,
  log?: Logger,
): SessionAuth | undefined {
  const apiKeyInfo = getApiKeyWithFallbacks(session, log);

  if (!apiKeyInfo) {
    return undefined;
  }

  return { apiKey: apiKeyInfo.apiKey };
}
