/**
 * Logging utilities for the MCP server
 */

// Store the original console methods
const originalConsoleError = console.error;

// Define our ping filter
function isPingMessage(message: string): boolean {
  // Skip ping/pong messages to reduce log noise
  return (
    (typeof message === 'string') && (
      message.includes('"method":"ping"') ||
      (message.includes('"result":{}') && message.includes('"jsonrpc":"2.0"') && message.includes('"id":'))
    )
  );
}

/**
 * Patches the console to filter out ping messages
 */
export function setupPingFiltering(): void {
  // Replace console.error with our filtered version
  console.error = function(...args: any[]) {
    // Check if this is a ping message we want to filter
    const firstArg = args[0];
    
    if (typeof firstArg === 'string' && 
        (firstArg.includes('[meetingbaas]') || firstArg.includes('[MCP Server]'))) {
      // This is a log message from our server
      const messageContent = args.join(' ');
      
      // Skip ping messages to reduce log size
      if (isPingMessage(messageContent)) {
        return; // Don't log ping messages
      }
    }
    
    // For all other messages, pass through to the original
    originalConsoleError.apply(console, args);
  };
}

/**
 * Create standard server logger
 */
export function createServerLogger(prefix: string): (message: string) => void {
  return (message: string) => {
    console.error(`[${prefix}] ${message}`);
  };
} 