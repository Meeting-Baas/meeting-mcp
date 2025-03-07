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
  if (!session || !session.apiKey) {
    throw new UserError("Authentication required");
  }

  try {
    const response = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        "x-meeting-baas-api-key": session.apiKey,
        "Content-Type": "application/json",
      },
      data,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(`API request failed: ${axiosError.message}`);

      if (axiosError.response?.data) {
        throw new UserError(
          `API Error: ${JSON.stringify(axiosError.response.data)}`
        );
      }
      throw new UserError(`API Error: ${axiosError.message}`);
    }

    // Handle non-Axios errors
    const err = error instanceof Error ? error : new Error(String(error));

    console.error(`Request error: ${err.message}`);
    throw new UserError(`Request error: ${err.message}`);
  }
}
