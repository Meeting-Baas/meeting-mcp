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
  autoDetectTopics: z.boolean().default(false)
    .describe("Automatically detect important topics in the meeting without requiring predefined topics"),
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
      
      // Adjust maxMoments based on granularity
      let adjustedMaxMoments = args.maxMoments;
      if (args.granularity === "high") {
        adjustedMaxMoments = Math.max(10, args.maxMoments);
      } else if (args.granularity === "low") {
        adjustedMaxMoments = Math.min(3, args.maxMoments);
      }
      
      // Auto-detect topics if requested
      let topicsToSearch = args.topics || [];
      if (args.autoDetectTopics) {
        const detectedTopics = detectTopicsFromTranscript(transcripts, args.granularity);
        topicsToSearch = [...new Set([...topicsToSearch, ...detectedTopics])];
      }
      
      // Find key moments based on the transcript
      const keyMoments = findInterestingMoments(
        transcripts, 
        topicsToSearch, 
        adjustedMaxMoments,
        args.granularity
      );
      
      if (keyMoments.length === 0) {
        return `No key moments found in meeting "${meetingTitle}". You can view the full recording:\n\n${createShareableLink(args.botId, { title: meetingTitle })}`;
      }
      
      // Format the segments
      const formattedSegments = keyMoments.map(moment => ({
        timestamp: moment.start_time,
        speaker: moment.speaker,
        description: moment.description
      }));
      
      // Create the segments list with the full title
      const segmentsList = createMeetingSegmentsList(args.botId, formattedSegments);
      
      // Include auto-detected topics if any were found
      let result = `# Key Moments from ${meetingTitle}\n\n`;
      
      if (args.autoDetectTopics && topicsToSearch.length > 0) {
        result += `## Main Topics Discussed\n${topicsToSearch.map(topic => `- ${topic}`).join('\n')}\n\n`;
      }
      
      result += segmentsList;
      
      return result;
      
    } catch (error) {
      return `Error finding key moments: ${error instanceof Error ? error.message : String(error)}. Please check that the bot ID is correct.`;
    }
  }
};

/**
 * Detects important topics from a transcript based on keyword frequency and context
 */
function detectTopicsFromTranscript(
  transcripts: any[], 
  granularity: string = "medium"
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
  
  // Tokenize the text
  const words = fullText.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .split(/\s+/);
  
  // Define stopwords (common words to ignore)
  const stopwords = new Set([
    "a", "an", "the", "and", "or", "but", "is", "are", "was", "were", "be", "been", "being",
    "in", "on", "at", "to", "for", "with", "by", "about", "like", "through", "over", "before",
    "after", "between", "under", "above", "of", "during", "this", "that", "these", "those",
    "it", "its", "it's", "we", "our", "us", "they", "their", "them", "i", "my", "me", "he", "his", "him",
    "she", "her", "you", "your", "have", "has", "had", "do", "does", "did", "will", "would", "shall",
    "should", "can", "could", "may", "might", "must", "just", "very", "so", "too", "also", "as"
  ]);
  
  // Count word frequencies, ignoring stopwords
  const wordFrequency: Record<string, number> = {};
  for (const word of words) {
    if (word.length > 3 && !stopwords.has(word)) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  }
  
  // Extract phrases (2-3 word combinations)
  const phrases: Record<string, number> = {};
  for (let i = 0; i < transcripts.length; i++) {
    const text = transcripts[i].words
      ? transcripts[i].words.map((w: any) => w.text).join(" ").toLowerCase()
      : "";
    
    const tokens = text.split(/\s+/);
    
    // Extract 2-word phrases
    for (let j = 0; j < tokens.length - 1; j++) {
      if (tokens[j].length > 3 && tokens[j+1].length > 3) {
        const phrase = `${tokens[j]} ${tokens[j+1]}`;
        phrases[phrase] = (phrases[phrase] || 0) + 1;
      }
    }
    
    // Extract 3-word phrases
    for (let j = 0; j < tokens.length - 2; j++) {
      if (tokens[j].length > 3 && tokens[j+2].length > 3) {
        const phrase = `${tokens[j]} ${tokens[j+1]} ${tokens[j+2]}`;
        phrases[phrase] = (phrases[phrase] || 0) + 1;
      }
    }
  }
  
  // Determine number of topics to return based on granularity
  let topicCount = 5;
  if (granularity === "high") {
    topicCount = 10;
  } else if (granularity === "low") {
    topicCount = 3;
  }
  
  // Combine word and phrase frequencies, prioritizing phrases
  const combined = { ...wordFrequency };
  for (const [phrase, count] of Object.entries(phrases)) {
    // Phrases need to appear at least twice to be considered
    if (count >= 2) {
      combined[phrase] = count * 2;  // Weight phrases higher
    }
  }
  
  // Sort by frequency and get top N topics
  const sortedTopics = Object.entries(combined)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);
  
  // Return top N topics
  return sortedTopics.slice(0, topicCount);
}

/**
 * Find interesting moments in a transcript
 */
function findInterestingMoments(
  transcripts: any[], 
  topics: string[] = [], 
  maxMoments = 5,
  granularity: string = "medium"
): Array<{ 
  start_time: number; 
  speaker: string; 
  description: string;
}> {
  if (!transcripts || transcripts.length === 0) {
    return [];
  }
  
  const keyMoments = [];
  
  // Sort transcripts by start time
  const sortedTranscripts = [...transcripts].sort((a, b) => a.start_time - b.start_time);
  
  // Calculate appropriate segment size based on granularity and total meeting length
  const meetingStart = sortedTranscripts[0].start_time;
  const meetingEnd = sortedTranscripts[sortedTranscripts.length - 1].start_time;
  const meetingDuration = meetingEnd - meetingStart;
  
  let segmentSize = Math.floor(meetingDuration / 10); // Default for medium granularity
  if (granularity === "high") {
    segmentSize = Math.floor(meetingDuration / 20); // Smaller segments for high granularity
  } else if (granularity === "low") {
    segmentSize = Math.floor(meetingDuration / 5); // Larger segments for low granularity
  }
  
  // Minimum segment size of 30 seconds
  segmentSize = Math.max(segmentSize, 30);
  
  // Group transcripts into segments
  const segments: Array<any[]> = [];
  let currentSegment: any[] = [];
  let currentSegmentStart = meetingStart;
  
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
  
  // If we have topics, prioritize finding segments that mention those topics
  if (topics && topics.length > 0) {
    for (const segment of segments) {
      if (keyMoments.length >= maxMoments) break;
      
      // Combine all text in this segment
      const segmentText = segment.map(transcript => {
        return transcript.words
          ? transcript.words.map((w: any) => w.text).join(" ")
          : "";
      }).join(" ").toLowerCase();
      
      for (const topic of topics) {
        if (segmentText.includes(topic.toLowerCase())) {
          const representativeTranscript = segment[0]; // Use the first transcript as representative
          keyMoments.push({
            start_time: representativeTranscript.start_time,
            speaker: representativeTranscript.speaker,
            description: `Discussion about "${topic}"`
          });
          break;
        }
      }
    }
  }
  
  // Always include meeting start
  if (sortedTranscripts.length > 0 && keyMoments.length < maxMoments) {
    const first = sortedTranscripts[0];
    // Check if we already have a moment close to the start
    if (!keyMoments.some(m => Math.abs(m.start_time - first.start_time) < 30)) {
      keyMoments.push({
        start_time: first.start_time,
        speaker: first.speaker,
        description: "Meeting start"
      });
    }
  }
  
  // Always try to include meeting end if we have space
  if (sortedTranscripts.length > 0 && keyMoments.length < maxMoments) {
    const last = sortedTranscripts[sortedTranscripts.length - 1];
    // Check if we already have a moment close to the end
    if (!keyMoments.some(m => Math.abs(m.start_time - last.start_time) < 30)) {
      keyMoments.push({
        start_time: last.start_time,
        speaker: last.speaker,
        description: "Meeting conclusion"
      });
    }
  }
  
  // Find segments with high engagement (multiple speakers)
  if (keyMoments.length < maxMoments) {
    for (const segment of segments) {
      if (keyMoments.length >= maxMoments) break;
      
      // Count unique speakers in this segment
      const speakers = new Set(segment.map(t => t.speaker));
      
      if (speakers.size > 1) {
        const representative = segment[0];
        // Check if we already have this moment
        if (!keyMoments.some(m => Math.abs(m.start_time - representative.start_time) < segmentSize)) {
          keyMoments.push({
            start_time: representative.start_time,
            speaker: representative.speaker,
            description: `Discussion with ${speakers.size} participants`
          });
        }
      }
    }
  }
  
  // If we still need more moments, select segments with longer speech (potentially important parts)
  if (keyMoments.length < maxMoments) {
    const remainingNeeded = maxMoments - keyMoments.length;
    
    // Find longest segments by word count
    const rankedSegments = segments
      .map(segment => {
        const totalWords = segment.reduce((sum, transcript) => {
          return sum + (transcript.words ? transcript.words.length : 0);
        }, 0);
        return { segment, totalWords };
      })
      .sort((a, b) => b.totalWords - a.totalWords)
      .slice(0, remainingNeeded);
    
    for (const { segment } of rankedSegments) {
      const representative = segment[0];
      // Check if we already have this moment
      if (!keyMoments.some(m => Math.abs(m.start_time - representative.start_time) < segmentSize)) {
        keyMoments.push({
          start_time: representative.start_time,
          speaker: representative.speaker,
          description: "Extended discussion"
        });
      }
    }
  }
  
  // Sort the moments by time
  return keyMoments.sort((a, b) => a.start_time - b.start_time);
} 