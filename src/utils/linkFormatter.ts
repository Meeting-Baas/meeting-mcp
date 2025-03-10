/**
 * Utilities for formatting and presenting meeting recording links
 */

/**
 * Base URL for the Meeting BaaS viewer
 */
export const VIEWER_BASE_URL = "https://meetingbaas.com/viewer";

/**
 * Formats a meeting link to the recording viewer
 */
export function formatMeetingLink(botId: string, timestamp?: number): string {
  if (!botId) {
    return "";
  }
  
  const baseLink = `${VIEWER_BASE_URL}/${botId}`;
  
  if (timestamp !== undefined && timestamp !== null) {
    return `${baseLink}?t=${Math.floor(timestamp)}`;
  }
  
  return baseLink;
}

/**
 * Creates a rich meeting link display, ready for sharing in chat
 */
export function createShareableLink(
  botId: string, 
  options: {
    title?: string;
    timestamp?: number;
    speakerName?: string;
    description?: string;
  } = {}
): string {
  const { title, timestamp, speakerName, description } = options;
  
  const link = formatMeetingLink(botId, timestamp);
  if (!link) {
    return "⚠️ No meeting link could be generated. Please provide a valid bot ID.";
  }
  
  // Construct the display text
  let displayText = "📽️ **Meeting Recording";
  
  if (title) {
    displayText += `: ${title}**`;
  } else {
    displayText += "**";
  }
  
  // Add timestamp info if provided
  if (timestamp !== undefined) {
    const timestampFormatted = formatTimestamp(timestamp);
    displayText += `\n⏱️ Timestamp: ${timestampFormatted}`;
  }
  
  // Add speaker info if provided
  if (speakerName) {
    displayText += `\n🎤 Speaker: ${speakerName}`;
  }
  
  // Add description if provided
  if (description) {
    displayText += `\n📝 ${description}`;
  }
  
  // Add the actual link
  displayText += `\n\n🔗 [View Recording](${link})`;
  
  return displayText;
}

/**
 * Format a timestamp in seconds to a human-readable format (HH:MM:SS)
 */
function formatTimestamp(seconds: number): string {
  if (seconds === undefined || seconds === null) {
    return "00:00:00";
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    secs.toString().padStart(2, "0"),
  ].join(":");
}

/**
 * Generates a shareable segment for multiple moments in a meeting
 */
export function createMeetingSegmentsList(
  botId: string,
  segments: Array<{
    timestamp: number;
    speaker?: string;
    description: string;
  }>
): string {
  if (!segments || segments.length === 0) {
    return createShareableLink(botId, { title: "Full Recording" });
  }
  
  let result = "## 📽️ Meeting Segments\n\n";
  
  segments.forEach((segment, index) => {
    const link = formatMeetingLink(botId, segment.timestamp);
    const timestampFormatted = formatTimestamp(segment.timestamp);
    
    result += `### Segment ${index + 1}: ${timestampFormatted}\n`;
    if (segment.speaker) {
      result += `**Speaker**: ${segment.speaker}\n`;
    }
    result += `**Description**: ${segment.description}\n`;
    result += `🔗 [Jump to this moment](${link})\n\n`;
  });
  
  result += `\n🔗 [View Full Recording](${formatMeetingLink(botId)})`;
  
  return result;
}

/**
 * Creates a compact single-line meeting link for inline sharing
 */
export function createInlineMeetingLink(botId: string, timestamp?: number, label?: string): string {
  const link = formatMeetingLink(botId, timestamp);
  const displayLabel = label || "View Recording";
  
  return `[${displayLabel}](${link})`;
} 