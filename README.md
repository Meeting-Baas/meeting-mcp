# Meeting BaaS MCP Server for Vercel

This is the Model Context Protocol (MCP) server for Meeting BaaS, designed to be deployed on Vercel. It allows Claude and other AI assistants to manage recordings, transcripts, and calendar data.

## Architecture

The server has been reorganized to work with Vercel's serverless architecture:

- `/api/mcp.ts` - Main MCP API endpoint that handles all MCP requests
- `/lib/mcp-api-handler.ts` - Initializes the MCP server with Redis state management
- `/lib/tool-adapter.ts` - Adapter for converting our existing tools to the MCP format
- `/lib/resource-adapter.ts` - Adapter for resource templates
- Original code in `/src` remains mostly unchanged

## Prerequisites

- Node.js 18+
- A Vercel account
- Redis database (required for session management)

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with the following variables:
   ```
   REDIS_URL=redis://username:password@host:port
   MEETING_BAAS_API_KEY=your-api-key
   MEETING_BAAS_ENV=prod  # or gmeetbot, preprod
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. The MCP server will be available at:
   ```
   http://localhost:3000/api/mcp
   ```

## Deployment to Vercel

### Setting up Redis

1. Create a Redis database. You can use [Upstash](https://upstash.com/), [Redis Labs](https://redis.com/), or any other Redis provider.
2. Note the Redis connection URL, which should look like:
   ```
   redis://username:password@host:port
   ```

### Deploying to Vercel

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2. Create a new project in Vercel and connect it to your repository.
3. Configure the following environment variables:
   - `REDIS_URL`: Your Redis connection URL
   - `MEETING_BAAS_API_KEY`: Your API key for Meeting BaaS
   - `MEETING_BAAS_ENV`: The environment to use (prod, preprod, gmeetbot)
   - `REQUIRE_API_KEY`: Set to "true" to require API key authentication
   - `MCP_API_KEY`: API key for client authentication (if REQUIRE_API_KEY is true)

4. Deploy the project.

### Enabling Fluid Compute (Optional)

For longer running sessions, you can enable Fluid Compute in Vercel:

1. Go to your project settings in Vercel
2. Navigate to the "Functions" tab
3. Enable "Fluid Compute"
4. The `vercel.json` file already sets the maximum duration to 800 seconds.

## API Endpoints

- `/api/mcp` - Main MCP endpoint for client connections

## Testing

To test your MCP server, you can use the [MCP Inspector](https://inspector.modelcontextprotocol.ai/) or the provided test client:

```bash
node scripts/test-client.mjs
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection URL | None (required) |
| `MEETING_BAAS_API_KEY` | API key for Meeting BaaS | None (required) |
| `MEETING_BAAS_ENV` | Environment (prod, preprod, gmeetbot) | prod |
| `MCP_SERVER_NAME` | Name of the MCP server | Meeting BaaS MCP |
| `MCP_SERVER_VERSION` | Version of the MCP server | 1.0.0 |
| `REQUIRE_API_KEY` | Whether to require API key authentication | false |
| `MCP_API_KEY` | API key for client authentication | None |

## Documentation

- [Model Context Protocol](https://github.com/anthropics/anthropic-model-context-protocol)
- [Meeting BaaS API Documentation](https://api.meetingbaas.com/docs)
