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
  end_time: string;
  deleted: boolean;
  bot_param: unknown;
  meeting_url?: string;
  attendees?: Array<{
    name?: string;
    email: string;
  }>;
  calendar_uuid: string;
  google_id: string;
  is_organizer: boolean;
  is_recurring: boolean;
  last_updated_at: string;
  raw: Record<string, any>;
  recurring_event_id?: string | null;
}

// Calendar type
export interface Calendar {
  uuid: string;
  name: string;
  email: string;
}
