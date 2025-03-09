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

// Bot configuration from environment variables (set in index.ts when loading Claude Desktop config)
export const BOT_CONFIG = {
  // Default bot name displayed in meetings
  defaultBotName: process.env.MEETING_BOT_NAME || null,
  // Default bot image URL
  defaultBotImage: process.env.MEETING_BOT_IMAGE || null,
  // Default bot entry message
  defaultEntryMessage: process.env.MEETING_BOT_ENTRY_MESSAGE || null
};

// Log bot configuration at startup
if (BOT_CONFIG.defaultBotName || BOT_CONFIG.defaultBotImage || BOT_CONFIG.defaultEntryMessage) {
  console.error('[MCP Server] Bot configuration loaded:',
    BOT_CONFIG.defaultBotName ? `name="${BOT_CONFIG.defaultBotName}"` : '',
    BOT_CONFIG.defaultBotImage ? 'image=✓' : '',
    BOT_CONFIG.defaultEntryMessage ? 'message=✓' : ''
  );
}

// Recording modes
export const RECORDING_MODES = [
  "speaker_view",
  "gallery_view",
  "audio_only",
] as const;
export type RecordingMode = (typeof RECORDING_MODES)[number];
