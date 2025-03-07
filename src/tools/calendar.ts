/**
 * MCP tools for calendar integration
 */

import type { Context, TextContent } from "fastmcp";
import { z } from "zod";
import { apiRequest } from "../api/client.js";
import { Calendar, CalendarEvent } from "../types/index.js";

// Define our session auth type
type SessionAuth = { apiKey: string };

// Define parameter schemas
const emptyParams = z.object({});

const upcomingMeetingsParams = z.object({
  calendarId: z.string().uuid().describe("UUID of the calendar to query"),
});

const scheduleRecordingParams = z.object({
  eventId: z.string().uuid().describe("UUID of the calendar event to record"),
  botName: z.string().describe("Name to display for the bot in the meeting"),
  recordingMode: z
    .enum(["speaker_view", "gallery_view", "audio_only"] as const)
    .default("speaker_view"),
});

// Tool type with correct typing
type Tool<P extends z.ZodType<any, any>> = {
  name: string;
  description: string;
  parameters: P;
  execute: (
    args: z.infer<P>,
    context: Context<SessionAuth>
  ) => Promise<string | { content: TextContent[] }>;
};

/**
 * List available calendars
 */
export const listCalendarsTool: Tool<typeof emptyParams> = {
  name: "listCalendars",
  description: "List available calendars",
  parameters: emptyParams,
  execute: async (_args, context) => {
    const { session, log } = context;
    log.info("Listing calendars");

    const response = await apiRequest(session, "get", "/calendars/");

    if (response.length === 0) {
      return "No calendars found. You can add a calendar using the addCalendar tool.";
    }

    const calendarList = response
      .map((cal: Calendar) => `- ${cal.name} (${cal.email}) [ID: ${cal.uuid}]`)
      .join("\n");

    return `Found ${response.length} calendars:\n\n${calendarList}`;
  },
};

/**
 * List upcoming meetings
 */
export const listUpcomingMeetingsTool: Tool<typeof upcomingMeetingsParams> = {
  name: "listUpcomingMeetings",
  description: "List upcoming meetings from a calendar",
  parameters: upcomingMeetingsParams,
  execute: async (args, context) => {
    const { session, log } = context;
    log.info("Listing upcoming meetings", { calendarId: args.calendarId });

    const response = await apiRequest(
      session,
      "get",
      `/calendar_events/?calendar_id=${args.calendarId}`
    );

    if (!response.data || response.data.length === 0) {
      return "No upcoming meetings found in this calendar.";
    }

    const now = new Date();

    const upcomingMeetings: CalendarEvent[] = response.data
      .filter(
        (event: CalendarEvent) =>
          !event.deleted && new Date(event.start_time) > now
      )
      .sort(
        (a: CalendarEvent, b: CalendarEvent) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );

    if (upcomingMeetings.length === 0) {
      return "No upcoming meetings found in this calendar.";
    }

    const meetingList = upcomingMeetings
      .map((meeting: CalendarEvent) => {
        const startTime = new Date(meeting.start_time).toLocaleString();
        const hasBot = meeting.bot_param ? "🤖 Bot scheduled" : "";

        return `- ${meeting.name} [${startTime}] ${hasBot} [ID: ${meeting.uuid}]`;
      })
      .join("\n");

    return `Upcoming meetings:\n\n${meetingList}`;
  },
};

/**
 * Schedule a recording bot
 */
export const scheduleRecordingTool: Tool<typeof scheduleRecordingParams> = {
  name: "scheduleRecording",
  description:
    "Schedule a bot to record an upcoming meeting from your calendar",
  parameters: scheduleRecordingParams,
  execute: async (args, context) => {
    const { session, log } = context;
    log.info("Scheduling meeting recording", { eventId: args.eventId });

    const payload = {
      bot_name: args.botName,
      recording_mode: args.recordingMode,
      extra: {}, // Can be used to add custom data
    };

    await apiRequest(
      session,
      "post",
      `/calendar_events/${args.eventId}/bot`,
      payload
    );

    return "Recording has been scheduled successfully.";
  },
};
