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

- `listCalendars`: Lists all available calendars
- `getCalendarEvents`: Gets events from a specified calendar

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
  - Returns: Bot details including ID and join status
- `getBots`: Lists all bots and their associated meetings
- `getBotsByMeeting`: Gets bots for a specific meeting URL
- `getRecording`: Retrieves recording information for a specific bot/meeting
- `getRecordingStatus`: Checks the status of a recording in progress

### Transcript Tools

- `searchTranscript`: Searches through meeting transcripts for specific terms
  - Parameters: `bot_id` (the bot that recorded the meeting), `query` (search term)
  - Returns: Matching segments with speaker information and timestamps
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
           "speechToTextApiKey": "YOUR_SPEECH_TO_TEXT_API_KEY"
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
