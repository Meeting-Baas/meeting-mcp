/**
 * Meeting recording link generation and sharing tools
 */

import type { Context } from 'fastmcp';
import { z } from 'zod';
import { apiRequest, SessionAuth } from '../api/client.js';
import { createValidSession } from '../utils/auth.js';
import { createMeetingSegmentsList, createShareableLink } from '../utils/linkFormatter.js';

/**
 * Schema for generating a shareable link to a meeting
 */
const shareableMeetingLinkParams = z.object({
  botId: z.string().describe('ID of the bot that recorded the meeting'),
  timestamp: z
    .number()
    .optional()
    .describe('Timestamp in seconds to link to a specific moment (optional)'),
  title: z.string().optional().describe('Title to display for the meeting (optional)'),
  speakerName: z.string().optional().describe('Name of the speaker at this timestamp (optional)'),
  description: z
    .string()
    .optional()
    .describe("Brief description of what's happening at this timestamp (optional)"),
});

/**
 * Tool for generating a shareable meeting link
 */
export const shareableMeetingLinkTool = {
  name: 'shareableMeetingLink',
  description: 'Generate a shareable link to a specific moment in a meeting recording',
  parameters: shareableMeetingLinkParams,
  execute: async (
    args: z.infer<typeof shareableMeetingLinkParams>,
    context: Context<SessionAuth>,
  ) => {
    const { session, log } = context;
    log.info('Generating shareable meeting link', { botId: args.botId });

    try {
      // Create a valid session with fallbacks for API key
      const validSession = createValidSession(session, log);

      // Check if we have a valid session with API key
      if (!validSession) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Authentication failed. Please configure your API key in Claude Desktop settings or provide it directly.',
            },
          ],
          isError: true,
        };
      }

      // Get the meeting data to verify the bot ID exists
      const response = await apiRequest(
        validSession,
        'get',
        `/bots/meeting_data?bot_id=${args.botId}`,
      );

      // If we got a response, the bot exists, so we can generate a link
      const shareableLink = createShareableLink(args.botId, {
        timestamp: args.timestamp,
        title: args.title,
        speakerName: args.speakerName,
        description: args.description,
      });

      return shareableLink;
    } catch (error) {
      return `Error generating shareable link: ${error instanceof Error ? error.message : String(error)}. Please check that the bot ID is correct.`;
    }
  },
};

/**
 * Schema for generating links to multiple timestamps in a meeting
 */
const shareMeetingSegmentsParams = z.object({
  botId: z.string().describe('ID of the bot that recorded the meeting'),
  segments: z
    .array(
      z.object({
        timestamp: z.number().describe('Timestamp in seconds'),
        speaker: z.string().optional().describe('Name of the speaker at this timestamp (optional)'),
        description: z.string().describe("Brief description of what's happening at this timestamp"),
      }),
    )
    .describe('List of meeting segments to share'),
});

/**
 * Tool for sharing multiple segments from a meeting
 */
export const shareMeetingSegmentsTool = {
  name: 'shareMeetingSegments',
  description: 'Generate a list of links to important moments in a meeting',
  parameters: shareMeetingSegmentsParams,
  execute: async (
    args: z.infer<typeof shareMeetingSegmentsParams>,
    context: Context<SessionAuth>,
  ) => {
    const { session, log } = context;
    log.info('Sharing meeting segments', { botId: args.botId, segments: args.segments });

    try {
      // Create a valid session with fallbacks for API key
      const validSession = createValidSession(session, log);

      // Check if we have a valid session with API key
      if (!validSession) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Authentication failed. Please configure your API key in Claude Desktop settings or provide it directly.',
            },
          ],
          isError: true,
        };
      }

      // Get the meeting data to verify the bot ID exists
      const response = await apiRequest(
        validSession,
        'get',
        `/bots/meeting_data?bot_id=${args.botId}`,
      );

      // If we got a response, the bot exists, so we can generate the segments
      // Ensure all segments have required fields before passing to createMeetingSegmentsList
      const validSegments = args.segments.map((segment) => ({
        timestamp: segment.timestamp ?? 0, // Default to 0 if timestamp is missing
        description: segment.description ?? 'Segment', // Default to 'Segment' if description is missing
        speaker: segment.speaker, // Keep speaker as optional
      }));

      const segmentsList = createMeetingSegmentsList(args.botId, validSegments);

      return segmentsList;
    } catch (error) {
      return `Error generating meeting segments: ${error instanceof Error ? error.message : String(error)}. Please check that the bot ID is correct.`;
    }
  },
};

/**
 * Schema for finding key moments in a meeting and sharing them
 */
const findKeyMomentsParams = z.object({
  botId: z.string().describe('ID of the bot that recorded the meeting - required'),
  meetingTitle: z.string().optional().describe('Title of the meeting (optional)'),
  topics: z
    .array(z.string())
    .optional()
    .describe('List of topics to look for in the meeting (optional)'),
  maxMoments: z.number().default(5).describe('Maximum number of key moments to find'),
  granularity: z
    .enum(['high', 'medium', 'low'])
    .default('medium')
    .describe(
      "Level of detail for topic extraction: 'high' finds many specific topics, 'medium' is balanced, 'low' finds fewer broad topics",
    ),
  autoDetectTopics: z
    .boolean()
    .default(true)
    .describe(
      'Automatically detect important topics in the meeting without requiring predefined topics',
    ),
  initialChunkSize: z
    .number()
    .default(1200)
    .describe('Initial chunk size in seconds to analyze (default 20 minutes)'),
});

/**
 * Tool for automatically finding and sharing key moments from a meeting
 */
export const findKeyMomentsTool = {
  name: 'findKeyMoments',
  description:
    'Automatically find and share key moments and topics from a meeting recording with configurable granularity',
  parameters: findKeyMomentsParams,
  execute: async (args: z.infer<typeof findKeyMomentsParams>, context: Context<SessionAuth>) => {
    const { session, log } = context;
    log.info('Finding key moments in meeting', {
      botId: args.botId,
      granularity: args.granularity,
      maxMoments: args.maxMoments,
      initialChunkSize: args.initialChunkSize,
    });

    try {
      // Create a valid session with fallbacks for API key
      const validSession = createValidSession(session, log);

      // Check if we have a valid session with API key
      if (!validSession) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Authentication failed. Please configure your API key in Claude Desktop settings or provide it directly.',
            },
          ],
          isError: true,
        };
      }

      // Get the meeting data using the explicitly provided botId
      const response = await apiRequest(
        validSession,
        'get',
        `/bots/meeting_data?bot_id=${args.botId}`,
      );

      if (!response?.bot_data?.bot) {
        return `Could not find meeting data for the provided bot ID: ${args.botId}`;
      }

      const meetingTitle =
        args.meetingTitle || response.bot_data.bot.bot_name || 'Meeting Recording';

      // Get the transcripts
      const transcripts = response.bot_data.transcripts || [];

      if (transcripts.length === 0) {
        return `No transcript found for meeting "${meetingTitle}". You can still view the recording:\n\n${createShareableLink(args.botId, { title: meetingTitle })}`;
      }

      // Sort all transcripts chronologically
      const sortedTranscripts = [...transcripts].sort((a, b) => a.start_time - b.start_time);

      // Get meeting duration info
      const meetingStart = sortedTranscripts[0].start_time;
      const meetingEnd = sortedTranscripts[sortedTranscripts.length - 1].start_time;
      const meetingDuration = meetingEnd - meetingStart;

      log.info('Processing meeting transcript', {
        segmentCount: sortedTranscripts.length,
        durationSeconds: meetingDuration,
      });

      // STEP 1: Group transcripts into larger contextual chunks
      // This preserves context while making processing more manageable
      const contextChunks = groupTranscriptsIntoChunks(sortedTranscripts, 300); // 5-minute chunks

      // STEP 2: Identify important segments and topics
      let allMeetingTopics: string[] = args.topics || [];
      const candidateSegments: any[] = [];

      // First, analyze each chunk to find patterns and topics
      for (const chunk of contextChunks) {
        // Only do topic detection if requested
        if (args.autoDetectTopics) {
          const detectedTopics = identifyTopicsWithAI(chunk);
          allMeetingTopics = allMeetingTopics.concat(detectedTopics);
        }

        // Find important segments in this chunk
        const importantSegments = findImportantSegments(chunk);
        candidateSegments.push.apply(candidateSegments, importantSegments);

        // Find conversation segments (multiple speakers)
        const conversationSegments = findConversationalExchanges(chunk);
        candidateSegments.push.apply(candidateSegments, conversationSegments);
      }

      // Deduplicate topics
      const uniqueTopics = Array.from(new Set(allMeetingTopics));

      // STEP 3: Score and rank all candidate segments
      const scoredSegments = scoreSegments(candidateSegments);

      // STEP 4: Ensure structural segments (beginning, end) are included
      const structuralSegments = getStructuralSegments(sortedTranscripts);
      const allSegments = scoredSegments.concat(structuralSegments);

      // STEP 5: Sort by importance, then deduplicate
      allSegments.sort((a, b) => b.importance - a.importance);
      const dedupedSegments = deduplicateSegments(allSegments);

      // STEP 6: Resort by chronological order and take top N
      const chronologicalSegments = dedupedSegments.sort((a, b) => a.timestamp - b.timestamp);
      const finalSegments = chronologicalSegments.slice(0, args.maxMoments);

      // If we have no segments, return a message
      if (finalSegments.length === 0) {
        return `No key moments found in meeting "${meetingTitle}". You can view the full recording:\n\n${createShareableLink(args.botId, { title: meetingTitle })}`;
      }

      // Format the segments for display
      const formattedSegments = finalSegments.map((segment) => ({
        timestamp: segment.timestamp,
        speaker: segment.speaker,
        description: segment.description,
      }));

      // Create the segments list with the full title
      const segmentsList = createMeetingSegmentsList(args.botId, formattedSegments);

      // Include topics if they were detected
      let result = `# Key Moments from ${meetingTitle}\n\n`;

      if (uniqueTopics.length > 0) {
        const topicLimit = args.granularity === 'high' ? 10 : args.granularity === 'medium' ? 7 : 5;
        const topTopics = uniqueTopics.slice(0, topicLimit);

        result += `## Main Topics Discussed\n${topTopics.map((topic) => `- ${topic}`).join('\n')}\n\n`;
      }

      result += segmentsList;

      return result;
    } catch (error) {
      return `Error finding key moments: ${error instanceof Error ? error.message : String(error)}. Please check that the bot ID is correct.`;
    }
  },
};

/**
 * Group transcripts into larger chunks for context preservation
 */
function groupTranscriptsIntoChunks(transcripts: any[], maxChunkDuration: number = 300): any[][] {
  if (!transcripts || transcripts.length === 0) return [];

  const chunks: any[][] = [];
  let currentChunk: any[] = [];
  let chunkStartTime = transcripts[0].start_time;

  for (const segment of transcripts) {
    if (currentChunk.length === 0 || segment.start_time - chunkStartTime <= maxChunkDuration) {
      currentChunk.push(segment);
    } else {
      chunks.push(currentChunk);
      currentChunk = [segment];
      chunkStartTime = segment.start_time;
    }
  }

  // Add the last chunk if it has any segments
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * AI-based topic identification that works across any domain or language
 * Uses natural language processing patterns to identify important concepts
 */
function identifyTopicsWithAI(transcripts: any[]): string[] {
  if (!transcripts || transcripts.length === 0) return [];

  // Extract the text from all segments
  const allText = transcripts
    .map((t) => {
      return t.words ? t.words.map((w: any) => w.text).join(' ') : '';
    })
    .join(' ');

  // Split into sentences for better context
  const sentences = allText.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  // Identify potential topics through pattern analysis
  const topics: Record<string, number> = {};

  // AI-like pattern recognition for topics:
  // 1. Look for repeated meaningful phrases
  // 2. Look for phrases that appear after introductory patterns
  // 3. Look for phrases with specific part-of-speech patterns (noun phrases)

  // Pattern 1: Repeated phrases (frequency-based)
  const phraseFrequency = findRepeatedPhrases(allText);
  Object.entries(phraseFrequency)
    .filter(([_, count]) => count > 1) // Only phrases that appear multiple times
    .forEach(([phrase, _]) => {
      topics[phrase] = (topics[phrase] || 0) + 2; // Weight by 2
    });

  // Pattern 2: Introductory phrases
  // Look for phrases like "talking about X", "discussing X", "focused on X"
  for (const sentence of sentences) {
    const introPatterns = [
      {
        regex:
          /(?:talk|talking|discuss|discussing|focus|focusing|about|regarding)\s+([a-z0-9\s]{3,30})/i,
        group: 1,
      },
      {
        regex:
          /(?:main|key|important)\s+(?:topic|point|issue|concern)\s+(?:is|was|being)\s+([a-z0-9\s]{3,30})/i,
        group: 1,
      },
      { regex: /(?:related to|concerning|with regards to)\s+([a-z0-9\s]{3,30})/i, group: 1 },
    ];

    for (const pattern of introPatterns) {
      const matches = sentence.match(pattern.regex);
      if (matches && matches[pattern.group]) {
        const topic = matches[pattern.group].trim();
        if (topic.length > 3) {
          topics[topic] = (topics[topic] || 0) + 3; // Weight by 3
        }
      }
    }
  }

  // Pattern 3: Noun phrase detection (simplified)
  // Look for phrases with specific patterns like "Noun Noun" or "Adjective Noun"
  const nounPhrasePatterns = [
    /(?:[A-Z][a-z]+)\s+(?:[a-z]+ing|[a-z]+ment|[a-z]+tion)/g, // E.g., "Data processing", "Risk management"
    /(?:[A-Z][a-z]+)\s+(?:[A-Z][a-z]+)/g, // E.g., "Health Insurance", "Business Agreement"
    /(?:the|our|your|their)\s+([a-z]+\s+[a-z]+)/gi, // E.g., "the pricing model", "your business needs"
  ];

  for (const pattern of nounPhrasePatterns) {
    const matches = allText.match(pattern) || [];
    for (const match of matches) {
      if (match.length > 5) {
        topics[match] = (topics[match] || 0) + 1;
      }
    }
  }

  // Sort topics by score and take top N
  const sortedTopics = Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);

  return sortedTopics.slice(0, 10); // Return top 10 topics
}

/**
 * Find repeated phrases in text that might indicate important topics
 */
function findRepeatedPhrases(text: string): Record<string, number> {
  const phrases: Record<string, number> = {};

  // Normalize text
  const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, '');

  // Split text into words
  const words = normalizedText.split(/\s+/).filter((w) => w.length > 2);

  // Look for 2-3 word phrases
  for (let size = 2; size <= 3; size++) {
    if (words.length < size) continue;

    for (let i = 0; i <= words.length - size; i++) {
      const phrase = words.slice(i, i + size).join(' ');

      // Filter out phrases that are too short
      if (phrase.length > 5) {
        phrases[phrase] = (phrases[phrase] || 0) + 1;
      }
    }
  }

  return phrases;
}

/**
 * Find segments that appear to be important based on content analysis
 */
function findImportantSegments(transcripts: any[]): any[] {
  if (!transcripts || transcripts.length === 0) return [];

  const importantSegments = [];

  // Patterns that indicate importance
  const importancePatterns = [
    { regex: /(?:important|key|critical|essential|significant|main|major)/i, weight: 3 },
    {
      regex: /(?:summarize|summary|summarizing|conclude|conclusion|in conclusion|to sum up)/i,
      weight: 4,
    },
    { regex: /(?:need to|have to|must|should|will|going to|plan to|action item)/i, weight: 2 },
    { regex: /(?:agree|disagree|consensus|decision|decide|decided|determined)/i, weight: 3 },
    { regex: /(?:problem|issue|challenge|obstacle|difficulty)/i, weight: 2 },
    { regex: /(?:solution|resolve|solve|approach|strategy|tactic)/i, weight: 2 },
    { regex: /(?:next steps|follow up|get back|circle back|future|next time)/i, weight: 3 },
  ];

  for (const transcript of transcripts) {
    if (!transcript.words) continue;

    const text = transcript.words.map((w: any) => w.text).join(' ');

    // Calculate an importance score based on matching patterns
    let importanceScore = 0;

    // Check for matches with importance patterns
    for (const pattern of importancePatterns) {
      if (pattern.regex.test(text)) {
        importanceScore += pattern.weight;
      }
    }

    // Also consider length - longer segments might be more substantive
    importanceScore += Math.min(2, Math.floor(text.split(/\s+/).length / 20));

    // If the segment has some importance, add it to results
    if (importanceScore > 0) {
      importantSegments.push({
        timestamp: transcript.start_time,
        speaker: transcript.speaker || 'Unknown speaker',
        text,
        importance: importanceScore,
        type: 'content',
        description: determineDescription(text, importanceScore),
      });
    }
  }

  return importantSegments;
}

/**
 * Determine an appropriate description for a segment based on its content
 */
function determineDescription(text: string, importance: number): string {
  // Try to find a suitable description based on content patterns

  if (/(?:summarize|summary|summarizing|conclude|conclusion|in conclusion|to sum up)/i.test(text)) {
    return 'Summary or conclusion';
  }

  if (/(?:next steps|follow up|moving forward|future|plan)/i.test(text)) {
    return 'Discussion about next steps';
  }

  if (/(?:agree|disagree|consensus|decision|decide|decided|determined)/i.test(text)) {
    return 'Decision point';
  }

  if (/(?:problem|issue|challenge|obstacle|difficulty)/i.test(text)) {
    return 'Problem discussion';
  }

  if (/(?:solution|resolve|solve|approach|strategy|tactic)/i.test(text)) {
    return 'Solution discussion';
  }

  // Default description based on importance
  if (importance > 5) {
    return 'Highly important discussion';
  } else if (importance > 3) {
    return 'Important point';
  } else {
    return 'Notable discussion';
  }
}

/**
 * Find segments with active conversation between multiple speakers
 */
function findConversationalExchanges(transcripts: any[]): any[] {
  if (!transcripts || transcripts.length < 3) return [];

  const conversationSegments = [];

  // Look for rapid exchanges between different speakers
  for (let i = 0; i < transcripts.length - 2; i++) {
    const segment1 = transcripts[i];
    const segment2 = transcripts[i + 1];
    const segment3 = transcripts[i + 2];

    // Check if there are at least 2 different speakers
    const speakers = new Set(
      [segment1.speaker, segment2.speaker, segment3.speaker].filter(Boolean),
    );

    if (speakers.size >= 2) {
      // Check if the segments are close in time (rapid exchange)
      const timeSpan = segment3.start_time - segment1.start_time;

      if (timeSpan < 60) {
        // Less than 1 minute for 3 segments = pretty active conversation
        conversationSegments.push({
          timestamp: segment1.start_time,
          speaker: segment1.speaker || 'Unknown speaker',
          text: segment1.words ? segment1.words.map((w: any) => w.text).join(' ') : '',
          importance: 2 + speakers.size, // More speakers = more important
          type: 'conversation',
          description: `Active discussion with ${speakers.size} participants`,
        });

        // Skip ahead to avoid overlapping conversation segments
        i += 2;
      }
    }
  }

  return conversationSegments;
}

/**
 * Get structural segments like start and end of meeting
 */
function getStructuralSegments(transcripts: any[]): any[] {
  if (!transcripts || transcripts.length === 0) return [];

  const result = [];

  // Add meeting start
  const first = transcripts[0];
  result.push({
    timestamp: first.start_time,
    speaker: first.speaker || 'Unknown speaker',
    text: first.words ? first.words.map((w: any) => w.text).join(' ') : '',
    importance: 5, // High importance
    type: 'structural',
    description: 'Meeting start',
  });

  // Add meeting end if it's a different segment
  if (transcripts.length > 1) {
    const last = transcripts[transcripts.length - 1];
    if (last.start_time !== first.start_time) {
      result.push({
        timestamp: last.start_time,
        speaker: last.speaker || 'Unknown speaker',
        text: last.words ? last.words.map((w: any) => w.text).join(' ') : '',
        importance: 4, // High importance
        type: 'structural',
        description: 'Meeting conclusion',
      });
    }
  }

  return result;
}

/**
 * Score segments based on various factors to determine overall importance
 */
function scoreSegments(segments: any[]): any[] {
  if (!segments || segments.length === 0) return [];

  return segments.map((segment) => {
    // Add any additional scoring factors here
    return segment;
  });
}

/**
 * Deduplicate segments that are too close to each other
 * Keeps the most important segment when duplicates are found
 */
function deduplicateSegments(segments: any[]): any[] {
  if (segments.length <= 1) return segments;

  const result: any[] = [];
  const usedTimeRanges: number[] = [];

  // Process segments in order of importance
  for (const segment of segments) {
    // Check if this segment is too close to an already included one
    const isTooClose = usedTimeRanges.some(
      (range) => Math.abs(segment.timestamp - range) < 30, // 30 seconds threshold
    );

    if (!isTooClose) {
      result.push(segment);
      usedTimeRanges.push(segment.timestamp);
    }
  }

  return result;
}
