/**
 * Type definitions for FastMCP Tools that properly handle session auth
 */

import { z } from "zod";
import type { Context, TextContent, ImageContent, ContentResult } from "fastmcp";
import type { SessionAuth } from "../api/client.js";

/**
 * Proper tool type definition that satisfies FastMCP's constraints
 * 
 * This creates a type-safe wrapper for tools that ensures they're compatible
 * with SessionAuth while still allowing them to use their own parameter schemas
 */
export interface MeetingBaaSTool<P extends z.ZodType> {
  name: string;
  description: string;
  parameters: P;
  execute: (
    args: z.infer<P>,
    context: Context<SessionAuth>
  ) => Promise<string | ContentResult | TextContent | ImageContent>;
}

/**
 * Helper function to create a properly typed tool that works with FastMCP and SessionAuth
 * 
 * @param name Tool name
 * @param description Tool description
 * @param parameters Zod schema for tool parameters
 * @param execute Function that executes the tool
 * @returns A properly typed tool compatible with FastMCP SessionAuth
 */
export function createTool<P extends z.ZodType>(
  name: string,
  description: string,
  parameters: P,
  execute: (
    args: z.infer<P>,
    context: Context<SessionAuth>
  ) => Promise<string | ContentResult | TextContent | ImageContent>
): MeetingBaaSTool<P> {
  return {
    name,
    description,
    parameters,
    execute
  };
} 