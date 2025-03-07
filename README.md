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
  - Parameters: `meeting_url` (URL of the meeting to join), `name` (optional bot name)
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
           "cd /path/to/mcp-baas && npm run build && npm run start"
         ],
         "headers": {
           "x-api-key": "your-api-key"
         }
       }
     }
   }
   ```

3. Restart Claude Desktop.

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
