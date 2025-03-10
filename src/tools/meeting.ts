/**
 * Meeting tool implementation
 */

import type { Context, TextContent, Tool } from "fastmcp";
import { z } from "zod";
import { apiRequest, MeetingBaasClient, SessionAuth } from "../api/client.js";
import { RECORDING_MODES, BOT_CONFIG, SPEECH_TO_TEXT_PROVIDERS, AUDIO_FREQUENCIES } from "../config.js";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createValidSession } from "../utils/auth.js";
import { createTool, MeetingBaaSTool } from "../utils/tool-types.js";

// Define the parameters schemas
const joinMeetingParams = z.object({
  meetingUrl: z.string().url().describe("URL of the meeting to join"),
  botName: z
    .string()
    .optional()
    .describe("Name to display for the bot in the meeting (OPTIONAL: if omitted, will use name from configuration)"),
  botImage: z
    .string()
    .nullable()
    .optional()
    .describe("URL to an image to use for the bot's avatar (OPTIONAL: if omitted, will use image from configuration)"),
  entryMessage: z
    .string()
    .optional()
    .describe("Message the bot will send upon joining the meeting (OPTIONAL: if omitted, will use message from configuration)"),
  deduplicationKey: z
    .string()
    .optional()
    .describe("Unique key to override the 5-minute restriction on joining the same meeting with the same API key"),
  nooneJoinedTimeout: z
    .number()
    .int()
    .optional()
    .describe("Timeout in seconds for the bot to wait for participants to join before leaving (default: 600)"),
  waitingRoomTimeout: z
    .number()
    .int()
    .optional()
    .describe("Timeout in seconds for the bot to wait in the waiting room before leaving (default: 600)"),
  speechToTextProvider: z
    .enum(SPEECH_TO_TEXT_PROVIDERS)
    .optional()
    .describe("Speech-to-text provider to use for transcription (default: Default)"),
  speechToTextApiKey: z
    .string()
    .optional()
    .describe("API key for the speech-to-text provider (if required)"),
  streamingInputUrl: z
    .string()
    .optional()
    .describe("WebSocket URL to stream audio input to the bot"),
  streamingOutputUrl: z
    .string()
    .optional()
    .describe("WebSocket URL to stream audio output from the bot"),
  streamingAudioFrequency: z
    .enum(AUDIO_FREQUENCIES)
    .optional()
    .describe("Audio frequency for streaming (default: 16khz)"),
  reserved: z
    .boolean()
    .default(false)
    .describe("Whether to use a bot from the pool of bots or a new one (new ones are created on the fly and instances can take up to 4 minutes to boot"),
  startTime: z
    .string()
    .optional()
    .describe("ISO datetime string. If provided, the bot will join at this time instead of immediately"),
  recordingMode: z
    .enum(RECORDING_MODES)
    .default("speaker_view")
    .describe("Recording mode"),
  extra: z
    .record(z.string(), z.any())
    .optional()
    .describe("Additional metadata for the meeting (e.g., meeting type, custom summary prompt, search keywords)"),
});

const searchTranscriptParams = z.object({
  meetingId: z.string().describe("ID of the meeting to search"),
  query: z.string().describe("Search query for the transcript"),
});

/**
 * Parameters for getting meeting data
 */
const getMeetingDetailsParams = z.object({
  meetingId: z.string().describe("ID of the meeting to get data for"),
});

/**
 * Parameters for getting meeting data with direct credentials
 */
const getMeetingDetailsWithCredentialsParams = z.object({
  meetingId: z.string().describe("ID of the meeting to get data for"),
  apiKey: z.string().describe("API key for authentication"),
});

const stopRecordingParams = z.object({
  botId: z.string().uuid().describe("ID of the bot that recorded the meeting"),
});

// Define our return types
export type JoinMeetingParams = z.infer<typeof joinMeetingParams>;

/**
 * Function to directly read the Claude Desktop config
 */
function readClaudeDesktopConfig(log: any) {
  try {
    // Define the expected config path
    const configPath = path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json');
    
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const configJson = JSON.parse(configContent);
      
      // Check for meetingbaas server config
      if (configJson.mcpServers && configJson.mcpServers.meetingbaas) {
        const serverConfig = configJson.mcpServers.meetingbaas;
        
        // Check for bot configuration
        if (serverConfig.botConfig) {
          return serverConfig.botConfig;
        }
      }
    }
    return null;
  } catch (error) {
    log.error(`Error reading Claude Desktop config: ${error}`);
    return null;
  }
}

/**
 * Join a meeting
 */
export const joinMeetingTool: MeetingBaaSTool<typeof joinMeetingParams> = createTool(
  "joinMeeting",
  "Have a bot join a meeting now or schedule it for the future. Bot name, image, and entry message will use system defaults if not specified.",
  joinMeetingParams,
  async (args, context) => {
    const { session, log } = context;
    
    // Directly load Claude Desktop config
    const claudeConfig = readClaudeDesktopConfig(log);
    
    // Get bot name (user input, config, or prompt to provide)
    let botName = args.botName;
    
    // If no user-provided name, try Claude config, then BOT_CONFIG
    if (!botName) {
      if (claudeConfig && claudeConfig.name) {
        botName = claudeConfig.name;
      } else if (BOT_CONFIG.defaultBotName) {
        botName = BOT_CONFIG.defaultBotName;
      }
    }
    
    // Get bot image from various sources
    let botImage: string | null | undefined = args.botImage;
    if (botImage === undefined) {
      if (claudeConfig && claudeConfig.image) {
        botImage = claudeConfig.image;
      } else {
        botImage = BOT_CONFIG.defaultBotImage;
      }
    }
    
    // Get entry message from various sources
    let entryMessage = args.entryMessage;
    if (!entryMessage) {
      if (claudeConfig && claudeConfig.entryMessage) {
        entryMessage = claudeConfig.entryMessage;
      } else if (BOT_CONFIG.defaultEntryMessage) {
        entryMessage = BOT_CONFIG.defaultEntryMessage;
      }
    }
    
    // Get extra fields from various sources
    let extra = args.extra;
    if (!extra) {
      if (claudeConfig && claudeConfig.extra) {
        extra = claudeConfig.extra;
      } else if (BOT_CONFIG.defaultExtra) {
        extra = BOT_CONFIG.defaultExtra;
      }
    }
    
    // Only prompt for a name if no name is available from any source
    if (!botName) {
      log.info("No bot name available from any source");
      return {
        content: [
          {
            type: "text" as const,
            text: "Please provide a name for the bot that will join the meeting."
          }
        ],
        isError: true
      };
    }
    
    // Basic logging
    log.info("Joining meeting", { url: args.meetingUrl, botName });
    
    // Use our utility function to get a valid session with API key
    const validSession = createValidSession(session, log);
    
    // Verify we have an API key
    if (!validSession) {
      log.error("Authentication failed - no API key available");
      return {
        content: [
          {
            type: "text" as const,
            text: "Authentication failed. Please configure your API key in Claude Desktop settings."
          }
        ],
        isError: true
      };
    }

    // Prepare API request with the meeting details
    const payload = {
      meeting_url: args.meetingUrl,
      bot_name: botName,
      bot_image: botImage,
      entry_message: entryMessage,
      deduplication_key: args.deduplicationKey,
      reserved: args.reserved,
      recording_mode: args.recordingMode,
      start_time: args.startTime,
      automatic_leave: args.nooneJoinedTimeout || args.waitingRoomTimeout ? {
        noone_joined_timeout: args.nooneJoinedTimeout,
        waiting_room_timeout: args.waitingRoomTimeout
      } : undefined,
      speech_to_text: args.speechToTextProvider ? {
        provider: args.speechToTextProvider,
        api_key: args.speechToTextApiKey
      } : undefined,
      streaming: (args.streamingInputUrl || args.streamingOutputUrl || args.streamingAudioFrequency) ? {
        input: args.streamingInputUrl,
        output: args.streamingOutputUrl,
        audio_frequency: args.streamingAudioFrequency
      } : undefined,
      extra: extra,
    };

    try {
      // Use the client to join the meeting with the API key from our valid session
      const client = new MeetingBaasClient(validSession.apiKey);
      const result = await client.joinMeeting(payload);
      
      // Prepare response message with details
      let responseMessage = `Bot named "${botName}" joined meeting successfully. Bot ID: ${result.bot_id}`;
      if (botImage) responseMessage += "\nCustom bot image is being used.";
      if (entryMessage) responseMessage += "\nThe bot will send an entry message.";
      if (args.startTime) {
        responseMessage += "\nThe bot is scheduled to join at the specified start time.";
      }

      return responseMessage;
    } catch (error) {
      log.error("Failed to join meeting", { error: String(error) });
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to join meeting: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

/**
 * Leave a meeting
 */
export const leaveMeetingTool: MeetingBaaSTool<typeof stopRecordingParams> = createTool(
  "leaveMeeting",
  "Have a bot leave an ongoing meeting",
  stopRecordingParams,
  async (args, context) => {
    const { session, log } = context;
    log.info("Leaving meeting", { botId: args.botId });

    // Create a valid session with fallbacks for API key
    const validSession = createValidSession(session, log);
    
    // Check if we have a valid session with API key
    if (!validSession) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Authentication failed. Please configure your API key in Claude Desktop settings or provide it directly."
          }
        ],
        isError: true
      };
    }

    const response = await apiRequest(validSession, "delete", `/bots/${args.botId}`);
    if (response.ok) {
      return "Bot left the meeting successfully";
    } else {
      return `Failed to make bot leave: ${response.error || "Unknown error"}`;
    }
  }
);

/**
 * Get meeting data
 */
export const getMeetingDataTool: MeetingBaaSTool<typeof getMeetingDetailsParams> = createTool(
  "getMeetingData",
  "Get recording and transcript data from a meeting",
  getMeetingDetailsParams,
  async (args, context) => {
    const { session, log } = context;
    log.info("Getting meeting data", { meetingId: args.meetingId });

    // Create a valid session with fallbacks for API key
    const validSession = createValidSession(session, log);
    
    // Check if we have a valid session with API key
    if (!validSession) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Authentication failed. Please configure your API key in Claude Desktop settings or provide it directly."
          }
        ],
        isError: true
      };
    }

    const response = await apiRequest(
      validSession,
      "get",
      `/bots/meeting_data?bot_id=${args.meetingId}`
    );

    // Create a summary of the meeting
    const duration = response.duration;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    const transcriptCount = response.bot_data.transcripts.length;

    return {
      content: [
        {
          type: "text" as const,
          text: `Meeting recording is available. Duration: ${minutes}m ${seconds}s. Contains ${transcriptCount} transcript segments.`,
        },
      ],
      error: false,
      json: response,
    };
  }
);

/**
 * Get meeting data with direct credentials
 */
export const getMeetingDataWithCredentialsTool: MeetingBaaSTool<typeof getMeetingDetailsWithCredentialsParams> = createTool(
  "getMeetingDataWithCredentials",
  "Get recording and transcript data from a meeting using direct API credentials",
  getMeetingDetailsWithCredentialsParams,
  async (args, context) => {
    const { log } = context;
    log.info("Getting meeting data with direct credentials", { meetingId: args.meetingId });

    // Create a session object with the provided API key
    const session: SessionAuth = { apiKey: args.apiKey };

    const response = await apiRequest(
      session,
      "get",
      `/bots/meeting_data?bot_id=${args.meetingId}`
    );

    // Create a summary of the meeting
    const duration = response.duration;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    const transcriptCount = response.bot_data.transcripts.length;

    return {
      content: [
        {
          type: "text" as const,
          text: `Meeting recording is available. Duration: ${minutes}m ${seconds}s. Contains ${transcriptCount} transcript segments.`,
        },
      ],
      error: false,
      json: response,
    };
  }
);
