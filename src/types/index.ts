/**
 * Type definitions for the MeetingBaaS MCP server
 */

// Session data type
export interface SessionData {
  apiKey: string;
}

// Transcript type
export interface Transcript {
  speaker: string;
  start_time: number;
  words: { text: string }[];
}

// Meeting bot type
export interface Bot {
  bot_id: string;
  bot_name: string;
  meeting_url: string;
  created_at: string;
  ended_at: string | null;
}

// Calendar event type
export interface CalendarEvent {
  uuid: string;
  name: string;
  start_time: string;
  deleted: boolean;
  bot_param: unknown;
}

// Calendar type
export interface Calendar {
  uuid: string;
  name: string;
  email: string;
}
