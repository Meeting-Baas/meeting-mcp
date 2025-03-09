/**
 * API client for MeetingBaaS API
 */

import axios, { AxiosError, Method } from "axios";
import { UserError } from "fastmcp";
import { API_BASE_URL } from "../config.js";

/**
 * Session type definition
 */
type SessionAuth = { apiKey: string };

/**
 * Makes a request to the MeetingBaaS API
 */
export async function apiRequest(
  session: SessionAuth | undefined,
  method: Method,
  endpoint: string,
  data: Record<string, unknown> | null = null
) {
  // Validate session
  if (!session) {
    console.error(`[API Client] No session provided`);
    throw new UserError("Authentication required: No session provided");
  }
  
  // Extract and validate API key
  const apiKey = session.apiKey;
  if (!apiKey) {
    console.error(`[API Client] No API key in session object`);
    throw new UserError("Authentication required: No API key provided");
  }
  
  // Normalize API key to string
  const apiKeyString = Array.isArray(apiKey) ? apiKey[0] : apiKey;
  
  // Make sure we have a valid string API key
  if (typeof apiKeyString !== 'string' || apiKeyString.length === 0) {
    console.error(`[API Client] Invalid API key format`);
    throw new UserError("Authentication error: Invalid API key format");
  }

  try {
    // Set up headers with API key
    const headers = {
      "x-meeting-baas-api-key": apiKeyString,
      "Content-Type": "application/json",
    };
    
    // Make the API request
    const response = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
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
