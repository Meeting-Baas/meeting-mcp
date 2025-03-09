/**
 * Meeting BaaS MCP Server
 *
 * Connects Claude and other AI assistants to Meeting BaaS API,
 * allowing them to manage recordings, transcripts, and calendar data.
 */

import { FastMCP } from "fastmcp";
import { SERVER_CONFIG } from "./config.js";
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

// Import tools
import {
  getMeetingDataTool,
  joinMeetingTool,
  leaveMeetingTool,
  listCalendarsTool,
  listUpcomingMeetingsTool,
  scheduleRecordingTool,
  searchTranscriptTool,
  searchTranscriptByTypeTool,
  findMeetingTopicTool,
  searchVideoSegmentTool,
  intelligentSearchTool
} from "./tools/index.js";

// Import resources
import {
  meetingMetadataResource,
  meetingTranscriptResource,
} from "./resources/index.js";

// Define session auth type
type SessionAuth = { apiKey: string };

// Set up proper error logging
// This ensures logs go to stderr instead of stdout to avoid interfering with JSON communication
const serverLog = (message: string) => {
  console.error(`[MCP Server] ${message}`);
};

// Log startup information
serverLog("========== SERVER STARTUP ==========");
serverLog(`Server version: ${SERVER_CONFIG.version}`);
serverLog(`Node version: ${process.version}`);
serverLog(`Running from Claude: ${process.env.MCP_FROM_CLAUDE === 'true' ? 'Yes' : 'No'}`);
serverLog(`Process ID: ${process.pid}`);

// Function to load and process the Claude Desktop config file
async function loadClaudeDesktopConfig() {
  try {
    // Define the expected config path
    const configPath = path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json');
    
    const fileExists = await fs.stat(configPath).then(() => true).catch(() => false);
    if (fileExists) {
      serverLog(`Loading config from: ${configPath}`);
      try {
        const configContent = await fs.readFile(configPath, 'utf8');
        const configJson = JSON.parse(configContent);
        
        // Check for meetingbaas server config
        if (configJson.mcpServers && configJson.mcpServers.meetingbaas) {
          const serverConfig = configJson.mcpServers.meetingbaas;
          
          // Check for headers
          if (serverConfig.headers) {
            // Check for API key header and set it as an environment variable
            if (serverConfig.headers['x-api-key']) {
              const apiKey = serverConfig.headers['x-api-key'];
              process.env.MEETING_BAAS_API_KEY = apiKey;
              serverLog(`API key loaded from config`);
            }
          }
          
          // Check for bot configuration
          if (serverConfig.botConfig) {
            const botConfig = serverConfig.botConfig;
            let configItems = [];
            
            // Set bot name if available
            if (botConfig.name) {
              process.env.MEETING_BOT_NAME = botConfig.name;
              configItems.push("name");
            }
            
            // Set bot image if available
            if (botConfig.image) {
              process.env.MEETING_BOT_IMAGE = botConfig.image;
              configItems.push("image");
            }
            
            // Set bot entry message if available
            if (botConfig.entryMessage) {
              process.env.MEETING_BOT_ENTRY_MESSAGE = botConfig.entryMessage;
              configItems.push("message");
            }
            
            // Set extra fields if available
            if (botConfig.extra) {
              process.env.MEETING_BOT_EXTRA = JSON.stringify(botConfig.extra);
              configItems.push("extra");
            }
            
            if (configItems.length > 0) {
              serverLog(`Bot configuration loaded from config: ${configItems.join(", ")}`);
            }
          }
        }
      } catch (parseError) {
        serverLog(`Error parsing config file: ${parseError}`);
      }
    } else {
      serverLog(`Config file not found at ${configPath}`);
    }
  } catch (error) {
    serverLog(`Error loading config file: ${error}`);
  }
}

// Load the Claude Desktop config and set up the server
(async () => {
  // Load and log the Claude Desktop config
  await loadClaudeDesktopConfig();
  
  // Configure the server
  const server = new FastMCP<SessionAuth>({
    name: SERVER_CONFIG.name,
    version: "1.0.0", // Using explicit semantic version format
    authenticate: async (context: any) => {  // Use 'any' for now to avoid type errors
      try {
        // Get API key from headers, trying multiple possible locations
        let apiKey = 
          // If request object exists (FastMCP newer versions)
          (context.request?.headers && context.request.headers["x-api-key"]) || 
          // Or if headers are directly on the context (older versions)
          (context.headers && context.headers["x-api-key"]);
        
        // If API key wasn't found in headers, try environment variable as fallback
        if (!apiKey && process.env.MEETING_BAAS_API_KEY) {
          apiKey = process.env.MEETING_BAAS_API_KEY;
          serverLog(`Using API key from environment variable`);
        }
        
        if (!apiKey) {
          serverLog(`Authentication failed: No API key found`);
          throw new Response(null, {
            status: 401,
            statusText: "API key required in x-api-key header or as MEETING_BAAS_API_KEY environment variable",
          });
        }
  
        // Ensure apiKey is a string
        const keyValue = Array.isArray(apiKey) ? apiKey[0] : apiKey;
        
        // Return a session object that will be accessible in context.session
        return { apiKey: keyValue };
      } catch (error) {
        serverLog(`Authentication error: ${error}`);
        throw error;
      }
    },
  });
  
  // Register tools and add debug event listeners
  server.on("connect", (event) => {
    serverLog(`Client connected`);
  });
  
  server.on("disconnect", (event) => {
    serverLog(`Client disconnected`);
  });
  
  // Register tools
  server.addTool(joinMeetingTool);
  server.addTool(leaveMeetingTool);
  server.addTool(getMeetingDataTool);
  server.addTool(searchTranscriptTool);
  server.addTool(searchTranscriptByTypeTool);
  server.addTool(findMeetingTopicTool);
  server.addTool(searchVideoSegmentTool);
  server.addTool(intelligentSearchTool);
  server.addTool(listCalendarsTool);
  server.addTool(listUpcomingMeetingsTool);
  server.addTool(scheduleRecordingTool);
  
  // Register resources
  server.addResourceTemplate(meetingTranscriptResource);
  server.addResourceTemplate(meetingMetadataResource);
  
  // Determine transport type based on environment
  // If run from Claude Desktop, use stdio transport
  // Otherwise use SSE transport for web/HTTP interfaces
  const isClaudeDesktop = process.env.MCP_FROM_CLAUDE === 'true';
  
  const transportConfig = isClaudeDesktop 
    ? { 
        transportType: "stdio" as const,
        debug: true
      } 
    : { 
        transportType: "sse" as const,
        sse: {
          endpoint: "/mcp" as `/${string}`,
          port: SERVER_CONFIG.port,
        }
      };
  
  // Start the server
  try {
    server.start(transportConfig);
    
    if (!isClaudeDesktop) {
      serverLog(
        `Meeting BaaS MCP Server started on http://localhost:${SERVER_CONFIG.port}/mcp`
      );
    } else {
      serverLog(`Meeting BaaS MCP Server started in stdio mode for Claude Desktop`);
    }
  } catch (error) {
    serverLog(`Error starting server: ${error}`);
  }
})();
