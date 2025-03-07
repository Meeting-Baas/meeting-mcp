/**
 * Configuration and constants for the MeetingBaaS MCP server
 */

// API configuration
export const API_BASE_URL = "https://api.meetingbaas.com";

// Server configuration
export const SERVER_CONFIG = {
  name: "Meeting BaaS MCP",
  version: "1.0.0",
  port: 7017,
  endpoint: "/mcp",
};

// Recording modes
export const RECORDING_MODES = [
  "speaker_view",
  "gallery_view",
  "audio_only",
] as const;
export type RecordingMode = (typeof RECORDING_MODES)[number];
