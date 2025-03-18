import { z } from 'zod';
import { configureEnvironment } from '../lib/adapter/environment';
import { registerResourceTemplate } from '../lib/adapter/resource-adapter';
import { registerTool } from '../lib/adapter/tool-adapter';
import { initializeMcpApiHandler } from '../lib/mcp-api-handler';

// Import our existing tools
import {
  cancelRecordingTool,
  cancelRecordingWithCredentialsTool,
  checkCalendarIntegrationTool,
  deleteCalendarTool,
  deleteDataTool,
  findKeyMomentsTool,
  generateQRCodeTool,
  getCalendarTool,
  getEventTool,
  getMeetingDataTool,
  getMeetingDataWithCredentialsTool,
  getTranscriptTool,
  joinMeetingTool,
  leaveMeetingTool,
  listBotsWithMetadataTool,
  listCalendarsTool,
  listEventsTool,
  listEventsWithCredentialsTool,
  listRawCalendarsTool,
  listUpcomingMeetingsTool,
  oauthGuidanceTool,
  resyncAllCalendarsTool,
  scheduleRecordingTool,
  scheduleRecordingWithCredentialsTool,
  selectEnvironmentTool,
  setupCalendarOAuthTool,
  shareableMeetingLinkTool,
  shareMeetingSegmentsTool,
} from '../../src/tools';

// Import our existing resources
import { meetingMetadataResource, meetingTranscriptResource } from '../../src/resources';

// Initialize the MCP API handler
const handler = initializeMcpApiHandler(
  (server) => {
    // Configure the environment
    configureEnvironment();

    // Register all tools through our adapter

    // Meeting tools
    registerTool(server, joinMeetingTool);
    registerTool(server, leaveMeetingTool);
    registerTool(server, getMeetingDataTool);
    registerTool(server, getMeetingDataWithCredentialsTool);
    registerTool(server, getTranscriptTool);

    // Calendar tools
    registerTool(server, oauthGuidanceTool);
    registerTool(server, listRawCalendarsTool);
    registerTool(server, setupCalendarOAuthTool);
    registerTool(server, listCalendarsTool);
    registerTool(server, getCalendarTool);
    registerTool(server, deleteCalendarTool);
    registerTool(server, resyncAllCalendarsTool);
    registerTool(server, listUpcomingMeetingsTool);
    registerTool(server, listEventsTool);
    registerTool(server, listEventsWithCredentialsTool);
    registerTool(server, getEventTool);
    registerTool(server, scheduleRecordingTool);
    registerTool(server, scheduleRecordingWithCredentialsTool);
    registerTool(server, cancelRecordingTool);
    registerTool(server, cancelRecordingWithCredentialsTool);
    registerTool(server, checkCalendarIntegrationTool);

    // Link tools
    registerTool(server, shareableMeetingLinkTool);
    registerTool(server, shareMeetingSegmentsTool);

    // Analysis tools
    registerTool(server, findKeyMomentsTool);

    // Data management tools
    registerTool(server, deleteDataTool);
    registerTool(server, listBotsWithMetadataTool);

    // Environment tools
    registerTool(server, selectEnvironmentTool);

    // QR code tools
    registerTool(server, generateQRCodeTool);

    // Register resource templates
    registerResourceTemplate(server, meetingTranscriptResource);
    registerResourceTemplate(server, meetingMetadataResource);

    // Add a simple echo tool for testing
    server.tool('echo', { message: z.string() }, async ({ message }) => ({
      content: [{ type: 'text', text: `Tool echo: ${message}` }],
    }));
  },
  {
    capabilities: {
      tools: {
        // Meeting tools
        joinMeeting: {
          description: 'Join a meeting via URL or ID',
        },
        leaveMeeting: {
          description: 'Leave a meeting the bot is currently in',
        },
        getMeetingData: {
          description: 'Get data about a meeting recording, including transcript and metadata',
        },
        getMeetingDataWithCredentials: {
          description: 'Get data about a meeting using provided credentials',
        },
        getMeetingTranscript: {
          description: 'Get transcript for a specific meeting',
        },
        // Calendar tools
        oauthGuidance: {
          description: 'Get guidance on setting up OAuth for calendar integration',
        },
        listRawCalendars: {
          description: 'List all raw calendar data',
        },
        setupCalendarOAuth: {
          description: 'Set up OAuth for calendar integration',
        },
        listCalendars: {
          description: 'List all calendars',
        },
        getCalendar: {
          description: 'Get a specific calendar by ID',
        },
        deleteCalendar: {
          description: 'Delete a calendar',
        },
        resyncAllCalendars: {
          description: 'Resync all calendars',
        },
        listUpcomingMeetings: {
          description: 'List upcoming meetings',
        },
        listEvents: {
          description: 'List events from calendars',
        },
        listEventsWithCredentials: {
          description: 'List events using provided credentials',
        },
        getEvent: {
          description: 'Get a specific event by ID',
        },
        scheduleRecording: {
          description: 'Schedule a recording for a meeting',
        },
        scheduleRecordingWithCredentials: {
          description: 'Schedule a recording using provided credentials',
        },
        cancelRecording: {
          description: 'Cancel a scheduled recording',
        },
        cancelRecordingWithCredentials: {
          description: 'Cancel a recording using provided credentials',
        },
        checkCalendarIntegration: {
          description: 'Check if calendar integration is set up',
        },
        // Link tools
        shareableMeetingLink: {
          description: 'Get a shareable link for a meeting recording',
        },
        shareMeetingSegments: {
          description: 'Share specific segments of a meeting recording',
        },
        // Analysis tools
        findKeyMoments: {
          description: 'Find key moments in a meeting recording',
        },
        // Data management tools
        deleteData: {
          description: 'Delete meeting data',
        },
        listBotsWithMetadata: {
          description: 'List bots with metadata',
        },
        // Environment tools
        selectEnvironment: {
          description: 'Select environment (gmeetbot, preprod, prod)',
        },
        // QR code tools
        generateQRCode: {
          description: 'Generate a QR code',
        },
        // Testing tools
        echo: {
          description: 'Echo a message',
        },
      },
      resources: {
        meetingTranscript: {
          description: 'Meeting transcript resources',
        },
        meetingMetadata: {
          description: 'Meeting metadata resources',
        },
      },
    },
  },
);

export default handler;
