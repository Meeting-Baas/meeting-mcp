import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { NextApiRequest, NextApiResponse } from 'next';
import getRawBody from 'raw-body';
import { z } from 'zod';

// Simple Redis-based MCP handler for Next.js
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Configure CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return res.status(500).json({ error: 'Redis URL not configured' });
  }

  try {
    // Initialize MCP Server
    const mcpServer = new McpServer({
      name: process.env.MCP_SERVER_NAME || 'Meeting BaaS MCP Server (Vercel)',
      version: process.env.MCP_SERVER_VERSION || '1.0.0',
    });

    // Register a simple echo tool
    mcpServer.tool(
      'echo', // Tool name
      'Echoes back the provided message', // Description
      { message: z.string().describe('The message to echo back') }, // Parameters schema
      async ({ message }) => {
        // Callback function
        return {
          content: [
            {
              type: 'text',
              text: message,
            },
          ],
        };
      },
    );

    // For SSE connections
    if (req.method === 'GET') {
      // Set headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Create SSE transport
      const transport = new SSEServerTransport('/api/server', res);

      // Connect the server to the transport
      await mcpServer.connect(transport);

      // The SSE transport will keep the connection open and handle the response
    }
    // For message endpoints
    else if (req.method === 'POST') {
      // Get the raw request body
      const body = await getRawBody(req);
      const message = JSON.parse(body.toString());

      // For SSE message posting
      if (message.sessionId) {
        // This would be handled by the transport in a full implementation
        res.status(200).json({ ok: true });
      } else {
        // Generic POST handler
        res.status(200).json({ status: 'Message received' });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
