/**
 * MCP tools for searching meeting content
 */

import type { Context, TextContent } from "fastmcp";
import { z } from "zod";
import { apiRequest } from "../api/client.js";
import { Transcript } from "../types/index.js";
import { formatTime } from "../utils/formatters.js";

// Define our session auth type
type SessionAuth = { apiKey: string };

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

/**
 * Search meeting transcripts
 */
export const searchTranscriptTool: Tool<typeof searchTranscriptParams> = {
  name: "searchTranscript",
  description: "Search through meeting transcripts for specific content",
  parameters: searchTranscriptParams,
  execute: async (args, context) => {
    const { session, log } = context;
    log.info("Searching transcripts", { botId: args.botId, query: args.query });

    const response = await apiRequest(
      session,
      "get",
      `/bots/meeting_data?bot_id=${args.botId}`
    );

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
    log.info("Finding meeting topic", { meetingId: args.meetingId, topic: args.topic });

    const response = await apiRequest(
      session,
      "get",
      `/bots/meeting_data?meeting_id=${args.meetingId}`
    );

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
 * This tool dynamically adjusts its search strategy based on the query and available metadata
 */
export const intelligentSearchTool: Tool<typeof intelligentSearchParams> = {
  name: "intelligentSearch",
  description: "Performs an intelligent search across all meeting data, adapting to the query and available context",
  parameters: intelligentSearchParams,
  execute: async (args, context) => {
    const { session, log } = context;
    log.info("Performing intelligent search", { 
      query: args.query,
      filters: args.filters,
      maxResults: args.maxResults
    });

    try {
      // Step 1: Analyze the query to determine the best search strategy
      const queryLower = args.query.toLowerCase();
      let searchStrategy = "general";
      let botId = null;
      let meetingId = null;
      let meetingType = null;
      let topic = null;
      let speaker = null;
      let timeRange = { startTime: undefined as number | undefined, endTime: undefined as number | undefined };
      
      // Extract filters from the query or from explicitly provided filters
      const extractedFilters: Record<string, any> = { ...args.filters };
      
      // Check for meeting ID/bot ID patterns
      const idMatch = queryLower.match(/meeting\s+(id|uuid|bot)[\s:]+([a-f0-9-]{8,})/i);
      if (idMatch) {
        botId = idMatch[2];
        meetingId = idMatch[2];
        searchStrategy = "specific-meeting";
        log.info(`Detected specific meeting search with ID: ${botId}`);
      }
      
      // Check for meeting type patterns
      const meetingTypePatterns = [
        { regex: /sales\s+meeting/i, type: "sales" },
        { regex: /psychiatric|therapy|mental\s+health/i, type: "psychiatric" },
        { regex: /standup|scrum|daily/i, type: "standup" },
        { regex: /interview/i, type: "interview" },
        { regex: /product/i, type: "product" },
        { regex: /planning/i, type: "planning" }
      ];

      for (const pattern of meetingTypePatterns) {
        if (pattern.regex.test(queryLower)) {
          meetingType = pattern.type;
          searchStrategy = "meeting-type";
          log.info(`Detected meeting type search for: ${meetingType}`);
          break;
        }
      }
      
      // Check for topic search patterns
      const topicPatterns = [
        /(?:about|discuss|discussion|mention|talk about|cover)\s+([a-z\s]{3,}?)(?:\s+in|\s+during|\s+at|\?|$)/i,
        /(?:find|search for)\s+([a-z\s]{3,}?)(?:\s+in|\s+during|\s+at|\?|$)/i
      ];
      
      for (const pattern of topicPatterns) {
        const match = queryLower.match(pattern);
        if (match && match[1]) {
          topic = match[1].trim();
          if (botId || meetingId) {
            searchStrategy = "meeting-topic";
            log.info(`Detected topic search within specific meeting. Topic: ${topic}`);
          }
          break;
        }
      }
      
      // Check for speaker-specific patterns
      const speakerMatch = queryLower.match(/(?:where|when|what)\s+(?:did|does|was)\s+([a-z]+)(?:\s+[a-z]+)?\s+(?:say|talk|speak|mention)/i);
      if (speakerMatch) {
        speaker = speakerMatch[1];
        searchStrategy = speaker && (botId || meetingId) ? "video-segment" : searchStrategy;
        log.info(`Detected speaker filter: ${speaker}`);
      }
      
      // Check for time range patterns
      const timePatterns = [
        { regex: /between\s+(\d+)(?::(\d+))?\s+(?:and|to)\s+(\d+)(?::(\d+))?/i, type: "range" },
        { regex: /after\s+(\d+)(?::(\d+))?/i, type: "after" },
        { regex: /before\s+(\d+)(?::(\d+))?/i, type: "before" },
        { regex: /around\s+(\d+)(?::(\d+))?/i, type: "around" }
      ];
      
      for (const pattern of timePatterns) {
        const match = queryLower.match(pattern.regex);
        if (match) {
          if (pattern.type === "range" && match[1] && match[3]) {
            const startMinutes = parseInt(match[1]) * 60 + (match[2] ? parseInt(match[2]) : 0);
            const endMinutes = parseInt(match[3]) * 60 + (match[4] ? parseInt(match[4]) : 0);
            timeRange.startTime = startMinutes;
            timeRange.endTime = endMinutes;
            searchStrategy = "video-segment";
          } else if (pattern.type === "after" && match[1]) {
            const minutes = parseInt(match[1]) * 60 + (match[2] ? parseInt(match[2]) : 0);
            timeRange.startTime = minutes;
            searchStrategy = "video-segment";
          } else if (pattern.type === "before" && match[1]) {
            const minutes = parseInt(match[1]) * 60 + (match[2] ? parseInt(match[2]) : 0);
            timeRange.endTime = minutes;
            searchStrategy = "video-segment";
          } else if (pattern.type === "around" && match[1]) {
            const minutes = parseInt(match[1]) * 60 + (match[2] ? parseInt(match[2]) : 0);
            timeRange.startTime = Math.max(0, minutes - 60); // 1 minute before
            timeRange.endTime = minutes + 60; // 1 minute after
            searchStrategy = "video-segment";
          }
          log.info(`Detected time range: ${JSON.stringify(timeRange)}`);
          break;
        }
      }
      
      // Use the filters if explicitly provided
      if (extractedFilters.meetingType && !meetingType) {
        meetingType = extractedFilters.meetingType;
        searchStrategy = "meeting-type";
      }
      
      if (extractedFilters.botId && !botId) {
        botId = extractedFilters.botId;
        searchStrategy = botId ? "specific-meeting" : searchStrategy;
      }
      
      if (extractedFilters.speaker && !speaker) {
        speaker = extractedFilters.speaker;
      }
      
      if (extractedFilters.startTime !== undefined && timeRange.startTime === undefined) {
        timeRange.startTime = extractedFilters.startTime;
        searchStrategy = botId ? "video-segment" : searchStrategy;
      }
      
      if (extractedFilters.endTime !== undefined && timeRange.endTime === undefined) {
        timeRange.endTime = extractedFilters.endTime;
        searchStrategy = botId ? "video-segment" : searchStrategy;
      }
      
      // Step 2: Execute the appropriate search strategy by delegating to specialized search tools
      
      // Extract core search terms (removing filter-related phrases)
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
      
      log.info(`Search strategy: ${searchStrategy}, Search terms: ${searchTerms}`);
      
      // Execute the appropriate search based on detected strategy
      switch (searchStrategy) {
        case "specific-meeting":
          if (topic) {
            // Use findMeetingTopic if we have a specific topic to search within a meeting
            return await findMeetingTopicTool.execute({
              meetingId: meetingId || botId,
              topic: topic || searchTerms
            }, context);
          } else if (timeRange.startTime !== undefined || timeRange.endTime !== undefined || speaker) {
            // Use searchVideoSegment if we're looking for specific segments by time or speaker
            return await searchVideoSegmentTool.execute({
              botId: botId,
              startTime: timeRange.startTime,
              endTime: timeRange.endTime,
              speaker: speaker
            }, context);
          } else {
            // Default to simple transcript search for a specific meeting
            return await searchTranscriptTool.execute({
              botId: botId,
              query: searchTerms
            }, context);
          }
          
        case "meeting-type":
          // Use searchTranscriptByType if we're searching across a specific meeting type
          return await searchTranscriptByTypeTool.execute({
            meetingType: meetingType,
            query: searchTerms,
            limit: args.maxResults || 10
          }, context);
          
        case "meeting-topic":
          // Already handled in the specific-meeting case
          break;
          
        case "video-segment":
          // Already handled in the specific-meeting case
          break;
          
        case "general":
        default:
          // For general searches, we need to find relevant bots first
          const botsResponse = await apiRequest(
            session,
            "get",
            `/bots/`
          );
          
          if (!botsResponse || !Array.isArray(botsResponse) || botsResponse.length === 0) {
            return "No meeting recordings found to search.";
          }
          
          // For a general search, let's try each bot until we find relevant results
          // This simulates searching across all meetings but leverages the specialized tools
          for (const bot of botsResponse.slice(0, Math.min(5, botsResponse.length))) {
            try {
              const result = await searchTranscriptTool.execute({
                botId: bot.uuid,
                query: searchTerms
              }, context);
              
              // If we got meaningful results (not just "No results found"), return them
              if (typeof result === 'string' && !result.startsWith("No results found")) {
                // Add meeting info to the results
                return `MEETING INFO:
Bot Name: ${bot.bot_name || 'Unnamed Bot'}
Meeting URL: ${bot.meeting_url || 'Unknown'}
Meeting Type: ${bot.extra?.meetingType || 'Unknown'}
Date: ${new Date(bot.created_at).toLocaleString()}
${bot.creator_email ? `Creator: ${bot.creator_email}` : ''}

SEARCH RESULTS:
${result}`;
              }
            } catch (error) {
              // Just log and continue if one bot fails
              log.error(`Error searching bot ${bot.uuid}`, { error: String(error) });
            }
          }
          
          return "No relevant results found across any meetings. Try refining your search terms or specifying a particular meeting.";
      }
      
      // Fallback message if we somehow miss all cases
      return "Unable to determine the best search strategy for your query. Please try being more specific.";
      
    } catch (error) {
      log.error("Error in intelligent search", { error: String(error) });
      return `An error occurred during the search: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
};
