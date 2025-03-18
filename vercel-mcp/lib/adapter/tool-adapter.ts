import { z } from 'zod';
import { createValidSession } from '../../../src/utils/auth';
import type { MeetingBaaSTool } from '../../../src/utils/tool-types';

// Type for the handler extra parameter in the TypeScript SDK
type RequestHandlerExtra = {
  session?: any;
  log: {
    debug: (message: string, data?: any) => void;
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
  };
  reportProgress?: (progress: any) => Promise<void>;
};

/**
 * Adapts a MeetingBaaSTool to be compatible with TypeScript SDK
 *
 * This function converts our existing FastMCP tool implementation
 * to match the TypeScript SDK tool format.
 *
 * @param tool The original FastMCP tool to adapt
 * @returns An adapted function compatible with TypeScript SDK
 */
export function adaptTool<P extends z.ZodType>(tool: MeetingBaaSTool<P>) {
  return async (args: z.infer<P>, extra: RequestHandlerExtra) => {
    try {
      // Create a valid session, which may be undefined if no API key is found
      const session = createValidSession(extra.session, extra.log);

      // Create a compatible context object for our existing tools
      const adaptedContext = {
        session,
        log: extra.log,
        reportProgress: async (progress: any) => {
          if (extra.reportProgress) {
            return extra.reportProgress(progress);
          }
        },
      };

      // Execute the original tool with our adapted context
      const result = await tool.execute(args, adaptedContext);

      // Process the result to match the expected TypeScript SDK format
      if (typeof result === 'string') {
        // Convert string result to expected format
        return {
          content: [{ type: 'text', text: result }],
        };
      } else if (typeof result === 'object' && result !== null && 'content' in result) {
        // Result already has content array, make sure it's properly formatted
        const formattedContent = result.content.map((item: any) => {
          if (item.type === 'text') {
            return { type: 'text', text: item.text };
          } else if (item.type === 'image') {
            return {
              type: 'image',
              data: item.data,
              mimeType: item.mimeType || 'image/png',
            };
          } else {
            // Handle other content types if needed
            return item;
          }
        });

        return {
          content: formattedContent,
          isError: result.isError,
        };
      } else {
        // Handle other result formats if needed
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      }
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      extra.log.error(`Error executing tool: ${errorMessage}`);
      return {
        content: [{ type: 'text', text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  };
}

/**
 * Registers a FastMCP tool with the TypeScript SDK server
 *
 * @param server The TypeScript SDK server instance
 * @param tool The FastMCP tool to register
 */
export function registerTool<P extends z.ZodType>(server: any, tool: MeetingBaaSTool<P>): void {
  const adaptedHandler = adaptTool(tool);
  server.tool(tool.name, tool.parameters, adaptedHandler);
}
