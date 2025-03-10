/**
 * Meeting recording link generation and sharing tools
 */

import { z } from "zod";
import type { Context, TextContent } from "fastmcp";
import { apiRequest, SessionAuth } from "../api/client.js";
import { 
  createShareableLink, 
  createMeetingSegmentsList, 
  createInlineMeetingLink 
} from "../utils/linkFormatter.js";
import { createValidSession } from "../utils/auth.js";

/**
 * Schema for generating a shareable link to a meeting
 */
const shareableMeetingLinkParams = z.object({
  botId: z.string().describe("ID of the bot that recorded the meeting"),
  timestamp: z.number().optional().describe("Timestamp in seconds to link to a specific moment (optional)"),
  title: z.string().optional().describe("Title to display for the meeting (optional)"),
  speakerName: z.string().optional().describe("Name of the speaker at this timestamp (optional)"),
  description: z.string().optional().describe("Brief description of what's happening at this timestamp (optional)"),
});

/**
 * Tool for generating a shareable meeting link
 */
export const shareableMeetingLinkTool = {
  name: "shareableMeetingLink",
  description: "Generate a shareable link to a specific moment in a meeting recording",
  parameters: shareableMeetingLinkParams,
  execute: async (args: z.infer<typeof shareableMeetingLinkParams>, context: Context<SessionAuth>) => {
    const { session, log } = context;
    log.info("Generating shareable meeting link", { botId: args.botId });
    
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
      
      // Get the meeting data to verify the bot ID exists
      const response = await apiRequest(
        validSession,
        "get",
        `/bots/meeting_data?bot_id=${args.botId}`
      );
      
      // If we got a response, the bot exists, so we can generate a link
      const shareableLink = createShareableLink(args.botId, {
        timestamp: args.timestamp,
        title: args.title,
        speakerName: args.speakerName,
        description: args.description
      });
      
      return shareableLink;
      
    } catch (error) {
      return `Error generating shareable link: ${error instanceof Error ? error.message : String(error)}. Please check that the bot ID is correct.`;
    }
  }
};

/**
 * Schema for generating links to multiple timestamps in a meeting
 */
const shareMeetingSegmentsParams = z.object({
  botId: z.string().describe("ID of the bot that recorded the meeting"),
  segments: z.array(
    z.object({
      timestamp: z.number().describe("Timestamp in seconds"),
      speaker: z.string().optional().describe("Name of the speaker at this timestamp (optional)"),
      description: z.string().describe("Brief description of what's happening at this timestamp"),
    })
  ).describe("List of meeting segments to share")
});

/**
 * Tool for sharing multiple segments from a meeting
 */
export const shareMeetingSegmentsTool = {
  name: "shareMeetingSegments",
  description: "Generate a list of links to important moments in a meeting",
  parameters: shareMeetingSegmentsParams,
  execute: async (args: z.infer<typeof shareMeetingSegmentsParams>, context: Context<SessionAuth>) => {
    const { session, log } = context;
    log.info("Sharing meeting segments", { botId: args.botId, segments: args.segments });
    
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
      
      // Get the meeting data to verify the bot ID exists
      const response = await apiRequest(
        validSession,
        "get",
        `/bots/meeting_data?bot_id=${args.botId}`
      );
      
      // If we got a response, the bot exists, so we can generate the segments
      const segmentsList = createMeetingSegmentsList(args.botId, args.segments);
      
      return segmentsList;
      
    } catch (error) {
      return `Error generating meeting segments: ${error instanceof Error ? error.message : String(error)}. Please check that the bot ID is correct.`;
    }
  }
};

/**
 * Schema for finding key moments in a meeting and sharing them
 */
const findKeyMomentsParams = z.object({
  botId: z.string().describe("ID of the bot that recorded the meeting"),
  meetingTitle: z.string().optional().describe("Title of the meeting (optional)"),
  topics: z.array(z.string()).optional().describe("List of topics to look for in the meeting (optional)"),
  maxMoments: z.number().default(5).describe("Maximum number of key moments to find"),
  granularity: z.enum(["high", "medium", "low"]).default("medium")
    .describe("Level of detail for topic extraction: 'high' finds many specific topics, 'medium' is balanced, 'low' finds fewer broad topics"),
  autoDetectTopics: z.boolean().default(true)
    .describe("Automatically detect important topics in the meeting without requiring predefined topics"),
  initialChunkSize: z.number().default(1200)
    .describe("Initial chunk size in seconds to analyze (default 20 minutes)"),
});

/**
 * Tool for automatically finding and sharing key moments from a meeting
 */
export const findKeyMomentsTool = {
  name: "findKeyMoments",
  description: "Automatically find and share key moments and topics from a meeting recording with configurable granularity",
  parameters: findKeyMomentsParams,
  execute: async (args: z.infer<typeof findKeyMomentsParams>, context: Context<SessionAuth>) => {
    const { session, log } = context;
    log.info("Finding key moments in meeting", { botId: args.botId, granularity: args.granularity });
    
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
      
      // Get the meeting data
      const response = await apiRequest(
        validSession,
        "get",
        `/bots/meeting_data?bot_id=${args.botId}`
      );
      
      if (!response?.bot_data?.bot) {
        return "Could not find meeting data for the provided bot ID.";
      }
      
      const meetingTitle = args.meetingTitle || response.bot_data.bot.bot_name || "Meeting Recording";
      
      // Get the transcripts
      const transcripts = response.bot_data.transcripts || [];
      
      if (transcripts.length === 0) {
        return `No transcript found for meeting "${meetingTitle}". You can still view the recording:\n\n${createShareableLink(args.botId, { title: meetingTitle })}`;
      }
      
      // Sort transcripts by time to ensure chronological order
      const sortedTranscripts = [...transcripts].sort((a, b) => a.start_time - b.start_time);
      
      // Determine meeting duration
      const meetingStart = sortedTranscripts[0].start_time;
      const meetingEnd = sortedTranscripts[sortedTranscripts.length - 1].start_time;
      const meetingDuration = meetingEnd - meetingStart;
      
      log.info("Meeting duration detected", { 
        meetingDuration: meetingDuration,
        segmentCount: sortedTranscripts.length 
      });
      
      // Divide meeting into larger chunks for initial analysis
      // Default to 20 minutes chunks or the entire meeting if shorter
      const chunkSize = Math.min(meetingDuration, args.initialChunkSize);
      const chunks: Array<any[]> = [];
      
      // Create chunks of transcript segments
      for (let startTime = meetingStart; startTime < meetingEnd; startTime += chunkSize) {
        const endTime = Math.min(startTime + chunkSize, meetingEnd);
        const chunkTranscripts = sortedTranscripts.filter(
          t => t.start_time >= startTime && t.start_time < endTime
        );
        if (chunkTranscripts.length > 0) {
          chunks.push(chunkTranscripts);
        }
      }
      
      log.info("Meeting divided into chunks", { 
        chunkCount: chunks.length,
        chunkSizeSeconds: chunkSize
      });
      
      // Process each chunk to find keywords/topics
      let allTopics: string[] = args.topics || [];
      let allKeyMoments: Array<{
        start_time: number;
        speaker: string;
        description: string;
        score: number;
      }> = [];
      
      if (args.autoDetectTopics) {
        // Analyze each chunk to find topics
        for (const chunk of chunks) {
          const chunkTopics = detectTopicsFromChunk(chunk);
          allTopics = [...allTopics, ...chunkTopics];
        }
        
        // Remove duplicates and sort by relevance
        allTopics = [...new Set(allTopics)];
        
        log.info("Topics detected across all chunks", { 
          topicCount: allTopics.length, 
          topics: allTopics 
        });
      }
      
      // If we found topics, or were given topics, search for key moments in all chunks
      if (allTopics.length > 0) {
        // Use divide and conquer approach to find moments
        for (const chunk of chunks) {
          const moments = findMomentsInChunk(chunk, allTopics, args.granularity);
          allKeyMoments.push(...moments);
        }
        
        // Sort by score (relevance) and take top N moments
        allKeyMoments.sort((a, b) => b.score - a.score);
      }
      
      // Regardless, ensure we have some key moments by adding structural ones
      // (meeting start, end, dense segments) if needed
      if (allKeyMoments.length < args.maxMoments) {
        addStructuralKeyMoments(allKeyMoments, sortedTranscripts, args.maxMoments);
      }
      
      // Sort by timestamp for presentation
      allKeyMoments.sort((a, b) => a.start_time - b.start_time);
      
      // Ensure we don't exceed requested max moments
      allKeyMoments = allKeyMoments.slice(0, args.maxMoments);
      
      // If we still have no key moments, return a message
      if (allKeyMoments.length === 0) {
        return `No key moments found in meeting "${meetingTitle}". You can view the full recording:\n\n${createShareableLink(args.botId, { title: meetingTitle })}`;
      }
      
      // Format the segments
      const formattedSegments = allKeyMoments.map(moment => ({
        timestamp: moment.start_time,
        speaker: moment.speaker,
        description: moment.description
      }));
      
      // Create the segments list with the full title
      const segmentsList = createMeetingSegmentsList(args.botId, formattedSegments);
      
      // Include auto-detected topics if any were found
      let result = `# Key Moments from ${meetingTitle}\n\n`;
      
      if (args.autoDetectTopics && allTopics.length > 0) {
        // Just show top topics (max 5-10 depending on granularity)
        const topicLimit = args.granularity === "high" ? 10 : args.granularity === "medium" ? 7 : 5;
        const topTopics = allTopics.slice(0, topicLimit);
        
        result += `## Main Topics Discussed\n${topTopics.map(topic => `- ${topic}`).join('\n')}\n\n`;
      }
      
      result += segmentsList;
      
      return result;
      
    } catch (error) {
      return `Error finding key moments: ${error instanceof Error ? error.message : String(error)}. Please check that the bot ID is correct.`;
    }
  }
};

/**
 * Detects important topics from a transcript chunk using frequency analysis
 * Uses a language-agnostic approach that works with any language
 */
function detectTopicsFromChunk(
  transcripts: any[]
): string[] {
  if (!transcripts || transcripts.length === 0) {
    return [];
  }
  
  // Combine all transcript text for analysis
  const fullText = transcripts.map(transcript => {
    return transcript.words
      ? transcript.words.map((w: any) => w.text).join(" ")
      : "";
  }).join(" ");
  
  // Split by sentence to maintain some context
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Extract potential important phrases (2-4 words) based on frequency and context
  const phrases: Record<string, number> = {};
  
  for (const sentence of sentences) {
    const tokens = sentence.trim().split(/\s+/);
    
    // Skip very short sentences
    if (tokens.length < 3) continue;
    
    // Process potential n-grams (2, 3, and 4-word phrases)
    for (let n = 2; n <= 4; n++) {
      if (tokens.length < n) continue;
      
      for (let i = 0; i <= tokens.length - n; i++) {
        const phrase = tokens.slice(i, i + n).join(" ");
        // Only consider phrases with reasonable length
        if (phrase.length > 5) {
          phrases[phrase] = (phrases[phrase] || 0) + 1;
        }
      }
    }
  }
  
  // Sort by frequency and get top phrases
  const sortedPhrases = Object.entries(phrases)
    .filter(([_, count]) => count > 1) // Must appear more than once
    .sort((a, b) => b[1] - a[1])
    .map(([phrase]) => phrase);
  
  return sortedPhrases.slice(0, 10); // Return top 10 phrases from this chunk
}

/**
 * Find moments in a chunk that match given topics
 */
function findMomentsInChunk(
  transcripts: any[],
  topics: string[] = [],
  granularity: string = "medium"
): Array<{ 
  start_time: number; 
  speaker: string; 
  description: string;
  score: number;
}> {
  if (!transcripts || transcripts.length === 0 || topics.length === 0) {
    return [];
  }
  
  const keyMoments = [];
  
  // For each transcript segment, score it against all topics
  for (const transcript of transcripts) {
    if (!transcript.words) continue;
    
    const text = transcript.words.map((w: any) => w.text).join(" ");
    
    // For each topic, check if it appears in this segment
    for (const topic of topics) {
      if (text.toLowerCase().includes(topic.toLowerCase())) {
        // Calculate a relevance score based on:
        // 1. How many times the topic appears
        // 2. Position in segment (beginning is more important)
        // 3. Speaker (favor segments with clear speakers)
        
        // Count occurrences (case insensitive)
        const occurrences = (text.toLowerCase().match(new RegExp(topic.toLowerCase(), 'g')) || []).length;
        const positionIndex = text.toLowerCase().indexOf(topic.toLowerCase()) / text.length;
        const speakerBonus = transcript.speaker ? 1.2 : 1.0;
        
        // Calculate score: more occurrences and earlier position are better
        const score = (occurrences * (1.0 - positionIndex * 0.5)) * speakerBonus;
        
        keyMoments.push({
          start_time: transcript.start_time,
          speaker: transcript.speaker || "Unknown speaker",
          description: `Discussion about "${topic}"`,
          score: score
        });
        
        // Only count each segment once per topic
        break;
      }
    }
  }
  
  return keyMoments;
}

/**
 * Add structural key moments based on meeting structure
 */
function addStructuralKeyMoments(
  keyMoments: Array<{ 
    start_time: number; 
    speaker: string; 
    description: string;
    score: number;
  }>,
  transcripts: any[],
  maxMoments: number
) {
  // First, check if we already have meeting start
  const sortedTranscripts = [...transcripts].sort((a, b) => a.start_time - b.start_time);
  
  if (sortedTranscripts.length === 0) return;
  
  // Add meeting start if not already there
  const first = sortedTranscripts[0];
  if (!keyMoments.some(m => Math.abs(m.start_time - first.start_time) < 30)) {
    keyMoments.push({
      start_time: first.start_time,
      speaker: first.speaker || "Unknown speaker",
      description: "Meeting start",
      score: 100 // High score to ensure it's included
    });
  }
  
  // Add meeting end if not already there and we have space
  if (keyMoments.length < maxMoments) {
    const last = sortedTranscripts[sortedTranscripts.length - 1];
    if (!keyMoments.some(m => Math.abs(m.start_time - last.start_time) < 30)) {
      keyMoments.push({
        start_time: last.start_time,
        speaker: last.speaker || "Unknown speaker",
        description: "Meeting conclusion",
        score: 90 // High score but lower than start
      });
    }
  }
  
  // Add high speaker participation segments if needed
  if (keyMoments.length < maxMoments) {
    // Group nearby segments
    const meetingDuration = sortedTranscripts[sortedTranscripts.length - 1].start_time - sortedTranscripts[0].start_time;
    const segmentSize = Math.max(60, Math.floor(meetingDuration / 20)); // At least 1 minute segments
    
    const segments: Array<any[]> = [];
    let currentSegment: any[] = [];
    let currentSegmentStart = sortedTranscripts[0].start_time;
    
    for (const transcript of sortedTranscripts) {
      if (transcript.start_time - currentSegmentStart > segmentSize) {
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
        }
        currentSegment = [transcript];
        currentSegmentStart = transcript.start_time;
      } else {
        currentSegment.push(transcript);
      }
    }
    
    // Add the last segment
    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }
    
    // Find segments with multiple speakers
    const multiSpeakerSegments = segments
      .map(segment => {
        const speakers = new Set(segment.map(t => t.speaker).filter(Boolean));
        return {
          segment,
          speakerCount: speakers.size,
          wordCount: segment.reduce((sum, t) => sum + (t.words ? t.words.length : 0), 0)
        };
      })
      .filter(s => s.speakerCount > 1)
      .sort((a, b) => (b.speakerCount * 10 + b.wordCount) - (a.speakerCount * 10 + a.wordCount));
    
    // Add top multi-speaker segments
    for (const { segment, speakerCount } of multiSpeakerSegments) {
      if (keyMoments.length >= maxMoments) break;
      
      const representative = segment[0];
      // Check if we already have this moment
      if (!keyMoments.some(m => Math.abs(m.start_time - representative.start_time) < segmentSize)) {
        keyMoments.push({
          start_time: representative.start_time,
          speaker: representative.speaker || "Unknown speaker",
          description: `Discussion with ${speakerCount} participants`,
          score: 70 + speakerCount // Higher score for more speakers
        });
      }
    }
  }
  
  // Add longest segments if still needed
  if (keyMoments.length < maxMoments) {
    const remainingNeeded = maxMoments - keyMoments.length;
    
    // Find longest segments by word count
    const longestSegments = [...transcripts]
      .sort((a, b) => {
        const aWords = a.words ? a.words.length : 0;
        const bWords = b.words ? b.words.length : 0;
        return bWords - aWords;
      })
      .slice(0, remainingNeeded);
    
    for (const segment of longestSegments) {
      // Avoid duplicates
      if (!keyMoments.some(m => Math.abs(m.start_time - segment.start_time) < 30)) {
        keyMoments.push({
          start_time: segment.start_time,
          speaker: segment.speaker || "Unknown speaker",
          description: "Extended discussion",
          score: 50 + (segment.words ? segment.words.length / 10 : 0) // Score based on length
        });
      }
    }
  }
} 