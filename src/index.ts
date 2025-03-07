/**
 * Meeting BaaS MCP Server
 *
 * Connects Claude and other AI assistants to Meeting BaaS API,
 * allowing them to manage recordings, transcripts, and calendar data.
 */

import { FastMCP } from "fastmcp";
import { SERVER_CONFIG } from "./config.js";

// Import tools
import {
  getMeetingDataTool,
  joinMeetingTool,
  leaveMeetingTool,
  listCalendarsTool,
  listUpcomingMeetingsTool,
  scheduleRecordingTool,
  searchTranscriptTool,
} from "./tools/index.js";

// Import resources
import {
  meetingMetadataResource,
  meetingTranscriptResource,
} from "./resources/index.js";

// Define session auth type
type SessionAuth = { apiKey: string };

// Configure the server
const server = new FastMCP<SessionAuth>({
  name: SERVER_CONFIG.name,
  version: "1.0.0", // Using explicit semantic version format
  authenticate: async (context) => {
    // Get API key from headers
    const apiKey = context.headers["x-api-key"];
    if (!apiKey) {
      throw new Response(null, {
        status: 401,
        statusText: "API key required",
      });
    }

    // Ensure apiKey is a string
    const keyValue = Array.isArray(apiKey) ? apiKey[0] : apiKey;
    return { apiKey: keyValue };
  },
});

// Register tools
server.addTool(joinMeetingTool);
server.addTool(leaveMeetingTool);
server.addTool(getMeetingDataTool);
server.addTool(searchTranscriptTool);
server.addTool(listCalendarsTool);
server.addTool(listUpcomingMeetingsTool);
server.addTool(scheduleRecordingTool);

// Register resources
server.addResourceTemplate(meetingTranscriptResource);
server.addResourceTemplate(meetingMetadataResource);

// Start the server
server.start({
  transportType: "sse",
  sse: {
    endpoint: "/mcp", // Using literal string with leading slash
    port: SERVER_CONFIG.port,
  },
});

console.log(
  `Meeting BaaS MCP Server started on http://localhost:${SERVER_CONFIG.port}/mcp`
);
