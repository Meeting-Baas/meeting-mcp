import { createValidSession } from '../../../src/utils/auth';

/**
 * Adapts a resource template's load function to be compatible with TypeScript SDK
 *
 * @param loadFn The original resource load function
 * @returns An adapter function for use with TypeScript SDK
 */
export function adaptResourceLoad(loadFn: any): (args: any, context?: any) => Promise<any> {
  return async (args: any, context?: any) => {
    try {
      // Handle potential session auth
      const session = context?.session
        ? createValidSession(context.session, {
            error: context.log?.error || console.error,
            warn: context.log?.warn || console.warn,
            info: context.log?.info || console.info,
            debug: context.log?.debug || console.debug,
          })
        : undefined;

      // Create an adapted context with session
      const adaptedContext = context
        ? {
            ...context,
            session,
          }
        : { session };

      // Call the original resource load function with adapted arguments
      const result = await loadFn(args, adaptedContext);

      // Adapt the result to match the TypeScript SDK format
      if (Array.isArray(result)) {
        // Handle an array of resource contents
        return {
          contents: result.map((item) => ({
            uri: item.uri || args.uri || '',
            text: item.text,
            mimeType: item.mimeType || 'text/plain',
          })),
        };
      } else if (result.text) {
        // Handle single text resource
        return {
          contents: [
            {
              uri: result.uri || args.uri || '',
              text: result.text,
              mimeType: result.mimeType || 'text/plain',
            },
          ],
        };
      } else if (result.blob) {
        // Handle binary resource
        return {
          contents: [
            {
              uri: result.uri || args.uri || '',
              blob: result.blob,
              mimeType: result.mimeType || 'application/octet-stream',
            },
          ],
        };
      } else if (result.contents) {
        // Result is already in the expected format
        return result;
      } else {
        // Default handling
        return {
          contents: [
            {
              uri: args.uri || '',
              text: JSON.stringify(result),
              mimeType: 'application/json',
            },
          ],
        };
      }
    } catch (error) {
      console.error('Error in resource load:', error);
      throw error;
    }
  };
}

/**
 * Registers a resource template with the TypeScript SDK server
 *
 * @param server The TypeScript SDK server instance
 * @param resourceTemplate The resource template to register
 */
export function registerResourceTemplate(server: any, resourceTemplate: any): void {
  const adaptedLoadFn = adaptResourceLoad(resourceTemplate.load);

  server.resource(
    resourceTemplate.name,
    {
      pattern: resourceTemplate.uriTemplate,
      list: resourceTemplate.list || undefined,
    },
    adaptedLoadFn,
  );
}
