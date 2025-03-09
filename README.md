# Meeting BaaS MCP Server

A Model Context Protocol (MCP) server that provides tools for managing meeting data, including transcripts, recordings, calendar events, and search functionality.

## Overview

This project implements a Model Context Protocol (MCP) server that allows AI assistants like Claude and Cursor to access and manipulate meeting data. It exposes a set of tools and resources that can be used to:

- **Invite Meeting Bots**: Create and invite bots to your video conferences that automatically record and transcribe meetings

  ```
  "Create a new meeting bot for my Zoom call tomorrow"
  ```

- **Query Meeting Data**: Search through meeting transcripts and find specific information without watching entire recordings

  ```
  "Search my recent meetings for discussions about the quarterly budget"
  "Find all mentions of Project Apollo in yesterday's team meeting"
  "Show me parts of the meeting where Jane was speaking"
  ```

- **Manage Calendar Events**: View and organize calendar entries and upcoming meetings

- **Access Recording Information**: Get metadata about meeting recordings and their status

## Prerequisites

- Node.js (v16 or later)
- npm

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd mcp-baas
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

Start the server:

```bash
npm run start
```

By default, the server runs on port 7017 and exposes the MCP endpoint at `http://localhost:7017/mcp`.

## Available Tools

The server exposes several tools through the MCP protocol:

### Calendar Tools

- `oauthGuidance`: Get detailed step-by-step instructions on setting up OAuth for Google or Microsoft calendars
  - No parameters required
  - Returns comprehensive instructions for obtaining OAuth credentials and setting up calendar integration

- `listRawCalendars`: Lists available calendars from Google or Microsoft before integration
  - Parameters: `platform` ("Google" or "Microsoft"), `clientId`, `clientSecret`, `refreshToken`
  - Returns a list of available calendars with their IDs and primary status

- `setupCalendarOAuth`: Integrates a calendar using OAuth credentials
  - Parameters: `platform` ("Google" or "Microsoft"), `clientId`, `clientSecret`, `refreshToken`, `rawCalendarId` (optional)
  - Returns confirmation of successful integration with calendar details

- `listCalendars`: Lists all integrated calendars
  - No parameters required
  - Returns a list of all calendars with their names, email addresses, and UUIDs

- `getCalendar`: Gets detailed information about a specific calendar integration
  - Parameters: `calendarId` (UUID of the calendar)
  - Returns comprehensive calendar details

- `deleteCalendar`: Permanently removes a calendar integration
  - Parameters: `calendarId` (UUID of the calendar)
  - Returns confirmation of successful deletion

- `resyncAllCalendars`: Forces a refresh of all connected calendars
  - No parameters required
  - Returns the status of the sync operation

- `listUpcomingMeetings`: Lists upcoming meetings from a calendar
  - Parameters: `calendarId`, `status` (optional: "upcoming", "past", "all"), `limit` (optional)
  - Returns a list of meetings with their names, times, and recording status

- `listEvents`: Lists calendar events with comprehensive filtering options
  - Parameters: `calendarId`, plus optional filters like `startDateGte`, `startDateLte`, `attendeeEmail`, etc.
  - Returns detailed event listings with rich information

- `getEvent`: Gets detailed information about a specific calendar event
  - Parameters: `eventId` (UUID of the event)
  - Returns comprehensive event details including attendees and recording status

- `scheduleRecording`: Schedules a bot to record an upcoming meeting
  - Parameters: `eventId`, `botName`, plus optional settings like `botImage`, `recordingMode`, etc.
  - Returns confirmation of successful scheduling

- `cancelRecording`: Cancels a previously scheduled recording
  - Parameters: `eventId`, `allOccurrences` (optional, for recurring events)
  - Returns confirmation of successful cancellation

- `checkCalendarIntegration`: Checks and diagnoses calendar integration status
  - No parameters required
  - Returns a comprehensive status report and troubleshooting tips

### Meeting Tools

- `createBot`: Creates a meeting bot that can join video conferences to record and transcribe meetings
  - Parameters: 
    - `meeting_url` (URL of the meeting to join)
    - `name` (optional bot name)
    - `botImage` (optional URL to an image for the bot's avatar) 
    - `entryMessage` (optional message the bot will send when joining)
    - `deduplicationKey` (optional key to override the 5-minute restriction on joining the same meeting)
    - `nooneJoinedTimeout` (optional timeout in seconds for bot to leave if no one joins)
    - `waitingRoomTimeout` (optional timeout in seconds for bot to leave if stuck in waiting room)
    - `speechToTextProvider` (optional provider for transcription: "Gladia", "Runpod", or "Default")
    - `speechToTextApiKey` (optional API key for the speech-to-text provider)
    - `streamingInputUrl` (optional WebSocket URL to stream audio input)
    - `streamingOutputUrl` (optional WebSocket URL to stream audio output)
    - `streamingAudioFrequency` (optional frequency for streaming: "16khz" or "24khz")
    - `extra` (optional object with additional metadata about the meeting, such as meeting type, custom summary prompt, search keywords)
  - Returns: Bot details including ID and join status
- `getBots`: Lists all bots and their associated meetings
- `getBotsByMeeting`: Gets bots for a specific meeting URL
- `getRecording`: Retrieves recording information for a specific bot/meeting
- `getRecordingStatus`: Checks the status of a recording in progress

### Transcript Tools

- `searchTranscript`: Searches through meeting transcripts for specific terms
  - Parameters: `bot_id` (the bot that recorded the meeting), `query` (search term)
  - Returns: Matching segments with speaker information and timestamps
- `searchTranscriptByType`: Searches across meetings of a specific type (using the "extra" field)
  - Parameters: `meetingType` (type of meeting to search, e.g., "sales", "psychiatric"), `query` (search term), `limit` (max results, default 10)
  - Returns: Matching segments from meetings of the specified type, with speaker and timestamp information
- `findMeetingTopic`: Intelligently searches for a topic in a meeting, providing context around the mentions
  - Parameters: `meetingId` (the meeting to search), `topic` (the topic to find)
  - Returns: Contextual segments that mention the topic, with surrounding conversation for context
- `searchVideoSegment`: Finds specific segments of a video based on time range or speaker
  - Parameters: `botId` (the bot that recorded the meeting), `startTime` (optional), `endTime` (optional), `speaker` (optional)
  - Returns: Video segments with direct links to specific timestamps
- `intelligentSearch`: Performs an adaptive search across meeting data with natural language understanding
  - Parameters: 
    - `query` (natural language search query - supports meeting types, topics, speakers, dates, etc.)
    - `filters` (optional structured filters including `botId`, `calendarId`, `meetingType`, `speaker`, `startTime`, `endTime`)
    - `includeContext` (whether to include surrounding conversation, default: true)
    - `maxResults` (maximum results to return, default: 20)
    - `sortBy` (how to sort results: "relevance", "date", or "speaker", default: "relevance")
  - Returns: Rich, context-aware search results with meeting metadata and direct video links
  - Search approaches:
    - **Bot ID-based**: Searches within a specific meeting when you know the bot ID
    - **Calendar-based**: Searches across calendar events and their associated recordings
    - **Recent meetings**: Maintains session history of recently used bots for follow-up searches
  - Example queries:
    - "Find mentions of budget in meeting with bot ID abc-123"
    - "Search my marketing calendar for discussions about the Q4 campaign"
    - "What did Sarah say in our most recent meeting?"
- `getTranscriptSummary`: Gets an AI-generated summary of meeting content

## Example Workflows

### Recording a Meeting

1. Create a bot for your upcoming meeting:

   ```
   "Create a bot for my Zoom meeting at https://zoom.us/j/123456789"
   ```

2. The bot joins the meeting automatically and begins recording.

3. Check recording status:
   ```
   "What's the status of my meeting recording for the Zoom call I started earlier?"
   ```

### Calendar Integration and Automatic Recording

1. Get guidance on obtaining OAuth credentials:

   ```
   "I want to integrate my Google Calendar. How do I get OAuth credentials?"
   ```

2. List your available calendars before integration:

   ```
   "List my available Google calendars. Here are my OAuth credentials:
   - Client ID: my-client-id-123456789.apps.googleusercontent.com
   - Client Secret: my-client-secret-ABCDEF123456
   - Refresh Token: my-refresh-token-ABCDEF123456789"
   ```

3. Set up calendar integration with a specific calendar:

   ```
   "Integrate my Google Calendar using these credentials:
   - Platform: Google
   - Client ID: my-client-id-123456789.apps.googleusercontent.com
   - Client Secret: my-client-secret-ABCDEF123456
   - Refresh Token: my-refresh-token-ABCDEF123456789
   - Raw Calendar ID: primary@gmail.com"
   ```

4. View your upcoming meetings:

   ```
   "Show me my upcoming meetings from calendar 1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
   ```

5. Schedule recording for an upcoming meeting:

   ```
   "Schedule a recording for my team meeting with event ID 7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d.
   Configure the bot with:
   - Name: Team Meeting Bot
   - Recording Mode: gallery_view
   - Entry Message: Hello everyone, I'm here to record the meeting"
   ```

6. Check all recordings scheduled in your calendar:

   ```
   "Show me all meetings in my calendar that have recordings scheduled"
   ```

7. Cancel a previously scheduled recording:

   ```
   "Cancel the recording for event 7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d"
   ```

8. Refresh calendar data if meetings are missing:

   ```
   "Force a resync of all my connected calendars"
   ```

### Simplified Calendar Integration

For a simpler approach to calendar integration, you can directly configure your calendar OAuth credentials in the Claude Desktop configuration file:

1. Edit the configuration file:
   ```bash
   vim ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. Add the `calendarOAuth` section to your botConfig:
   ```json
   "botConfig": {
     // other bot configuration...
     
     "calendarOAuth": {
       "platform": "Google",  // or "Microsoft"
       "clientId": "YOUR_OAUTH_CLIENT_ID",
       "clientSecret": "YOUR_OAUTH_CLIENT_SECRET", 
       "refreshToken": "YOUR_REFRESH_TOKEN",
       "rawCalendarId": "primary@gmail.com"  // Optional
     }
   }
   ```

3. Save the file and restart Claude Desktop - your calendar will be automatically integrated.

This approach eliminates the need to manually call the OAuth setup tools, making calendar integration a one-time configuration task.

> **Note:** Calendar integration is completely optional. You can use Meeting BaaS without connecting a calendar by simply omitting the `calendarOAuth` section from your configuration. Calendar integration enhances the experience by providing access to your upcoming meetings and enabling automatic recording of calendar events.

### Analyzing Meeting Content

1. Search for specific topics:

   ```
   "Find all mentions of the marketing budget in yesterday's team meeting"
   ```

2. Get insights from specific speakers:

   ```
   "What did Sarah say about the new product launch in our meeting last Tuesday?"
   ```

3. Get meeting summaries:
   ```
   "Summarize the key points from this morning's standup meeting"
   ```

4. Search across meeting types:
   ```
   "Search for discussions about patient symptoms across all psychiatric meetings"
   ```

5. Find topics with context:
   ```
   "Find discussions about quarterly targets in meeting abc-123 and show me the surrounding conversation"
   ```

6. Find specific video segments:
   ```
   "Show me the video segments where John was speaking between 15 and 20 minutes into meeting xyz-456"
   ```

7. Search using meeting metadata:
   ```
   "Search my sales meetings for mentions of the new pricing strategy"
   ```

8. Use natural language search across all meetings:
   ```
   "Find any discussions about budget concerns in meetings from last week"
   "Show me what Sarah said about the product roadmap in recent meetings"
   "Search for conversations about customer feedback in yesterday's standup"
   "Find meeting segments where the team discussed implementation timeframes"
   ```

9. Use the different intelligent search approaches:
   ```
   // Bot ID-based search
   "Search in meeting abc-123 for mentions of the new product launch"
   
   // Calendar-based search
   "Find discussions about deadlines in my marketing team calendar"
   "Search through my work calendar for meetings where we discussed the budget"
   
   // Recent meetings search (no explicit bot ID needed)
   "What did Alex say about the database migration?"
   "Show me the parts where we talked about customer requirements"
   ```

## Configuration

The server can be configured through environment variables or by editing the `src/config.ts` file.

Key configuration options:

- `PORT`: The port the server listens on (default: 7017)
- `API_BASE_URL`: The base URL for the Meeting BaaS API
- `DEFAULT_API_KEY`: Default API key for testing

## Integration with Claude Desktop

To integrate with Claude Desktop:

1. Edit the Claude Desktop configuration file:

   ```bash
   vim ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. Add the Meeting BaaS MCP server configuration:

   ```json
   {
     "mcpServers": {
       "meetingbaas": {
         "command": "/bin/bash",
         "args": [
           "-c",
           "cd /path/to/meeting-mcp && (npm run build 1>&2) && MCP_FROM_CLAUDE=true node dist/index.js"
         ],
         "headers": {
           "x-api-key": "YOUR_API_KEY"
         },
         "botConfig": {
           "name": "Meeting Assistant",
           "image": "https://meetingbaas.com/static/972043b7d604bca0d4b0048c7dd67ad2/fc752/previewFeatures.avif",
           "entryMessage": "Hello, I'm a bot from Meeting Baas. I'll be taking notes for this meeting.",
           "deduplicationKey": "unique_key_to_override_restriction",
           "nooneJoinedTimeout": 600,
           "waitingRoomTimeout": 600,
           "speechToTextProvider": "Gladia",
           "speechToTextApiKey": "YOUR_SPEECH_TO_TEXT_API_KEY",
           "extra": {
             "meetingType": "sales",
             "summaryPrompt": "Focus on action items and decision points",
             "searchKeywords": ["budget", "timeline", "deliverables"],
             "timeStampHighlights": [
               {"time": "00:05:23", "note": "Discussion about Q2 sales numbers"},
               {"time": "00:12:47", "note": "Team disagreement on marketing strategy"}
             ],
             "participants": ["John Smith", "Jane Doe", "Bob Johnson"],
             "project": "Project Phoenix",
             "department": "Engineering",
             "priority": "High",
             "followupDate": "2023-12-15",
             "tags": ["technical", "planning", "retrospective"]
           },
           
           // Optional: Direct calendar OAuth integration
           // Add this section only if you want to enable calendar integration
           "calendarOAuth": {
             "platform": "Google",  // or "Microsoft"
             "clientId": "YOUR_OAUTH_CLIENT_ID",
             "clientSecret": "YOUR_OAUTH_CLIENT_SECRET",
             "refreshToken": "YOUR_REFRESH_TOKEN",
             "rawCalendarId": "primary@gmail.com"  // Optional - specific calendar ID
           }
         }
       }
     }
   }
   ```

   **Note:** Replace `/path/to/meeting-mcp` with the path to your local repository and `YOUR_API_KEY` with your actual API key.

3. Restart Claude Desktop.

The configuration explained:
- `command` specifies the shell to use
- `args` contains the command line arguments:
  - `cd` to your project directory
  - Build the project with error output redirected to stderr
  - Run the server with the `MCP_FROM_CLAUDE=true` environment variable to indicate it's running from Claude Desktop
- `headers` contains the API key for authentication
- `botConfig` allows you to customize the bot's appearance and behavior:
  - `name`: The name displayed for the bot in meetings (default: "Claude Assistant")
  - `image`: URL to a publicly accessible image to use as the bot's avatar (optional)
  - `entryMessage`: Message the bot will send when joining a meeting (optional)
  - `deduplicationKey`: A unique key to override the 5-minute restriction on joining the same meeting (optional)
  - `nooneJoinedTimeout`: Timeout in seconds for the bot to leave if no participants join (optional)
  - `waitingRoomTimeout`: Timeout in seconds for the bot to leave if stuck in waiting room (optional)
  - `speechToTextProvider`: Provider to use for transcription ("Gladia", "Runpod", "Default") (optional)
  - `speechToTextApiKey`: API key for the speech-to-text provider if required (optional)
  - `calendarOAuth`: Direct calendar integration with OAuth credentials (optional)
    - `platform`: "Google" or "Microsoft"
    - `clientId`: Your OAuth client ID
    - `clientSecret`: Your OAuth client secret
    - `refreshToken`: Your OAuth refresh token
    - `rawCalendarId`: Optional ID of specific calendar to integrate
  - `extra`: Additional metadata about meetings to enhance AI capabilities (optional)
    - Example: 
    ```json
    {
      "meetingType": "sales",                                 // Used by searchTranscriptByType and intelligentSearch
      "summaryPrompt": "Focus on action items and decision points",
      "searchKeywords": ["budget", "timeline", "deliverables"],  // Key terms that can be easily searched
      "timeStampHighlights": [                                // Can be used with searchVideoSegment
        {"time": "00:05:23", "note": "Discussion about Q2 sales numbers"},
        {"time": "00:12:47", "note": "Team disagreement on marketing strategy"}
      ],
      "participants": ["John Smith", "Jane Doe", "Bob Johnson"],  // Meeting participants for more context
      "project": "Project Phoenix",                           // Project association for filtering
      "department": "Engineering",                            // Organizational context
      "priority": "High",                                     // Meeting importance
      "followupDate": "2023-12-15",                           // When to revisit topics
      "tags": ["technical", "planning", "retrospective"]      // Flexible tagging system
    }
    ```

The `extra` field is extremely flexible - you can add any structured metadata that makes sense for your organization and use cases. All of this metadata is fully searchable by the `intelligentSearch` tool, which can extract meaning from natural language queries.

## Integration with Cursor

To integrate with Cursor:

1. Open Cursor
2. Go to Settings
3. Navigate to "Model Context Protocol"
4. Add a new server with:
   - Name: "Meeting BaaS MCP"
   - Type: "sse"
   - Server URL: "http://localhost:7017/mcp"
   - Optionally add headers if authentication is required

## Development

### Build

```bash
npm run build
```

### Test with MCP Inspector

```bash
npm run inspect
```

### Development mode (with auto-reload)

```bash
npm run dev
```

## Project Structure

- `src/index.ts`: Main entry point
- `src/tools/`: Tool implementations
- `src/resources/`: Resource definitions
- `src/api/`: API client for the Meeting BaaS backend
- `src/types/`: TypeScript type definitions
- `src/config.ts`: Server configuration

## Authentication

The server expects an API key in the `x-api-key` header for authentication. You can configure the default API key in the configuration.

## License

[MIT](LICENSE)
