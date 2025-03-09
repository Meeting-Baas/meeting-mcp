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
      // Step 1: Get all available bots/meetings
      const botsResponse = await apiRequest(
        session,
        "get",
        `/bots/`
      );

      if (!botsResponse || !Array.isArray(botsResponse) || botsResponse.length === 0) {
        return "No meeting recordings found to search.";
      }

      // Step 2: Apply initial filtering based on provided filters or extracted from query
      let filteredBots = [...botsResponse];
      const extractedFilters: Record<string, any> = { ...args.filters };
      
      // Extract potential filters from the natural language query if filters weren't explicitly provided
      if (!args.filters || Object.keys(args.filters).length === 0) {
        // Look for meeting type mentions
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
            extractedFilters.meetingType = pattern.type;
            log.info(`Extracted meeting type from query: ${pattern.type}`);
            break;
          }
        }

        // Look for date/time references
        if (/yesterday|last\s+day/i.test(args.query)) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          extractedFilters.after = yesterday.toISOString().split('T')[0];
          log.info(`Extracted date filter from query: yesterday (${extractedFilters.after})`);
        } else if (/last\s+week/i.test(args.query)) {
          const lastWeek = new Date();
          lastWeek.setDate(lastWeek.getDate() - 7);
          extractedFilters.after = lastWeek.toISOString().split('T')[0];
          log.info(`Extracted date filter from query: last week (${extractedFilters.after})`);
        } else if (/this\s+(month|quarter)/i.test(args.query)) {
          const thisMonth = new Date();
          thisMonth.setDate(1); // First day of current month
          extractedFilters.after = thisMonth.toISOString().split('T')[0];
          log.info(`Extracted date filter from query: this month (${extractedFilters.after})`);
        }

        // Extract speaker names if mentioned
        const speakerMatch = args.query.match(/by|from|where\s+([A-Z][a-z]+)(\s+[A-Z][a-z]+)?\s+(speak|said|talk|mention)/i);
        if (speakerMatch) {
          extractedFilters.speaker = speakerMatch[1];
          log.info(`Extracted speaker filter from query: ${extractedFilters.speaker}`);
        }
      }

      // Apply meeting type filter if specified
      if (extractedFilters.meetingType) {
        filteredBots = filteredBots.filter((bot: any) => {
          return bot.extra && 
                bot.extra.meetingType && 
                bot.extra.meetingType.toLowerCase() === extractedFilters.meetingType.toLowerCase();
        });
        log.info(`Filtered to ${filteredBots.length} bots by meeting type: ${extractedFilters.meetingType}`);
      }

      // Apply date filters if specified
      if (extractedFilters.after || extractedFilters.before) {
        filteredBots = filteredBots.filter((bot: any) => {
          const createdDate = new Date(bot.created_at).toISOString().split('T')[0];
          let matches = true;
          
          if (extractedFilters.after && createdDate < extractedFilters.after) {
            matches = false;
          }
          
          if (extractedFilters.before && createdDate > extractedFilters.before) {
            matches = false;
          }
          
          return matches;
        });
        log.info(`Filtered to ${filteredBots.length} bots by date range`);
      }

      // If we've filtered out everything, return early
      if (filteredBots.length === 0) {
        return `No meetings found matching your filters. Try broadening your search criteria.`;
      }

      // Step 3: Search through the filtered bots' transcripts
      let allResults: any[] = [];
      const processedBots: string[] = [];
      
      // Limit to prevent excessive API calls
      const botsToSearch = filteredBots.slice(0, Math.min(filteredBots.length, 10));
      
      for (const bot of botsToSearch) {
        try {
          // Avoid duplicate searches if we've already processed this bot
          if (processedBots.includes(bot.uuid)) {
            continue;
          }
          
          processedBots.push(bot.uuid);
          
          const response = await apiRequest(
            session,
            "get",
            `/bots/meeting_data?bot_id=${bot.uuid}`
          );

          if (!response.bot_data || !response.bot_data.transcripts) {
            continue;
          }

          // Extract the core search terms from the query (removing filter-related phrases)
          let searchTerms = args.query
            .replace(/in\s+(sales|psychiatric|standup|interview|product|planning)\s+meetings?/gi, '')
            .replace(/from\s+yesterday|last\s+(week|day|month)|this\s+(month|quarter)/gi, '')
            .replace(/where\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?\s+(speak|said|talk|mention)/gi, '')
            .trim();
            
          // If the cleaning removed everything, use the original query
          if (!searchTerms) {
            searchTerms = args.query;
          }

          const transcripts: ExtendedTranscript[] = response.bot_data.transcripts;
          
          // First pass - direct string matching
          let matchingTranscripts = transcripts.filter((transcript: ExtendedTranscript) => {
            // Join words to form the complete text
            const text = transcript.words
              .map((word: { text: string }) => word.text)
              .join(" ");

            // Apply speaker filter if specified
            if (extractedFilters.speaker && 
                !transcript.speaker.toLowerCase().includes(extractedFilters.speaker.toLowerCase())) {
              return false;
            }

            // Check if the text contains our search terms
            return text.toLowerCase().includes(searchTerms.toLowerCase());
          });

          // If direct matching didn't find anything, try more flexible matching
          if (matchingTranscripts.length === 0) {
            // Split search terms into individual words for more flexible matching
            const searchWords = searchTerms.toLowerCase().split(/\s+/).filter(word => word.length > 3);
            
            // Find transcripts that contain at least half of the search words
            if (searchWords.length > 0) {
              matchingTranscripts = transcripts.filter((transcript: ExtendedTranscript) => {
                const text = transcript.words
                  .map((word: { text: string }) => word.text)
                  .join(" ").toLowerCase();
                  
                // Count how many search words appear in this text
                const matchCount = searchWords.filter(word => text.includes(word)).length;
                
                // Apply speaker filter if specified
                if (extractedFilters.speaker && 
                    !transcript.speaker.toLowerCase().includes(extractedFilters.speaker.toLowerCase())) {
                  return false;
                }
                
                // Consider it a match if at least half of the words match
                return matchCount >= Math.ceil(searchWords.length / 2);
              });
            }
          }

          // Add meeting and bot metadata to the results
          const augmentedResults = matchingTranscripts.map(transcript => {
            return {
              ...transcript,
              bot_id: bot.uuid,
              bot_name: response.bot_data.bot.bot_name || 'Unnamed Bot',
              meeting_url: response.bot_data.bot.meeting_url || '',
              meeting_type: bot.extra?.meetingType || 'Unknown',
              video_url: response.mp4 || '',
              created_at: response.bot_data.bot.created_at || '',
              creator_email: response.bot_data.bot.creator_email || ''
            };
          });

          allResults = [...allResults, ...augmentedResults];
        } catch (error) {
          log.error(`Error searching bot ${bot.uuid}`, { error: String(error) });
          // Continue with other bots even if one fails
        }
      }

      // Step 4: Process results based on user preferences
      
      // Add context if requested
      if (args.includeContext && allResults.length > 0) {
        const resultsWithContext: any[] = [];
        
        // Group results by bot_id to avoid repetitive API calls
        const resultsByBot: Record<string, any[]> = {};
        
        allResults.forEach(result => {
          if (!resultsByBot[result.bot_id]) {
            resultsByBot[result.bot_id] = [];
          }
          resultsByBot[result.bot_id].push(result);
        });
        
        // For each bot, get all transcripts once and add context
        for (const botId in resultsByBot) {
          try {
            const botResults = resultsByBot[botId];
            const response = await apiRequest(
              session,
              "get",
              `/bots/meeting_data?bot_id=${botId}`
            );
            
            const allTranscripts = response.bot_data.transcripts;
            
            // Add context for each result from this bot
            for (const result of botResults) {
              const resultIndex = allTranscripts.findIndex(
                (t: any) => t.start_time === result.start_time
              );
              
              if (resultIndex !== -1) {
                // Get up to 2 segments before and after the match for context
                const startIdx = Math.max(0, resultIndex - 2);
                const endIdx = Math.min(allTranscripts.length - 1, resultIndex + 2);
                
                const contextSegments = [];
                for (let i = startIdx; i <= endIdx; i++) {
                  const transcript = allTranscripts[i];
                  
                  // Mark if this is the actual match
                  const isMatch = i === resultIndex;
                  
                  contextSegments.push({
                    ...transcript,
                    isMatch,
                    bot_id: result.bot_id,
                    bot_name: result.bot_name,
                    meeting_url: result.meeting_url,
                    meeting_type: result.meeting_type,
                    video_url: result.video_url,
                    created_at: result.created_at,
                    creator_email: result.creator_email
                  });
                }
                
                resultsWithContext.push(...contextSegments);
              } else {
                // If we couldn't find the result in all transcripts (shouldn't happen)
                resultsWithContext.push(result);
              }
            }
          } catch (error) {
            log.error(`Error fetching context for bot ${botId}`, { error: String(error) });
            // If we can't get context, just use the original results
            resultsWithContext.push(...resultsByBot[botId]);
          }
        }
        
        // Replace original results with context-enhanced ones
        allResults = resultsWithContext;
      }

      // Sort results as requested
      if (args.sortBy === "date") {
        allResults.sort((a, b) => {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
      } else if (args.sortBy === "speaker") {
        allResults.sort((a, b) => {
          return a.speaker.localeCompare(b.speaker);
        });
      }
      // For "relevance" (default) we keep the natural order, which is by match quality

      // Limit results
      allResults = allResults.slice(0, args.maxResults);

      // Step 5: Format and return results in a way that's easy for AI to process and present
      if (allResults.length === 0) {
        return "No matching content found. Try adjusting your search terms or filters.";
      }

      // Group results by meeting to provide better context
      const resultsByMeeting: Record<string, any[]> = {};
      
      allResults.forEach(result => {
        const meetingKey = `${result.bot_id}`;
        if (!resultsByMeeting[meetingKey]) {
          resultsByMeeting[meetingKey] = [];
        }
        resultsByMeeting[meetingKey].push(result);
      });

      // Format results for each meeting
      let formattedOutput = `Found ${allResults.length} matching segments across ${Object.keys(resultsByMeeting).length} meetings.\n\n`;
      
      Object.entries(resultsByMeeting).forEach(([meetingKey, results], meetingIndex) => {
        // Show meeting information once per meeting
        const meetingInfo = results[0];
        formattedOutput += `------- MEETING ${meetingIndex + 1} -------\n`;
        formattedOutput += `Meeting: ${meetingInfo.bot_name}\n`;
        formattedOutput += `Type: ${meetingInfo.meeting_type}\n`;
        formattedOutput += `Date: ${new Date(meetingInfo.created_at).toLocaleString()}\n`;
        if (meetingInfo.creator_email) {
          formattedOutput += `Creator: ${meetingInfo.creator_email}\n`;
        }
        formattedOutput += `Meeting URL: ${meetingInfo.meeting_url}\n`;
        formattedOutput += `Recording: ${meetingInfo.video_url}\n\n`;
        
        // Format each transcript segment
        formattedOutput += `TRANSCRIPT SEGMENTS:\n`;
        
        results.forEach((result, idx) => {
          const text = result.words
            .map((word: { text: string }) => word.text)
            .join(" ");
          
          const startTime = formatTime(result.start_time);
          const videoTimestamp = `${meetingInfo.video_url.split('?')[0]}?t=${Math.floor(result.start_time)}`;
          
          // Highlight the actual match vs. context
          const prefix = result.isMatch === false ? '[CONTEXT] ' : '[MATCH] ';
          
          formattedOutput += `${prefix}[${startTime}] ${result.speaker}: ${text}\n`;
          formattedOutput += `  └─ Jump to timestamp: ${videoTimestamp}\n\n`;
        });
        
        // Add separator between meetings
        if (meetingIndex < Object.keys(resultsByMeeting).length - 1) {
          formattedOutput += `\n\n`;
        }
      });

      return formattedOutput;
    } catch (error) {
      log.error("Error in intelligent search", { error: String(error) });
      return `An error occurred during the search: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
};
