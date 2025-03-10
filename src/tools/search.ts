/**
 * MCP tools for searching meeting content
 */

import type { Context, TextContent } from "fastmcp";
import { z } from "zod";
import { apiRequest } from "../api/client.js";
import { Transcript } from "../types/index.js";
import { formatTime } from "../utils/formatters.js";
import { getTinyDb, BotRecord } from "../utils/tinyDb.js";
import { createValidSession } from "../utils/auth.js";

// Define our session auth type
type SessionAuth = { apiKey: string };

// Update the SessionAuth interface to include recentBotIds
interface ExtendedSessionAuth extends SessionAuth {
  recentBotIds?: string[];
}

// Define the parameters schema
const searchTranscriptParams = z.object({
  botId: z.string().uuid().describe("ID of the bot that recorded the meeting"),
  query: z.string().describe("Text to search for in the transcript"),
});

// New schema for searching by meeting type
const searchTranscriptByTypeParams = z.object({
  meetingType: z.string().describe("Type of meeting to search (e.g., 'sales', 'psychiatric', 'standup')"),
  query: z.string().describe("Text to search for in the transcripts"),
  limit: z.number().int().min(1).max(50).default(10).describe("Maximum number of results to return"),
});

// New schema for finding meeting topics
const findMeetingTopicParams = z.object({
  meetingId: z.string().describe("ID of the meeting to search"),
  topic: z.string().describe("Topic to search for"),
});

// New schema for searching video segments by timestamp
const searchVideoSegmentParams = z.object({
  botId: z.string().uuid().describe("ID of the bot that recorded the meeting"),
  startTime: z.number().optional().describe("Start time in seconds (optional)"),
  endTime: z.number().optional().describe("End time in seconds (optional)"),
  speaker: z.string().optional().describe("Filter by speaker name (optional)"),
});

// New schema for intelligent search with flexible parameters
const intelligentSearchParams = z.object({
  query: z.string().describe("Natural language search query - can include mentions of meeting types, topics, speakers, dates, or any search terms"),
  filters: z.record(z.string(), z.any()).optional().describe("Optional filters to narrow search results (meetingType, speaker, dateRange, etc.)"),
  includeContext: z.boolean().optional().default(true).describe("Whether to include conversation context around matching segments"),
  maxResults: z.number().int().min(1).max(50).optional().default(20).describe("Maximum number of results to return"),
  sortBy: z.enum(["relevance", "date", "speaker"]).optional().default("relevance").describe("How to sort the results"),
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

// Update the Transcript interface to include end_time
interface ExtendedTranscript extends Transcript {
  end_time?: number;
  bot_name?: string;
  meeting_url?: string;
  bot_id?: string;
  meeting_type?: string;
}

// Define interfaces for the calendar event data structure
interface CalendarEvent {
  name: string;
  uuid: string;
  start_time: string;
  bot_param: {
    uuid?: string;
    extra?: {
      meetingType?: string;
    };
  } | null;
}

/**
 * Search meeting transcripts
 */
export const searchTranscriptTool: Tool<typeof searchTranscriptParams> = {
  name: "searchTranscript",
  description: "Search through meeting transcripts for specific content",
  parameters: searchTranscriptParams,
  execute: async (args, context) => {
    const { session, log } = context;
    const extendedSession = session as ExtendedSessionAuth;
    log.info("Searching transcripts", { botId: args.botId, query: args.query });

    const response = await apiRequest(
      session,
      "get",
      `/bots/meeting_data?bot_id=${args.botId}`
    );

    // Track this bot in our TinyDB
    const metadata = extractBotMetadata(response);
    updateRecentBots(extendedSession, args.botId, metadata);

    const transcripts: Transcript[] = response.bot_data.transcripts;
    const results = transcripts.filter((transcript: Transcript) => {
      const text = transcript.words
        .map((word: { text: string }) => word.text)
        .join(" ");
      return text.toLowerCase().includes(args.query.toLowerCase());
    });

    if (results.length === 0) {
      return `No results found for "${args.query}"`;
    }

    // Format the results
    const formattedResults = results
      .map((transcript: Transcript) => {
        const text = transcript.words
          .map((word: { text: string }) => word.text)
          .join(" ");
        const startTime = formatTime(transcript.start_time);
        const speaker = transcript.speaker;

        return `[${startTime}] ${speaker}: ${text}`;
      })
      .join("\n\n");

    return `Found ${results.length} results for "${args.query}":\n\n${formattedResults}`;
  },
};

/**
 * Search transcripts by meeting type
 * This tool leverages the 'extra' field to search for content in specific meeting types
 */
export const searchTranscriptByTypeTool: Tool<typeof searchTranscriptByTypeParams> = {
  name: "searchTranscriptByType",
  description: "Search through meeting transcripts of a specific meeting type",
  parameters: searchTranscriptByTypeParams,
  execute: async (args, context) => {
    const { session, log } = context;
    const extendedSession = session as ExtendedSessionAuth;
    log.info("Searching transcripts by type", { 
      meetingType: args.meetingType, 
      query: args.query, 
      limit: args.limit 
    });

    // First, get list of all bots
    const botsResponse = await apiRequest(
      session,
      "get",
      `/bots/`
    );

    // Filter bots by meeting type using the 'extra' field
    const filteredBots = botsResponse.filter((bot: any) => {
      return bot.extra && 
             bot.extra.meetingType && 
             bot.extra.meetingType.toLowerCase() === args.meetingType.toLowerCase();
    });

    if (filteredBots.length === 0) {
      return `No meetings found with type "${args.meetingType}"`;
    }

    // Search each matching bot's transcripts
    let allResults: any[] = [];
    for (const bot of filteredBots.slice(0, args.limit)) {
      try {
        const response = await apiRequest(
          session,
          "get",
          `/bots/meeting_data?bot_id=${bot.uuid}`
        );

        // Track this bot in our TinyDB
        const metadata = extractBotMetadata(response);
        updateRecentBots(extendedSession, bot.uuid, metadata);

        if (response.bot_data && response.bot_data.transcripts) {
          const transcripts: Transcript[] = response.bot_data.transcripts;
          const results = transcripts.filter((transcript: Transcript) => {
            const text = transcript.words
              .map((word: { text: string }) => word.text)
              .join(" ");
            return text.toLowerCase().includes(args.query.toLowerCase());
          }).map(transcript => {
            return {
              ...transcript,
              bot_name: response.bot_data.bot.bot_name,
              meeting_url: response.bot_data.bot.meeting_url,
              bot_id: bot.uuid,
              meeting_type: args.meetingType
            };
          });
          
          allResults = [...allResults, ...results];
        }
      } catch (error) {
        log.error(`Error searching bot ${bot.uuid}`, { error: String(error) });
        // Continue with other bots even if one fails
      }
    }

    // Sort results by start_time
    allResults.sort((a, b) => a.start_time - b.start_time);
    
    // Limit results
    allResults = allResults.slice(0, args.limit);

    if (allResults.length === 0) {
      return `No results found for "${args.query}" in "${args.meetingType}" meetings`;
    }

    // Format the results
    const formattedResults = allResults
      .map((result) => {
        const text = result.words
          .map((word: { text: string }) => word.text)
          .join(" ");
        const startTime = formatTime(result.start_time);
        const speaker = result.speaker;
        const botName = result.bot_name;

        return `Bot: ${botName}\n[${startTime}] ${speaker}: ${text}\nView full meeting: ${result.meeting_url}`;
      })
      .join("\n\n");

    return `Found ${allResults.length} results for "${args.query}" in "${args.meetingType}" meetings:\n\n${formattedResults}`;
  },
};

/**
 * Find specific topics within meeting content
 */
export const findMeetingTopicTool: Tool<typeof findMeetingTopicParams> = {
  name: "findMeetingTopic",
  description: "Search for specific topics discussed in a meeting",
  parameters: findMeetingTopicParams,
  execute: async (args, context) => {
    const { session, log } = context;
    const extendedSession = session as ExtendedSessionAuth;
    log.info("Finding meeting topic", { meetingId: args.meetingId, topic: args.topic });

    const response = await apiRequest(
      session,
      "get",
      `/bots/meeting_data?meeting_id=${args.meetingId}`
    );

    // Track this bot in our TinyDB
    const metadata = extractBotMetadata(response);
    updateRecentBots(extendedSession, args.meetingId, metadata);

    // Get complete transcript text
    const transcripts: Transcript[] = response.bot_data.transcripts;
    
    // Combine all transcript segments into a single text
    const fullText = transcripts.map((transcript: Transcript) => {
      const text = transcript.words
        .map((word: { text: string }) => word.text)
        .join(" ");
      return `[${formatTime(transcript.start_time)}] ${transcript.speaker}: ${text}`;
    }).join("\n");
    
    // Check if the topic is mentioned anywhere
    if (!fullText.toLowerCase().includes(args.topic.toLowerCase())) {
      return `Topic "${args.topic}" was not discussed in this meeting.`;
    }
    
    // Find contextual segments that mention the topic
    const results = transcripts.filter((transcript: Transcript) => {
      const text = transcript.words
        .map((word: { text: string }) => word.text)
        .join(" ");
      return text.toLowerCase().includes(args.topic.toLowerCase());
    });

    // Get surrounding context (transcript segments before and after matches)
    let contextualResults: Transcript[] = [];
    for (let i = 0; i < results.length; i++) {
      const resultIndex = transcripts.findIndex(t => t.start_time === results[i].start_time);
      
      // Get up to 2 segments before and after the match for context
      const startIdx = Math.max(0, resultIndex - 2);
      const endIdx = Math.min(transcripts.length - 1, resultIndex + 2);
      
      for (let j = startIdx; j <= endIdx; j++) {
        if (!contextualResults.includes(transcripts[j])) {
          contextualResults.push(transcripts[j]);
        }
      }
    }
    
    // Sort by start time
    contextualResults.sort((a, b) => a.start_time - b.start_time);
    
    // Format the results with context
    const formattedResults = contextualResults
      .map((transcript: Transcript) => {
        const text = transcript.words
          .map((word: { text: string }) => word.text)
          .join(" ");
        const startTime = formatTime(transcript.start_time);
        const speaker = transcript.speaker;
        
        const highlightedText = text.replace(
          new RegExp(`(${args.topic})`, "gi"), 
          "**$1**"
        );

        return `[${startTime}] ${speaker}: ${highlightedText}`;
      })
      .join("\n\n");

    return `Found topic "${args.topic}" in the meeting with context:\n\n${formattedResults}\n\nVideo URL: ${response.mp4}`;
  },
};

/**
 * Search for specific video segments using timestamps
 */
export const searchVideoSegmentTool: Tool<typeof searchVideoSegmentParams> = {
  name: "searchVideoSegment",
  description: "Find specific segments of a meeting recording based on time range or speaker",
  parameters: searchVideoSegmentParams,
  execute: async (args, context) => {
    const { session, log } = context;
    const extendedSession = session as ExtendedSessionAuth;
    log.info("Searching video segments", { 
      botId: args.botId, 
      startTime: args.startTime, 
      endTime: args.endTime,
      speaker: args.speaker
    });

    const response = await apiRequest(
      session,
      "get",
      `/bots/meeting_data?bot_id=${args.botId}`
    );

    // Track this bot in our TinyDB
    const metadata = extractBotMetadata(response);
    updateRecentBots(extendedSession, args.botId, metadata);

    const transcripts: Transcript[] = response.bot_data.transcripts;
    
    // Filter transcripts based on parameters
    let filteredTranscripts = transcripts;
    
    // Apply time range filter if provided
    if (args.startTime !== undefined || args.endTime !== undefined) {
      filteredTranscripts = filteredTranscripts.filter((transcript: ExtendedTranscript) => {
        // Calculate approximate end time (start_time + 5 seconds is a reasonable estimate if not available)
        const endTime = transcript.end_time !== undefined ? transcript.end_time : transcript.start_time + 5;
        
        // Check if transcript is within the specified time range
        if (args.startTime !== undefined && transcript.start_time < args.startTime) {
          return false;
        }
        if (args.endTime !== undefined && endTime > args.endTime) {
          return false;
        }
        return true;
      });
    }
    
    // Apply speaker filter if provided
    if (args.speaker) {
      filteredTranscripts = filteredTranscripts.filter((transcript: Transcript) => {
        return transcript.speaker.toLowerCase().includes(args.speaker!.toLowerCase());
      });
    }

    if (filteredTranscripts.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No matching video segments found based on your criteria."
          }
        ]
      };
    }

    // Format the results with direct video links
    const videoBaseUrl = response.mp4.split("?")[0]; // Remove any query parameters
    
    // Get the time boundaries
    const firstSegmentTime = filteredTranscripts[0].start_time;
    const lastSegmentTime = filteredTranscripts[filteredTranscripts.length - 1].start_time;
    
    // Create a timestamped video URL
    const videoUrlWithTimestamp = `${videoBaseUrl}?t=${Math.floor(firstSegmentTime)}`;
    
    // Format individual segments
    const formattedSegments = filteredTranscripts
      .map((transcript: Transcript) => {
        const text = transcript.words
          .map((word: { text: string }) => word.text)
          .join(" ");
        const startTime = formatTime(transcript.start_time);
        const speaker = transcript.speaker;
        
        // Create a segment-specific timestamped URL
        const segmentUrl = `${videoBaseUrl}?t=${Math.floor(transcript.start_time)}`;

        return `[${startTime}] ${speaker}: ${text}\nSegment link: ${segmentUrl}`;
      })
      .join("\n\n");

    const meetingDetails = response.bot_data.bot;
    
    return {
      content: [
        {
          type: "text" as const,
          text: `Found ${filteredTranscripts.length} segments from ${formatTime(firstSegmentTime)} to ${formatTime(lastSegmentTime)} in meeting "${meetingDetails.bot_name}".`
        },
        {
          type: "text" as const,
          text: `Watch from beginning of segment: ${videoUrlWithTimestamp}`
        },
        {
          type: "text" as const,
          text: `Individual segments:\n\n${formattedSegments}`
        }
      ]
    };
  },
};

/**
 * Intelligent adaptive search across all meeting data
 * This tool dynamically adjusts its search strategy based on the query and available context
 */
export const intelligentSearchTool: Tool<typeof intelligentSearchParams> = {
  name: "intelligentSearch",
  description: "Performs an intelligent search across meeting data, adapting to the query and available context",
  parameters: intelligentSearchParams,
  execute: async (args, context) => {
    const { session, log } = context;
    const extendedSession = session as ExtendedSessionAuth;
    
    log.info("Performing intelligent search", { 
      query: args.query,
      filters: args.filters,
      maxResults: args.maxResults
    });

    try {
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
      
      // Initialize our TinyDB for persistent bot tracking
      const db = getTinyDb();
      
      // Load recent bots from the persistent store into the session
      db.updateSession(extendedSession);
      
      // Rest of the determination logic remains similar
      let searchApproach = "unknown";
      let botId: string | null = null;
      let calendarId: string | null = null;
      let meetingType: string | null = null;
      let speaker: string | null = null;
      let timeRange = { startTime: undefined as number | undefined, endTime: undefined as number | undefined };
      
      // Extract potential bot ID from query or filters
      const botIdMatch = args.query.match(/(?:meeting|bot)(?:\s+id|\s+uuid)?[\s:]+([a-f0-9-]{8,})/i);
      if (botIdMatch && botIdMatch[1]) {
        botId = botIdMatch[1];
        searchApproach = "bot-id";
        log.info(`Found bot ID in query: ${botId}`);
      } else if (args.filters?.botId) {
        botId = args.filters.botId;
        searchApproach = "bot-id";
        log.info(`Using bot ID from filters: ${botId}`);
      }
      
      // Use the stored bot data to enhance our search capabilities
      if (!botId) {
        // Try to identify a bot by topic or meeting type from the query
        const keyterms = args.query.toLowerCase().split(/\s+/);
        const recentBots = db.getRecentBots(10); // Get more bots for better matching
        
        for (const bot of recentBots) {
          // Check if the query contains any of the bot's topics
          if (bot.topics && bot.topics.length > 0) {
            const matchesTopic = bot.topics.some(topic => 
              keyterms.includes(topic.toLowerCase())
            );
            
            if (matchesTopic) {
              botId = bot.id;
              searchApproach = "topic-match";
              log.info(`Matched topic in bot ${botId}: ${bot.topics.join(', ')}`);
              break;
            }
          }
          
          // Check if query mentions meeting type
          if (bot.meetingType && args.query.toLowerCase().includes(bot.meetingType.toLowerCase())) {
            botId = bot.id;
            searchApproach = "meeting-type-match";
            log.info(`Matched meeting type in bot ${botId}: ${bot.meetingType}`);
            break;
          }
          
          // Check if query mentions any participants
          if (bot.participants && bot.participants.length > 0) {
            const matchesParticipant = bot.participants.some(participant => 
              args.query.toLowerCase().includes(participant.toLowerCase())
            );
            
            if (matchesParticipant) {
              botId = bot.id;
              searchApproach = "participant-match";
              log.info(`Matched participant in bot ${botId}`);
              break;
            }
          }
        }
      }
      
      // Check if we have a calendar ID 
      if (args.filters?.calendarId) {
        calendarId = args.filters.calendarId;
        searchApproach = "calendar";
        log.info(`Using calendar ID from filters: ${calendarId}`);
      }
      
      // Check for recent session bots if we don't have a specific bot ID
      if (!botId && !calendarId && extendedSession?.recentBotIds && Array.isArray(extendedSession.recentBotIds) && extendedSession.recentBotIds.length > 0) {
        log.info(`Using recent bots from session: ${extendedSession.recentBotIds.join(', ')}`);
        searchApproach = "recent-bots";
      }
      
      // Extract other potential filters
      if (args.filters?.meetingType) {
        meetingType = args.filters.meetingType;
        log.info(`Using meeting type from filters: ${meetingType}`);
      } else {
        // Try to extract meeting type from query
        const meetingTypePatterns = [
          { regex: /sales\s+meeting/i, type: "sales" },
          { regex: /psychiatric|therapy|mental\s+health/i, type: "psychiatric" },
          { regex: /standup|scrum|daily/i, type: "standup" },
          { regex: /interview/i, type: "interview" },
          { regex: /product/i, type: "product" },
          { regex: /planning/i, type: "planning" }
        ];

        for (const pattern of meetingTypePatterns) {
          if (pattern.regex.test(args.query)) {
            meetingType = pattern.type;
            log.info(`Extracted meeting type from query: ${meetingType}`);
            break;
          }
        }
      }
      
      if (args.filters?.speaker) {
        speaker = args.filters.speaker;
      } else {
        // Try to extract speaker from query
        const speakerMatch = args.query.match(/(?:where|when|what)\s+(?:did|does|was)\s+([a-z]+)(?:\s+[a-z]+)?\s+(?:say|talk|speak|mention)/i);
        if (speakerMatch) {
          speaker = speakerMatch[1];
          log.info(`Extracted speaker from query: ${speaker}`);
        }
      }
      
      // Extract time filters if specified
      if (args.filters?.startTime !== undefined) {
        timeRange.startTime = args.filters.startTime;
      }
      
      if (args.filters?.endTime !== undefined) {
        timeRange.endTime = args.filters.endTime;
      }
      
      // Try to extract time ranges from query
      const timePatterns = [
        { regex: /between\s+(\d+)(?::(\d+))?\s+(?:and|to)\s+(\d+)(?::(\d+))?/i, type: "range" },
        { regex: /after\s+(\d+)(?::(\d+))?/i, type: "after" },
        { regex: /before\s+(\d+)(?::(\d+))?/i, type: "before" },
        { regex: /around\s+(\d+)(?::(\d+))?/i, type: "around" }
      ];
      
      for (const pattern of timePatterns) {
        const match = args.query.match(pattern.regex);
        if (match) {
          if (pattern.type === "range" && match[1] && match[3]) {
            const startMinutes = parseInt(match[1]) * 60 + (match[2] ? parseInt(match[2]) : 0);
            const endMinutes = parseInt(match[3]) * 60 + (match[4] ? parseInt(match[4]) : 0);
            timeRange.startTime = startMinutes;
            timeRange.endTime = endMinutes;
          } else if (pattern.type === "after" && match[1]) {
            const minutes = parseInt(match[1]) * 60 + (match[2] ? parseInt(match[2]) : 0);
            timeRange.startTime = minutes;
          } else if (pattern.type === "before" && match[1]) {
            const minutes = parseInt(match[1]) * 60 + (match[2] ? parseInt(match[2]) : 0);
            timeRange.endTime = minutes;
          } else if (pattern.type === "around" && match[1]) {
            const minutes = parseInt(match[1]) * 60 + (match[2] ? parseInt(match[2]) : 0);
            timeRange.startTime = Math.max(0, minutes - 60); // 1 minute before
            timeRange.endTime = minutes + 60; // 1 minute after
          }
          log.info(`Extracted time range: ${JSON.stringify(timeRange)}`);
          break;
        }
      }
      
      // Extract the core search terms (removing filter-related phrases)
      let searchTerms = args.query
        .replace(/in\s+(sales|psychiatric|standup|interview|product|planning)\s+meetings?/gi, '')
        .replace(/from\s+yesterday|last\s+(week|day|month)|this\s+(month|quarter)/gi, '')
        .replace(/where\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?\s+(speak|said|talk|mention)/gi, '')
        .replace(/(?:meeting|bot)\s+(?:id|uuid)[\s:]+([a-f0-9-]{8,})/gi, '')
        .replace(/between\s+\d+(?::\d+)?\s+(?:and|to)\s+\d+(?::\d+)?/gi, '')
        .replace(/(?:after|before|around)\s+\d+(?::\d+)?/gi, '')
        .trim();
        
      // If the cleaning removed everything, use the original query
      if (!searchTerms) {
        searchTerms = args.query;
      }
      
      log.info(`Search terms after filtering: ${searchTerms}`);
      log.info(`Search approach: ${searchApproach}`);

      // Step 2: Execute search based on available information
      
      // Approach 1: Direct Bot ID search - most straightforward approach
      if (searchApproach === "bot-id" || searchApproach === "topic-match" || 
          searchApproach === "meeting-type-match" || searchApproach === "participant-match") {
        if (!botId) {
          return "Could not determine which meeting to search. Please provide a bot ID or more specific information.";
        }
        
        log.info(`Searching specific bot with ID: ${botId}`);
        
        try {
          // Get bot metadata to enhance response
          const botData = await apiRequest(
            validSession,
            "get",
            `/bots/meeting_data?bot_id=${botId}`
          );
          
          // Extract and store metadata for future searches
          const metadata = extractBotMetadata(botData);
          
          // Decide which search tool to use based on additional parameters
          if (speaker || (timeRange.startTime !== undefined || timeRange.endTime !== undefined)) {
            // Use video segment search for time/speaker filtering
            const result = await searchVideoSegmentTool.execute({
              botId: botId,
              startTime: timeRange.startTime,
              endTime: timeRange.endTime,
              speaker: speaker || undefined // Convert null to undefined
            }, context);
            
            // Update the persisted database with this bot's metadata
            updateRecentBots(extendedSession, botId, metadata);
            
            return result;
          } else {
            // Use standard transcript search
            const result = await searchTranscriptTool.execute({
              botId: botId,
              query: args.query
            }, context);
            
            // Update the persisted database with this bot's metadata
            updateRecentBots(extendedSession, botId, metadata);
            
            return result;
          }
        } catch (error) {
          log.error(`Error fetching bot data for ${botId}`, { error: String(error) });
          return `Error retrieving bot data: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
      
      // Approach 2: Calendar-based search
      if (searchApproach === "calendar" && calendarId) {
        log.info(`Searching calendar events for calendar ID: ${calendarId}`);
        
        try {
          // Get calendar events
          const eventsResponse = await apiRequest(
            validSession,
            "get",
            `/calendar_events/?calendar_id=${calendarId}&start_date_gte=${timeRange.startTime}&start_date_lte=${timeRange.endTime}&status=all`
          );
          
          if (!eventsResponse || !eventsResponse.data || !Array.isArray(eventsResponse.data)) {
            return "No calendar events found for the specified calendar.";
          }
          
          // Filter events with bot parameters (these are the ones that have recordings)
          const eventsWithBots = eventsResponse.data.filter((event: CalendarEvent) => event.bot_param !== null);
          
          if (eventsWithBots.length === 0) {
            return "No recorded meetings found in this calendar.";
          }
          
          // Filter by meeting type if specified
          let filteredEvents = eventsWithBots;
          if (meetingType) {
            filteredEvents = filteredEvents.filter((event: CalendarEvent) => {
              return event.bot_param?.extra?.meetingType === meetingType;
            });
            
            if (filteredEvents.length === 0) {
              return `No ${meetingType} meetings found in this calendar.`;
            }
          }
          
          // For each event with a bot, try to get the bot ID and search
          let matchingResults = [];
          let numEventsSearched = 0;
          
          for (const event of filteredEvents.slice(0, 5)) { // Limit to 5 events to prevent too many API calls
            try {
              // Check if the event has the bot_id directly
              let eventBotId: string | undefined = undefined;
              
              // Try to get the bot UUID from the event data
              if (event.bot_param && event.bot_param.uuid) {
                eventBotId = event.bot_param.uuid;
              }
              
              if (!eventBotId) {
                // Without a bot ID, we can't search the transcript
                continue;
              }
              
              numEventsSearched++;
              
              // Use the same search logic as for direct bot ID
              const result = await searchTranscriptTool.execute({
                botId: eventBotId,
                query: searchTerms
              }, context);
              
              // If we got a meaningful result, add it to our results
              if (typeof result === 'string' && !(result as string).startsWith("No results found")) {
                matchingResults.push({
                  event: event,
                  botId: eventBotId,
                  result: result
                });
                
                // Update session with the bot ID
                updateRecentBots(extendedSession, eventBotId);
              }
            } catch (error) {
              log.error(`Error searching event ${event.uuid}`, { error: String(error) });
              // Continue with other events
            }
          }
          
          if (matchingResults.length === 0) {
            return `Searched ${numEventsSearched} calendar events but found no matches for "${searchTerms}".`;
          }
          
          // Format the results
          let responseText = `Found matches in ${matchingResults.length} calendar events:\n\n`;
          
          matchingResults.forEach((match, index) => {
            const event: CalendarEvent = match.event;
            const eventName = event.name;
            const eventDate = new Date(event.start_time).toLocaleString();
            
            responseText += `--- MEETING ${index + 1}: ${eventName} (${eventDate}) ---\n`;
            responseText += match.result;
            responseText += "\n\n";
          });
          
          return responseText;
        } catch (error) {
          log.error(`Error searching calendar events`, { error: String(error) });
          return `Error searching calendar events: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
      
      // Approach 3: Search recent bots from session
      if (searchApproach === "recent-bots" && extendedSession?.recentBotIds && extendedSession.recentBotIds.length > 0) {
        log.info(`Searching recent bots from session: ${extendedSession.recentBotIds.join(', ')}`);
        
        let matchingResults = [];
        
        // Try each recent bot
        for (const recentBotId of extendedSession.recentBotIds) {
          try {
            const result = searchTranscriptTool.execute({
              botId: recentBotId,
              query: searchTerms
            }, context);
            
            // If we got a meaningful result, add it to our results
            if (typeof result === 'string' && !(result as string).startsWith("No results found")) {
              // Get bot details to add context
              try {
                const botData = await apiRequest(
                  validSession,
                  "get",
                  `/bots/meeting_data?bot_id=${recentBotId}`
                );
                
                matchingResults.push({
                  botId: recentBotId,
                  botName: botData.bot_data.bot.bot_name || 'Unnamed Bot',
                  meetingUrl: botData.bot_data.bot.meeting_url || 'Unknown URL',
                  meetingType: botData.bot_data.bot.extra?.meetingType || 'Unknown Type',
                  result: result
                });
              } catch (botError) {
                // If we can't get bot details, just add the results without context
                matchingResults.push({
                  botId: recentBotId,
                  result: result
                });
              }
            }
          } catch (error) {
            log.error(`Error searching recent bot ${recentBotId}`, { error: String(error) });
            // Continue with other bots
          }
        }
        
        if (matchingResults.length === 0) {
          return `Searched your recent meetings but found no matches for "${searchTerms}".`;
        }
        
        // Format the results
        let responseText = `Found matches in ${matchingResults.length} recent meetings:\n\n`;
        
        matchingResults.forEach((match, index) => {
          responseText += `--- MEETING ${index + 1} ---\n`;
          if (match.botName) responseText += `Meeting: ${match.botName}\n`;
          if (match.meetingType) responseText += `Type: ${match.meetingType}\n`;
          if (match.meetingUrl) responseText += `URL: ${match.meetingUrl}\n\n`;
          
          responseText += match.result;
          responseText += "\n\n";
        });
        
        return responseText;
      }
      
      // Fallback if no approach worked or was identified
      return "To search meeting content, please provide either a bot ID, a calendar ID, or ensure you've recently used the tool with specific meetings. You can specify the bot ID directly in your query or use filters.";
      
    } catch (error) {
      log.error("Error in intelligent search", { error: String(error) });
      return `An error occurred during the search: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
};

// Helper function to update the session with recently used bot IDs
function updateRecentBots(session: ExtendedSessionAuth, botId: string, botMetadata?: Partial<BotRecord>) {
  // Update the in-memory session for immediate use
  if (!session.recentBotIds) {
    session.recentBotIds = [];
  }
  
  // Remove this bot ID if it already exists in the list
  session.recentBotIds = session.recentBotIds.filter(id => id !== botId);
  
  // Add this bot ID to the front of the list
  session.recentBotIds.unshift(botId);
  
  // Keep only the 5 most recent bot IDs
  if (session.recentBotIds.length > 5) {
    session.recentBotIds = session.recentBotIds.slice(0, 5);
  }
  
  // Update the persistent database with this bot and its metadata
  const db = getTinyDb();
  db.trackBot({
    id: botId,
    ...(botMetadata || {})
  });
}

// Helper function to extract bot metadata from API response
function extractBotMetadata(apiResponse: any): Partial<BotRecord> {
  if (!apiResponse || !apiResponse.bot_data || !apiResponse.bot_data.bot) {
    return {};
  }
  
  const bot = apiResponse.bot_data.bot;
  
  // Extract key topics from transcripts if available
  const topics: string[] = [];
  if (apiResponse.bot_data.transcripts && Array.isArray(apiResponse.bot_data.transcripts)) {
    // This is a simplified approach - in a real implementation, you might
    // use NLP to extract actual topics from the transcript text
    const transcriptText = apiResponse.bot_data.transcripts
      .map((t: any) => t.words?.map((w: any) => w.text).join(' ') || '')
      .join(' ');
      
    // Extract common keywords as potential topics
    const commonKeywords = ['budget', 'project', 'deadline', 'timeline', 'goals', 'product'];
    commonKeywords.forEach(keyword => {
      if (transcriptText.toLowerCase().includes(keyword.toLowerCase())) {
        topics.push(keyword);
      }
    });
  }
  
  return {
    name: bot.bot_name,
    meetingUrl: bot.meeting_url,
    meetingType: bot.extra?.meetingType,
    createdAt: bot.created_at,
    creator: bot.creator_email,
    participants: bot.extra?.participants,
    topics: topics.length > 0 ? topics : undefined,
    extra: bot.extra
  };
}
