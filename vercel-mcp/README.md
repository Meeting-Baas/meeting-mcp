# Meeting BaaS MCP Server for Vercel

This is a Vercel-ready implementation of the Meeting BaaS MCP Server. It allows Claude and other AI assistants to manage recordings, transcripts, and calendar data through the Model Context Protocol (MCP) running on Vercel's serverless platform.

## Architecture

This implementation uses the official TypeScript SDK for Model Context Protocol and adapts our existing Meeting BaaS MCP server code to work with Vercel's serverless architecture:

- `/api/server.ts` - Main MCP API endpoint that handles all MCP requests
- `/lib/mcp-api-handler.ts` - Initializes the MCP server with Redis state management
- `/lib/adapter/` - Adapter layer that connects our existing tools and resources to the TypeScript SDK 

## Prerequisites

- Node.js 18+
- A Vercel account
- Redis database (required for session management)

## Local Development

1. Install dependencies:
   ```bash
   cd vercel-mcp
   npm install
   ```

2. Create a `.env.local` file based on the `.env.example`:
   ```
   cp .env.example .env.local
   ```

3. Edit `.env.local` with your Redis URL and API key.

4. Start the local development server:
   ```bash
   npm run dev
   ```

5. The MCP server will be available at:
   ```
   http://localhost:3000/api/server
   ```

## Testing

You can test the server using the included test client:

```bash
node scripts/test-client.mjs http://localhost:3000
```

## Deployment to Vercel

1. Push your code to a Git repository.
2. Create a new project in Vercel and connect it to your repository.
3. Configure the environment variables (same as in `.env.example`).
4. Make sure to set up a Redis instance and provide the connection URL.
5. Enable Fluid compute in Vercel for longer-running functions.

## Features

This implementation includes all the features of the original Meeting BaaS MCP server:

- Recording management
- Transcript access and search
- Calendar integration
- Meeting bots
- QR code generation
- And more!

## Differences from the Original Implementation

This Vercel implementation differs from the original FastMCP implementation in a few key ways:

- Uses the official TypeScript SDK for Model Context Protocol
- Runs on serverless infrastructure
- Uses Redis for state management
- Requires Vercel Fluid Compute for longer-running functions

The actual business logic and tools remain the same, with an adapter layer handling the conversion between the FastMCP format and the TypeScript SDK format.
