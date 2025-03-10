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
});

/**
 * Tool for automatically finding and sharing key moments from a meeting
 */
export const findKeyMomentsTool = {
  name: "findKeyMoments",
  description: "Automatically find and share key moments from a meeting recording",
  parameters: findKeyMomentsParams,
  execute: async (args: z.infer<typeof findKeyMomentsParams>, context: Context<SessionAuth>) => {
    const { session, log } = context;
    log.info("Finding key moments in meeting", { botId: args.botId });
    
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
      
      // Find key moments based on the transcript
      const keyMoments = findInterestingMoments(transcripts, args.topics, args.maxMoments);
      
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
      
      return `# Key Moments from ${meetingTitle}\n\n${segmentsList}`;
      
    } catch (error) {
      return `Error finding key moments: ${error instanceof Error ? error.message : String(error)}. Please check that the bot ID is correct.`;
    }
  }
};

/**
 * Find interesting moments in a transcript
 */
function findInterestingMoments(
  transcripts: any[], 
  topics: string[] = [], 
  maxMoments = 5
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
  
  // If we have topics, prioritize finding segments that mention those topics
  if (topics && topics.length > 0) {
    for (const transcript of sortedTranscripts) {
      if (keyMoments.length >= maxMoments) break;
      
      const text = transcript.words
        ? transcript.words.map((w: any) => w.text).join(" ")
        : "";
      
      for (const topic of topics) {
        if (text.toLowerCase().includes(topic.toLowerCase())) {
          keyMoments.push({
            start_time: transcript.start_time,
            speaker: transcript.speaker,
            description: `Discussion about "${topic}"`
          });
          break;
        }
      }
    }
  }
  
  // If we still need more moments, select some based on other criteria
  if (keyMoments.length < maxMoments) {
    // Add meeting start
    if (sortedTranscripts.length > 0) {
      const first = sortedTranscripts[0];
      keyMoments.push({
        start_time: first.start_time,
        speaker: first.speaker,
        description: "Meeting start"
      });
    }
    
    // Select moments with longer speech (potentially important parts)
    const remainingNeeded = maxMoments - keyMoments.length;
    if (remainingNeeded > 0 && sortedTranscripts.length > 1) {
      const longestSegments = [...sortedTranscripts]
        .sort((a, b) => {
          const aLength = a.words ? a.words.length : 0;
          const bLength = b.words ? b.words.length : 0;
          return bLength - aLength;
        })
        .slice(0, remainingNeeded);
      
      for (const segment of longestSegments) {
        // Avoid duplicates
        if (!keyMoments.some(m => Math.abs(m.start_time - segment.start_time) < 30)) {
          keyMoments.push({
            start_time: segment.start_time,
            speaker: segment.speaker,
            description: "Extended discussion"
          });
        }
      }
    }
  }
  
  // Sort the moments by time
  return keyMoments.sort((a, b) => a.start_time - b.start_time);
} 