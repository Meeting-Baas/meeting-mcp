import { FastMCP } from 'fastmcp';
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from 'redis';

// Type for the server initializer function
export type ServerInitializer = (server: FastMCP) => void | Promise<void>;

/**
 * Initialize an MCP API handler for Vercel
 *
 * @param initializeServer Function to register tools, resources, and prompts
 * @param options Server configuration options
 * @returns Vercel API handler function
 */
export function initializeMcpApiHandler(
  initializeServer: ServerInitializer,
  options?: Partial<Record<string, unknown>>,
) {
  // Get the MCP version from env, or use a default
  const versionString = process.env.MCP_SERVER_VERSION || '1.0.0';

  // Ensure version is in the correct format (semver)
  const semverVersion = versionString.match(/^\d+\.\d+\.\d+$/) ? versionString : '1.0.0';

  // Check for redis URL
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  // Create Redis clients
  const redis = createClient({ url: redisUrl });
  const redisPublisher = createClient({ url: redisUrl });

  // Handle Redis errors
  redis.on('error', (err) => console.error('Redis error:', err));
  redisPublisher.on('error', (err) => console.error('Redis publisher error:', err));

  // Connect to Redis
  const redisPromise = Promise.all([redis.connect(), redisPublisher.connect()]);

  // Return the Next.js API handler
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      // Wait for Redis connection
      await redisPromise;

      // Create the server instance
      const server = new FastMCP({
        name: process.env.MCP_SERVER_NAME || 'Meeting BaaS MCP',
        version: semverVersion as `${number}.${number}.${number}`,
        ...options,
      });

      // Initialize the server with user's configuration
      await initializeServer(server);

      // TODO: Handle SSE connections
      if (req.method === 'GET') {
        // SSE logic
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Keep connection alive
        const keepAlive = setInterval(() => {
          res.write(':keepalive\n\n');
        }, 30000);

        // Clean up on close
        res.on('close', () => {
          clearInterval(keepAlive);
        });
      }
      // Handle API requests
      else if (req.method === 'POST') {
        // Process request using FastMCP
        // Handle the response
        res.status(200).json({ status: 'ok' });
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      console.error('Error handling request:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };
}
