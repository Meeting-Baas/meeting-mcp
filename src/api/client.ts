/**
 * API client for MeetingBaaS API
 */

import axios, { AxiosError, Method } from 'axios';
import { UserError } from 'fastmcp';
import { getApiBaseUrl } from '../config.js';

/**
 * Session type definition
 */
export type SessionAuth = { apiKey: string };

/**
 * Makes a request to the MeetingBaaS API
 */
export async function apiRequest(
  session: SessionAuth | undefined,
  method: Method,
  endpoint: string,
  data: Record<string, unknown> | null = null,
) {
  // Validate session
  if (!session) {
    console.error(`[API Client] No session provided`);
    throw new UserError('Authentication required: No session provided');
  }

  // Extract and validate API key
  const apiKey = session.apiKey;
  if (!apiKey) {
    console.error(`[API Client] No API key in session object`);
    throw new UserError('Authentication required: No API key provided');
  }

  // Normalize API key to string
  const apiKeyString = Array.isArray(apiKey) ? apiKey[0] : apiKey;

  // Make sure we have a valid string API key
  if (typeof apiKeyString !== 'string' || apiKeyString.length === 0) {
    console.error(`[API Client] Invalid API key format`);
    throw new UserError('Authentication error: Invalid API key format');
  }

  try {
    // Set up headers with API key
    const headers = {
      'x-meeting-baas-api-key': apiKeyString,
      'Content-Type': 'application/json',
    };

    // Get the current API base URL
    const apiBaseUrl = getApiBaseUrl();

    // Make the API request
    const response = await axios({
      method,
      url: `${apiBaseUrl}${endpoint}`,
      headers,
      data,
    });

    return response.data;
  } catch (error) {
    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(`[API Client] Request failed: ${axiosError.message}`);

      // Handle specific error codes
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        throw new UserError(`Authentication failed: Invalid API key or insufficient permissions`);
      }

      // Extract error details from response data if available
      if (axiosError.response?.data) {
        throw new UserError(`API Error: ${JSON.stringify(axiosError.response.data)}`);
      }

      throw new UserError(`API Error: ${axiosError.message}`);
    }

    // Handle non-Axios errors
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[API Client] Request error: ${err.message}`);
    throw new UserError(`Request error: ${err.message}`);
  }
}

/**
 * Client for the MeetingBaaS API
 */
export class MeetingBaasClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Join a meeting with a bot
   */
  async joinMeeting(params: {
    meeting_url: string;
    bot_name: string | null;
    bot_image?: string | null;
    entry_message?: string | null;
    deduplication_key?: string | null;
    automatic_leave?: {
      noone_joined_timeout?: number | null;
      waiting_room_timeout?: number | null;
    } | null;
    speech_to_text?: {
      provider: string;
      api_key?: string | null;
    } | null;
    streaming?: {
      input?: string | null;
      output?: string | null;
      audio_frequency?: string | null;
    } | null;
    reserved?: boolean;
    recording_mode?: string;
    start_time?: string;
    extra?: Record<string, unknown>;
  }) {
    // Create a session with our API key
    const session: SessionAuth = { apiKey: this.apiKey };

    // Use the existing apiRequest function
    return apiRequest(session, 'post', '/bots', params);
  }
}
