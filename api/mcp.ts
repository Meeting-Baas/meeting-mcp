import { ServerCapabilities } from '@anthropic-ai/mcp-server';
import { initializeMcpApiHandler } from '../lib/mcp-api-handler';
import { adaptResourceLoad } from '../lib/resource-adapter';
import { adaptTool } from '../lib/tool-adapter';
import { getApiBaseUrl, setEnvironment } from '../src/config';
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
} from '../src/tools';

// Import resources
import { meetingMetadataResource, meetingTranscriptResource } from '../src/resources';

// Configure server capabilities
const capabilities: ServerCapabilities = {
  name: process.env.MCP_SERVER_NAME || 'Meeting BaaS MCP',
  version: process.env.MCP_SERVER_VERSION || '1.0.0',
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
  },
  resources: {
    meetingTranscript: {
      description: 'Meeting transcript resources',
    },
    meetingMetadata: {
      description: 'Meeting metadata resources',
    },
  },
};

// Create the MCP API handler
const handler = initializeMcpApiHandler((server) => {
  // Environment setup
  // Default to prod environment unless specified otherwise
  const env = process.env.MEETING_BAAS_ENV || 'prod';
  setEnvironment(env as any);
  console.log(`[MCP Server] Environment: ${env} (${getApiBaseUrl()})`);

  // Adapt and register all tools using our adapter function
  // Meeting tools
  const adaptedJoinMeetingTool = adaptTool(joinMeetingTool);
  server.tool(
    adaptedJoinMeetingTool.name,
    adaptedJoinMeetingTool.parameters,
    adaptedJoinMeetingTool.execute,
  );

  const adaptedLeaveMeetingTool = adaptTool(leaveMeetingTool);
  server.tool(
    adaptedLeaveMeetingTool.name,
    adaptedLeaveMeetingTool.parameters,
    adaptedLeaveMeetingTool.execute,
  );

  const adaptedGetMeetingDataTool = adaptTool(getMeetingDataTool);
  server.tool(
    adaptedGetMeetingDataTool.name,
    adaptedGetMeetingDataTool.parameters,
    adaptedGetMeetingDataTool.execute,
  );

  const adaptedGetMeetingDataWithCredentialsTool = adaptTool(getMeetingDataWithCredentialsTool);
  server.tool(
    adaptedGetMeetingDataWithCredentialsTool.name,
    adaptedGetMeetingDataWithCredentialsTool.parameters,
    adaptedGetMeetingDataWithCredentialsTool.execute,
  );

  const adaptedGetTranscriptTool = adaptTool(getTranscriptTool);
  server.tool(
    adaptedGetTranscriptTool.name,
    adaptedGetTranscriptTool.parameters,
    adaptedGetTranscriptTool.execute,
  );

  // Calendar tools
  const adaptedOauthGuidanceTool = adaptTool(oauthGuidanceTool);
  server.tool(
    adaptedOauthGuidanceTool.name,
    adaptedOauthGuidanceTool.parameters,
    adaptedOauthGuidanceTool.execute,
  );

  const adaptedListRawCalendarsTool = adaptTool(listRawCalendarsTool);
  server.tool(
    adaptedListRawCalendarsTool.name,
    adaptedListRawCalendarsTool.parameters,
    adaptedListRawCalendarsTool.execute,
  );

  const adaptedSetupCalendarOAuthTool = adaptTool(setupCalendarOAuthTool);
  server.tool(
    adaptedSetupCalendarOAuthTool.name,
    adaptedSetupCalendarOAuthTool.parameters,
    adaptedSetupCalendarOAuthTool.execute,
  );

  const adaptedListCalendarsTool = adaptTool(listCalendarsTool);
  server.tool(
    adaptedListCalendarsTool.name,
    adaptedListCalendarsTool.parameters,
    adaptedListCalendarsTool.execute,
  );

  const adaptedGetCalendarTool = adaptTool(getCalendarTool);
  server.tool(
    adaptedGetCalendarTool.name,
    adaptedGetCalendarTool.parameters,
    adaptedGetCalendarTool.execute,
  );

  const adaptedDeleteCalendarTool = adaptTool(deleteCalendarTool);
  server.tool(
    adaptedDeleteCalendarTool.name,
    adaptedDeleteCalendarTool.parameters,
    adaptedDeleteCalendarTool.execute,
  );

  const adaptedResyncAllCalendarsTool = adaptTool(resyncAllCalendarsTool);
  server.tool(
    adaptedResyncAllCalendarsTool.name,
    adaptedResyncAllCalendarsTool.parameters,
    adaptedResyncAllCalendarsTool.execute,
  );

  const adaptedListUpcomingMeetingsTool = adaptTool(listUpcomingMeetingsTool);
  server.tool(
    adaptedListUpcomingMeetingsTool.name,
    adaptedListUpcomingMeetingsTool.parameters,
    adaptedListUpcomingMeetingsTool.execute,
  );

  const adaptedListEventsTool = adaptTool(listEventsTool);
  server.tool(
    adaptedListEventsTool.name,
    adaptedListEventsTool.parameters,
    adaptedListEventsTool.execute,
  );

  const adaptedListEventsWithCredentialsTool = adaptTool(listEventsWithCredentialsTool);
  server.tool(
    adaptedListEventsWithCredentialsTool.name,
    adaptedListEventsWithCredentialsTool.parameters,
    adaptedListEventsWithCredentialsTool.execute,
  );

  const adaptedGetEventTool = adaptTool(getEventTool);
  server.tool(
    adaptedGetEventTool.name,
    adaptedGetEventTool.parameters,
    adaptedGetEventTool.execute,
  );

  const adaptedScheduleRecordingTool = adaptTool(scheduleRecordingTool);
  server.tool(
    adaptedScheduleRecordingTool.name,
    adaptedScheduleRecordingTool.parameters,
    adaptedScheduleRecordingTool.execute,
  );

  const adaptedScheduleRecordingWithCredentialsTool = adaptTool(
    scheduleRecordingWithCredentialsTool,
  );
  server.tool(
    adaptedScheduleRecordingWithCredentialsTool.name,
    adaptedScheduleRecordingWithCredentialsTool.parameters,
    adaptedScheduleRecordingWithCredentialsTool.execute,
  );

  const adaptedCancelRecordingTool = adaptTool(cancelRecordingTool);
  server.tool(
    adaptedCancelRecordingTool.name,
    adaptedCancelRecordingTool.parameters,
    adaptedCancelRecordingTool.execute,
  );

  const adaptedCancelRecordingWithCredentialsTool = adaptTool(cancelRecordingWithCredentialsTool);
  server.tool(
    adaptedCancelRecordingWithCredentialsTool.name,
    adaptedCancelRecordingWithCredentialsTool.parameters,
    adaptedCancelRecordingWithCredentialsTool.execute,
  );

  const adaptedCheckCalendarIntegrationTool = adaptTool(checkCalendarIntegrationTool);
  server.tool(
    adaptedCheckCalendarIntegrationTool.name,
    adaptedCheckCalendarIntegrationTool.parameters,
    adaptedCheckCalendarIntegrationTool.execute,
  );

  // Link tools
  const adaptedShareableMeetingLinkTool = adaptTool(shareableMeetingLinkTool);
  server.tool(
    adaptedShareableMeetingLinkTool.name,
    adaptedShareableMeetingLinkTool.parameters,
    adaptedShareableMeetingLinkTool.execute,
  );

  const adaptedShareMeetingSegmentsTool = adaptTool(shareMeetingSegmentsTool);
  server.tool(
    adaptedShareMeetingSegmentsTool.name,
    adaptedShareMeetingSegmentsTool.parameters,
    adaptedShareMeetingSegmentsTool.execute,
  );

  // Analysis tools
  const adaptedFindKeyMomentsTool = adaptTool(findKeyMomentsTool);
  server.tool(
    adaptedFindKeyMomentsTool.name,
    adaptedFindKeyMomentsTool.parameters,
    adaptedFindKeyMomentsTool.execute,
  );

  // Data management tools
  const adaptedDeleteDataTool = adaptTool(deleteDataTool);
  server.tool(
    adaptedDeleteDataTool.name,
    adaptedDeleteDataTool.parameters,
    adaptedDeleteDataTool.execute,
  );

  const adaptedListBotsWithMetadataTool = adaptTool(listBotsWithMetadataTool);
  server.tool(
    adaptedListBotsWithMetadataTool.name,
    adaptedListBotsWithMetadataTool.parameters,
    adaptedListBotsWithMetadataTool.execute,
  );

  // Environment tools
  const adaptedSelectEnvironmentTool = adaptTool(selectEnvironmentTool);
  server.tool(
    adaptedSelectEnvironmentTool.name,
    adaptedSelectEnvironmentTool.parameters,
    adaptedSelectEnvironmentTool.execute,
  );

  // QR code tools
  const adaptedGenerateQRCodeTool = adaptTool(generateQRCodeTool);
  server.tool(
    adaptedGenerateQRCodeTool.name,
    adaptedGenerateQRCodeTool.parameters,
    adaptedGenerateQRCodeTool.execute,
  );

  // Register resource templates with adapted load functions
  server.resourceTemplate(
    meetingTranscriptResource.uriTemplate,
    meetingTranscriptResource.name,
    meetingTranscriptResource.mimeType,
    meetingTranscriptResource.arguments,
    adaptResourceLoad(meetingTranscriptResource.load),
  );

  server.resourceTemplate(
    meetingMetadataResource.uriTemplate,
    meetingMetadataResource.name,
    meetingMetadataResource.mimeType,
    meetingMetadataResource.arguments,
    adaptResourceLoad(meetingMetadataResource.load),
  );

  // Event handlers for logging
  server.on('connect', () => {
    console.log(`[MCP Server] Client connected`);
  });

  server.on('disconnect', () => {
    console.log(`[MCP Server] Client disconnected`);
  });
}, capabilities);

export default handler;
