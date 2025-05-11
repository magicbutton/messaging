import { v4 as uuidv4 } from 'uuid';
import { Transport, MessageContext } from '@magicbutton.cloud/messaging';

// Global registry for transports
declare global {
  var __transports: Map<string, any>;
}

/**
 * Create an in-memory transport for the chat application
 * This transport allows for local testing without network dependencies
 * 
 * @param label Unique identifier for this transport instance
 * @returns A Transport implementation 
 */
export function createInMemoryTransport(label = 'default'): Transport {
  // Initialize the global transport registry if needed
  if (typeof globalThis.__transports === 'undefined') {
    globalThis.__transports = new Map();
  }
  
  // Get the global transport registry
  const globalTransports = globalThis.__transports as Map<string, any>;
  
  // Track connection state
  let connected = false;
  let connectionString = '';
  
  // Event and request handlers
  const eventHandlers = new Map<string, Set<(payload: any, context: MessageContext) => void>>();
  const requestHandlers = new Map<string, (payload: any, context: MessageContext) => Promise<any>>();

  // Create a transport instance
  const transport = {
    /**
     * Connect to the transport
     */
    connect: async (connString: string) => {
      connectionString = connString;
      connected = true;
      
      // Register this transport instance in the global registry
      globalTransports.set(`${connString}:${label}`, transport);
      
      console.log(`[${label}] InMemoryTransport connected to ${connectionString}`);
    },

    /**
     * Disconnect from the transport
     */
    disconnect: async () => {
      connected = false;
      
      // Remove from global registry
      globalTransports.delete(`${connectionString}:${label}`);
      
      console.log(`[${label}] InMemoryTransport disconnected`);
    },

    /**
     * Get the connection string
     */
    getConnectionString: () => connectionString,

    /**
     * Check if connected
     */
    isConnected: () => connected,

    /**
     * Emit an event
     */
    emit: async (event: string, payload: any, context: MessageContext = {}) => {
      if (!connected) {
        throw new Error('Not connected');
      }

      // Clone the payload to prevent modification
      const payloadCopy = JSON.parse(JSON.stringify(payload));

      // Create a full context with defaults
      const fullContext = {
        id: context.id || uuidv4(),
        timestamp: context.timestamp || Date.now(),
        source: context.source || label,
        ...context,
      };

      // Handle local subscriptions
      const handlers = eventHandlers.get(event);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(payloadCopy, fullContext);
          } catch (error) {
            console.error(`[${label}] Error in event handler for ${event}:`, error);
          }
        }
      }

      // Deliver the event to other transports in the registry that are connected to the same endpoint
      globalTransports.forEach((otherTransport, key) => {
        if (
          key !== `${connectionString}:${label}` && 
          key.startsWith(`${connectionString}:`)
        ) {
          const otherHandlers = otherTransport.eventHandlers?.get(event);
          if (otherHandlers) {
            for (const handler of otherHandlers) {
              try {
                handler(payloadCopy, fullContext);
              } catch (error) {
                console.error(`[${label}] Error delivering event to another transport:`, error);
              }
            }
          }
        }
      });
    },

    /**
     * Register an event handler
     */
    on: (event: string, handler: (payload: any, context: MessageContext) => void) => {
      let handlers = eventHandlers.get(event);
      if (!handlers) {
        handlers = new Set();
        eventHandlers.set(event, handlers);
      }
      handlers.add(handler);
    },

    /**
     * Unregister an event handler
     */
    off: (event: string, handler: (payload: any, context: MessageContext) => void) => {
      const handlers = eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          eventHandlers.delete(event);
        }
      }
    },

    /**
     * Send a request
     */
    request: async (requestType: string, payload: any, context: MessageContext = {}) => {
      if (!connected) {
        throw new Error('Not connected');
      }

      // Clone the payload to prevent modification
      const payloadCopy = JSON.parse(JSON.stringify(payload));

      // Create a full context with defaults
      const fullContext = {
        id: context.id || uuidv4(),
        timestamp: context.timestamp || Date.now(),
        source: context.source || label,
        ...context,
      };

      // Check for system requests which need to be handled by the server
      if (requestType.startsWith('$')) {
        // For system requests, find the server transport
        const serverTransport = Array.from(globalTransports.entries())
          .find(([key, t]) => key.startsWith(`${connectionString}:`) && key.includes(':server'));
        
        if (serverTransport) {
          // Forward the request to the server's handler
          const serverHandler = serverTransport[1].requestHandlers?.get(requestType);
          if (serverHandler) {
            return serverHandler(payloadCopy, fullContext);
          }
        }
      }

      // Find a local handler
      const handler = requestHandlers.get(requestType);
      if (!handler) {
        // Check for handlers in other transports
        for (const [key, otherTransport] of globalTransports.entries()) {
          if (
            key !== `${connectionString}:${label}` &&
            key.startsWith(`${connectionString}:`)
          ) {
            const otherHandler = otherTransport.requestHandlers?.get(requestType);
            if (otherHandler) {
              return otherHandler(payloadCopy, fullContext);
            }
          }
        }
        
        throw new Error(`No handler registered for request type ${requestType}`);
      }

      // Handle the request locally
      return handler(payloadCopy, fullContext);
    },

    /**
     * Register a request handler
     */
    handleRequest: (requestType: string, handler: (payload: any, context: MessageContext) => Promise<any>) => {
      requestHandlers.set(requestType, handler);
    },

    /**
     * Login to the transport
     */
    login: async (credentials: { username: string; password: string } | { token: string }) => {
      if (!connected) {
        throw new Error('Not connected');
      }

      // This is just a pass-through since auth is handled by the AuthProvider
      return {
        success: true
      };
    },

    /**
     * Logout from the transport
     */
    logout: async () => {
      // This is just a pass-through since auth is handled by the AuthProvider
      console.log(`[${label}] Transport logout`);
    },
    
    // Expose internal state for system integration
    get eventHandlers() {
      return eventHandlers;
    },
    
    get requestHandlers() {
      return requestHandlers;
    }
  };
  
  return transport as Transport;
}