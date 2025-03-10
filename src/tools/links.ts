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
      
      // SIMPLE APPROACH: Process the entire transcript as one large document
      // Sort all transcripts chronologically
      const sortedTranscripts = [...transcripts].sort((a, b) => a.start_time - b.start_time);
      
      // Get meeting duration for context
      const meetingStart = sortedTranscripts[0].start_time;
      const meetingEnd = sortedTranscripts[sortedTranscripts.length - 1].start_time;
      const meetingDuration = meetingEnd - meetingStart;
      
      log.info("Processing entire meeting transcript", { 
        segmentCount: sortedTranscripts.length,
        durationSeconds: meetingDuration
      });
      
      // Extract the full text content of the meeting
      const fullText = sortedTranscripts.map(transcript => {
        const speakerPrefix = transcript.speaker ? `${transcript.speaker}: ` : "";
        return speakerPrefix + (transcript.words
          ? transcript.words.map((w: any) => w.text).join(" ")
          : "");
      }).join(" ");
      
      // STEP 1: Identify significant themes and keywords
      let importantTopics: string[] = [];
      
      // Use provided topics if available
      if (args.topics && args.topics.length > 0) {
        importantTopics = args.topics;
      } 
      // Otherwise detect topics if requested
      else if (args.autoDetectTopics) {
        // First try to identify business/domain themes
        const domainThemes = extractDomainThemes(fullText);
        
        // Then identify technical terms and proper nouns
        const technicalTerms = extractTechnicalTerms(fullText);
        
        // Combine the lists
        importantTopics = [...domainThemes, ...technicalTerms];
        
        log.info("Detected themes and topics", { 
          domainThemes,
          technicalTerms,
          totalTopics: importantTopics.length
        });
      }
      
      // STEP 2: Find segments where these topics are discussed
      const keySegments = [];
      
      // First, add structural segments (start, end, etc.)
      keySegments.push({
        type: "structural",
        description: "Meeting start",
        startTime: meetingStart,
        speaker: sortedTranscripts[0].speaker || "Unknown speaker",
        transcript: sortedTranscripts[0],
        importance: 5
      });
      
      if (meetingDuration > 300) { // If meeting is longer than 5 minutes
        keySegments.push({
          type: "structural",
          description: "Meeting conclusion",
          startTime: meetingEnd,
          speaker: sortedTranscripts[sortedTranscripts.length - 1].speaker || "Unknown speaker",
          transcript: sortedTranscripts[sortedTranscripts.length - 1],
          importance: 4
        });
      }
      
      // Then add context segments for each important topic
      for (const topic of importantTopics) {
        // Find segments where this topic is mentioned
        const relevantSegments = findSegmentsDiscussing(sortedTranscripts, topic);
        
        // If there are relevant segments, add the most important one
        if (relevantSegments.length > 0) {
          // Sort by importance
          relevantSegments.sort((a, b) => b.importance - a.importance);
          
          // Take the most important segment
          const bestSegment = relevantSegments[0];
          
          keySegments.push({
            type: "topic",
            description: `Discussion about "${topic}"`,
            startTime: bestSegment.startTime,
            speaker: bestSegment.speaker,
            transcript: bestSegment.transcript,
            importance: bestSegment.importance
          });
        }
      }
      
      // STEP 3: Add conversation-specific segments (multi-speaker exchanges, etc.)
      // Find segments with multiple speakers engaged in conversation
      const conversationSegments = findConversationSegments(sortedTranscripts);
      for (const segment of conversationSegments) {
        // Check if we already have a segment very close to this one
        const alreadyIncluded = keySegments.some(
          s => Math.abs(s.startTime - segment.startTime) < 30
        );
        
        if (!alreadyIncluded) {
          keySegments.push({
            type: "conversation",
            description: `Discussion with ${segment.speakerCount} participants`,
            startTime: segment.startTime,
            speaker: segment.speaker,
            transcript: segment.transcript,
            importance: 3 + segment.speakerCount * 0.5  // More speakers = more important
          });
        }
      }
      
      // Deduplicate and sort the segments by time
      const uniqueKeySegments = deduplicateSegments(keySegments);
      const chronologicalSegments = uniqueKeySegments.sort((a, b) => a.startTime - b.startTime);
      
      // Limit to the requested number of moments
      const finalSegments = chronologicalSegments.slice(0, args.maxMoments);
      
      // STEP 4: Format the output
      const formattedSegments = finalSegments.map(segment => ({
        timestamp: segment.startTime,
        speaker: segment.speaker,
        description: segment.description
      }));
      
      // Create the segments list with the full title
      const segmentsList = createMeetingSegmentsList(args.botId, formattedSegments);
      
      // Include topics if they were detected
      let result = `# Key Moments from ${meetingTitle}\n\n`;
      
      if (importantTopics.length > 0) {
        const topicLimit = args.granularity === "high" ? 10 : args.granularity === "medium" ? 7 : 5;
        const topTopics = importantTopics.slice(0, topicLimit);
        
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
 * Extract domain-specific themes from text
 * This function uses a heuristic approach to identify business and domain themes
 */
function extractDomainThemes(text: string): string[] {
  // Normalize text for processing
  const normalizedText = text.toLowerCase();
  
  // List of potential business/domain areas to check for
  const domainAreas = [
    // Business domains
    { term: "hipaa", expanded: "HIPAA compliance" },
    { term: "compliance", expanded: "compliance requirements" },
    { term: "security", expanded: "security measures" },
    { term: "privacy", expanded: "data privacy" },
    { term: "encryption", expanded: "data encryption" },
    { term: "data", expanded: "data handling" },
    { term: "healthcare", expanded: "healthcare" },
    { term: "medical", expanded: "medical applications" },
    { term: "business associates agreement", expanded: "business associates agreement" },
    { term: "baa", expanded: "business associates agreement" },
    { term: "s3 bucket", expanded: "S3 buckets" },
    { term: "aws", expanded: "AWS integration" },
    { term: "transcription", expanded: "transcription services" },
    { term: "analytics", expanded: "conversation analytics" },
    { term: "pricing", expanded: "pricing model" },
    { term: "subscription", expanded: "subscription model" },
    { term: "token", expanded: "token-based pricing" },
    { term: "pay as you go", expanded: "pay-as-you-go model" },
    { term: "enterprise", expanded: "enterprise plan" },
    { term: "integration", expanded: "integration options" },
    { term: "audio", expanded: "audio recording" },
    { term: "video", expanded: "video recording" },
    { term: "bot", expanded: "bot implementation" },
    { term: "api", expanded: "API access" },
    { term: "concurrency", expanded: "concurrent users" }
  ];
  
  // Find which domains are mentioned in the text
  const detectedDomains = domainAreas.filter(domain => 
    normalizedText.includes(domain.term)
  );
  
  // Return expanded forms of detected domains
  return detectedDomains.map(domain => domain.expanded);
}

/**
 * Extract technical terms and proper nouns from text
 */
function extractTechnicalTerms(text: string): string[] {
  // First pass: look for product names and technical terms
  const technicalTermsRegex = /\b(API|SDK|S3|AWS|HIPAA|Gladia|Deepgram|Recall|BAA|NBAA|token|bot|encryption|bucket|transcription)\b/gi;
  
  // Find all matches
  const matches = [...text.matchAll(technicalTermsRegex)];
  const terms = matches.map(match => match[0]);
  
  // Deduplicate and normalize case
  const uniqueTerms = [...new Set(terms)].map(term => {
    // Special case for acronyms - keep them uppercase
    if (term.toUpperCase() === term) return term;
    // Otherwise capitalize properly
    return term.charAt(0).toUpperCase() + term.slice(1).toLowerCase();
  });
  
  return uniqueTerms;
}

/**
 * Find segments where a specific topic is discussed
 */
function findSegmentsDiscussing(
  transcripts: any[],
  topic: string
): Array<{
  startTime: number;
  speaker: string;
  transcript: any;
  importance: number;
}> {
  const results = [];
  
  // For each transcript segment
  for (const transcript of transcripts) {
    if (!transcript.words) continue;
    
    // Get the text of this segment
    const text = transcript.words.map((w: any) => w.text).join(" ");
    
    // Check if this segment mentions the topic (case insensitive)
    if (text.toLowerCase().includes(topic.toLowerCase())) {
      // Calculate an importance score
      // More occurrences = higher importance
      const occurrences = (text.toLowerCase().match(new RegExp(topic.toLowerCase(), 'g')) || []).length;
      
      // Position matters - earlier mentions might be more important
      const positionIndex = text.toLowerCase().indexOf(topic.toLowerCase()) / text.length;
      
      // Longer segments might have more context
      const lengthFactor = Math.min(1, transcript.words.length / 50);  // Cap at 50 words
      
      // Calculate importance (1-10 scale)
      const importance = Math.min(10, 
        occurrences * 2 +  // Each occurrence adds 2 points
        (1 - positionIndex) * 3 +  // Earlier mentions get up to 3 points
        lengthFactor * 2  // Longer segments get up to 2 points
      );
      
      results.push({
        startTime: transcript.start_time,
        speaker: transcript.speaker || "Unknown speaker",
        transcript,
        importance
      });
    }
  }
  
  return results;
}

/**
 * Find segments with multiple speakers engaged in conversation
 */
function findConversationSegments(
  transcripts: any[]
): Array<{
  startTime: number;
  speaker: string;
  transcript: any;
  speakerCount: number;
}> {
  // Need at least 3 segments to find a conversation
  if (transcripts.length < 3) return [];
  
  const conversations = [];
  
  // Look at consecutive groups of 3 segments
  for (let i = 0; i < transcripts.length - 2; i++) {
    const segment1 = transcripts[i];
    const segment2 = transcripts[i+1];
    const segment3 = transcripts[i+2];
    
    // Check if there are at least 2 different speakers
    const speakers = new Set([
      segment1.speaker, 
      segment2.speaker, 
      segment3.speaker
    ].filter(Boolean));
    
    if (speakers.size >= 2) {
      // Found a multi-speaker conversation
      conversations.push({
        startTime: segment1.start_time,
        speaker: segment1.speaker || "Unknown speaker",
        transcript: segment1,
        speakerCount: speakers.size
      });
      
      // Skip ahead to avoid overlapping conversations
      i += 2;
    }
  }
  
  return conversations;
}

/**
 * Deduplicate segments that are too close to each other
 * Keeps the most important segment when duplicates are found
 */
function deduplicateSegments(segments: any[]): any[] {
  if (segments.length <= 1) return segments;
  
  // Sort by importance first
  const sortedByImportance = [...segments].sort((a, b) => b.importance - a.importance);
  
  const result: any[] = [];
  const usedTimeRanges: number[] = [];
  
  // Start with the most important segments
  for (const segment of sortedByImportance) {
    // Check if this segment is too close to an already included one
    const isTooClose = usedTimeRanges.some(range => 
      Math.abs(segment.startTime - range) < 30  // 30 seconds threshold
    );
    
    if (!isTooClose) {
      result.push(segment);
      usedTimeRanges.push(segment.startTime);
    }
  }
  
  return result;
} 