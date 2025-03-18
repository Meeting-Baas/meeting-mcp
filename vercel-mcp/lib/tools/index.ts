import { z } from 'zod';

// Mock implementations of tools with proper exports matching what server.ts imports

// Meeting tools
export const joinMeetingTool = {
  name: 'joinMeeting',
  input: z.object({
    meetingUrl: z.string().optional(),
    meetingId: z.string().optional(),
  }),
  handler: async () => ({ success: true, message: 'Mocked join meeting' }),
};

export const leaveMeetingTool = {
  name: 'leaveMeeting',
  input: z.object({}),
  handler: async () => ({ success: true, message: 'Mocked leave meeting' }),
};

export const getMeetingDataTool = {
  name: 'getMeetingData',
  input: z.object({
    meetingId: z.string(),
  }),
  handler: async () => ({ success: true, data: { title: 'Mocked meeting data' } }),
};

export const getMeetingDataWithCredentialsTool = {
  name: 'getMeetingDataWithCredentials',
  input: z.object({
    meetingId: z.string(),
    credentials: z.string(),
  }),
  handler: async () => ({ success: true, data: { title: 'Mocked meeting data' } }),
};

export const getTranscriptTool = {
  name: 'getMeetingTranscript',
  input: z.object({
    meetingId: z.string(),
  }),
  handler: async () => ({ success: true, transcript: 'Mocked transcript' }),
};

// Calendar tools
export const oauthGuidanceTool = {
  name: 'oauthGuidance',
  input: z.object({}),
  handler: async () => ({ success: true, message: 'Mocked OAuth guidance' }),
};

export const listRawCalendarsTool = {
  name: 'listRawCalendars',
  input: z.object({}),
  handler: async () => ({ success: true, data: [] }),
};

export const setupCalendarOAuthTool = {
  name: 'setupCalendarOAuth',
  input: z.object({}),
  handler: async () => ({ success: true, message: 'Mocked OAuth setup' }),
};

export const listCalendarsTool = {
  name: 'listCalendars',
  input: z.object({}),
  handler: async () => ({ success: true, data: [] }),
};

export const getCalendarTool = {
  name: 'getCalendar',
  input: z.object({ calendarId: z.string() }),
  handler: async () => ({ success: true, data: { id: 'mock-id', name: 'Mock Calendar' } }),
};

export const deleteCalendarTool = {
  name: 'deleteCalendar',
  input: z.object({ calendarId: z.string() }),
  handler: async () => ({ success: true, message: 'Calendar deleted' }),
};

export const resyncAllCalendarsTool = {
  name: 'resyncAllCalendars',
  input: z.object({}),
  handler: async () => ({ success: true, message: 'Calendars resynced' }),
};

export const listUpcomingMeetingsTool = {
  name: 'listUpcomingMeetings',
  input: z.object({}),
  handler: async () => ({ success: true, data: [] }),
};

export const listEventsTool = {
  name: 'listEvents',
  input: z.object({}),
  handler: async () => ({ success: true, data: [] }),
};

export const listEventsWithCredentialsTool = {
  name: 'listEventsWithCredentials',
  input: z.object({ credentials: z.string() }),
  handler: async () => ({ success: true, data: [] }),
};

export const getEventTool = {
  name: 'getEvent',
  input: z.object({ eventId: z.string() }),
  handler: async () => ({ success: true, data: { id: 'mock-id', title: 'Mock Event' } }),
};

export const scheduleRecordingTool = {
  name: 'scheduleRecording',
  input: z.object({ eventId: z.string() }),
  handler: async () => ({ success: true, message: 'Recording scheduled' }),
};

export const scheduleRecordingWithCredentialsTool = {
  name: 'scheduleRecordingWithCredentials',
  input: z.object({ eventId: z.string(), credentials: z.string() }),
  handler: async () => ({ success: true, message: 'Recording scheduled' }),
};

export const cancelRecordingTool = {
  name: 'cancelRecording',
  input: z.object({ eventId: z.string() }),
  handler: async () => ({ success: true, message: 'Recording canceled' }),
};

export const cancelRecordingWithCredentialsTool = {
  name: 'cancelRecordingWithCredentials',
  input: z.object({ eventId: z.string(), credentials: z.string() }),
  handler: async () => ({ success: true, message: 'Recording canceled' }),
};

export const checkCalendarIntegrationTool = {
  name: 'checkCalendarIntegration',
  input: z.object({}),
  handler: async () => ({ success: true, integrated: false }),
};

// Link tools
export const shareableMeetingLinkTool = {
  name: 'shareableMeetingLink',
  input: z.object({ meetingId: z.string() }),
  handler: async () => ({ success: true, link: 'https://example.com/mock-link' }),
};

export const shareMeetingSegmentsTool = {
  name: 'shareMeetingSegments',
  input: z.object({
    meetingId: z.string(),
    segments: z.array(z.object({ start: z.number(), end: z.number() })),
  }),
  handler: async () => ({ success: true, link: 'https://example.com/mock-segments' }),
};

// Analysis tools
export const findKeyMomentsTool = {
  name: 'findKeyMoments',
  input: z.object({ meetingId: z.string() }),
  handler: async () => ({ success: true, moments: [] }),
};

// Data management tools
export const deleteDataTool = {
  name: 'deleteData',
  input: z.object({ dataId: z.string() }),
  handler: async () => ({ success: true, message: 'Data deleted' }),
};

export const listBotsWithMetadataTool = {
  name: 'listBotsWithMetadata',
  input: z.object({}),
  handler: async () => ({ success: true, bots: [] }),
};

// Environment tools
export const selectEnvironmentTool = {
  name: 'selectEnvironment',
  input: z.object({ environment: z.string() }),
  handler: async () => ({ success: true, message: 'Environment selected' }),
};

// QR code tools
export const generateQRCodeTool = {
  name: 'generateQRCode',
  input: z.object({ content: z.string() }),
  handler: async () => ({ success: true, qrCode: 'Mock QR code data' }),
};
