# Chat Application Starter - Using Magic Button Messaging

Use this prompt when asking Claude to help you build a chat client application using the @magicbutton.cloud/messaging library with an in-memory transport.

## Prompt Template

```
I want to create a TypeScript chat application using @magicbutton.cloud/messaging v1.0.10. Please help me set up the following:

1. A chat contract that defines:
   - Message events (sending messages, typing indicators)
   - User presence events (online, offline)
   - Message requests (sending, deleting, editing messages)
   - User authentication
   - Role-based permissions (admin, moderator, user)

2. An in-memory transport implementation suitable for testing

3. A server implementation with:
   - User authentication handling
   - Message history storage
   - Request handlers for all operations
   - Event broadcasting

4. A basic client implementation that can:
   - Connect to the server
   - Authenticate users
   - Send/receive messages
   - Display typing indicators
   - Show user presence

Please structure the code in a modular way with:
- Separate files for contract, transport, server, and client
- Strong TypeScript typing
- Proper error handling
- Clean architecture following the messaging library patterns

The chat should support basic features like:
- Public and private channels
- Direct messages between users
- Message editing and deletion
- User presence indicators

I want to use this for local testing and development before implementing a real network transport.
```

## Example Files Structure

When implementing the chat application, follow this file structure:

```
chat-app/
├── src/
│   ├── contract/
│   │   └── chat-contract.ts       # Defines events, requests, and permissions
│   ├── transport/
│   │   └── in-memory-transport.ts # In-memory transport implementation
│   ├── server/
│   │   ├── chat-server.ts         # Main server implementation
│   │   ├── auth-provider.ts       # Authentication handling
│   │   ├── data-store.ts          # Message and user data storage
│   │   └── handlers/              # Request handlers
│   ├── client/
│   │   ├── chat-client.ts         # Client implementation
│   │   └── types.ts               # Client-specific types
│   └── types/
│       └── index.ts               # Shared type definitions
├── test/
│   └── chat.test.ts               # Tests for the chat application
├── package.json
└── tsconfig.json
```

## Installation

Set up your project with these dependencies:

```bash
mkdir chat-app
cd chat-app
npm init -y
npm install @magicbutton.cloud/messaging@1.0.10 zod uuid
npm install --save-dev typescript ts-node @types/node @types/uuid
```

Create a basic `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"]
}
```

## Example Code

### Chat Contract Example (src/contract/chat-contract.ts)

```typescript
import * as z from 'zod';
import { createContract, createEventMap, createRequestSchemaMap, createErrorMap } from '@magicbutton.cloud/messaging';

// Define user roles
export type RoleKey = 'admin' | 'moderator' | 'user' | 'guest';

// Message schema
const MessageSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  senderId: z.string(),
  content: z.string(),
  timestamp: z.number(),
  edited: z.boolean().optional(),
  editedTimestamp: z.number().optional(),
});

// User presence schema
const PresenceSchema = z.object({
  userId: z.string(),
  status: z.enum(['online', 'away', 'offline']),
  lastActivity: z.number(),
});

// Typing indicator schema
const TypingIndicatorSchema = z.object({
  userId: z.string(),
  channelId: z.string(),
  isTyping: z.boolean(),
  timestamp: z.number(),
});

// Channel schema
const ChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isPrivate: z.boolean(),
  createdBy: z.string(),
  createdAt: z.number(),
  members: z.array(z.string()),
});

// Define events
const events = createEventMap({
  // Message events
  'message.sent': {
    schema: MessageSchema,
    description: 'Sent when a new message is posted',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },
  'message.edited': {
    schema: MessageSchema,
    description: 'Sent when a message is edited',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },
  'message.deleted': {
    schema: z.object({
      id: z.string(),
      channelId: z.string(),
      timestamp: z.number(),
    }),
    description: 'Sent when a message is deleted',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },

  // Typing events
  'user.typing': {
    schema: TypingIndicatorSchema,
    description: 'Sent when a user starts or stops typing',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },

  // Presence events
  'user.presence': {
    schema: PresenceSchema,
    description: 'Sent when a user changes presence status',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },

  // Channel events
  'channel.created': {
    schema: ChannelSchema,
    description: 'Sent when a new channel is created',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },
  'channel.updated': {
    schema: ChannelSchema,
    description: 'Sent when a channel is updated',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },
  'channel.deleted': {
    schema: z.object({
      id: z.string(),
      timestamp: z.number(),
    }),
    description: 'Sent when a channel is deleted',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'channel.joined': {
    schema: z.object({
      userId: z.string(),
      channelId: z.string(),
      timestamp: z.number(),
    }),
    description: 'Sent when a user joins a channel',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },
  'channel.left': {
    schema: z.object({
      userId: z.string(),
      channelId: z.string(),
      timestamp: z.number(),
    }),
    description: 'Sent when a user leaves a channel',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  }
});

// Define requests
const requests = createRequestSchemaMap({
  // Authentication
  'auth.login': {
    requestSchema: z.object({
      username: z.string(),
      password: z.string(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      userId: z.string().optional(),
      username: z.string().optional(),
      roles: z.array(z.string()).optional(),
      error: z.string().optional(),
    }),
    description: 'Login to the chat system',
  },
  'auth.logout': {
    requestSchema: z.object({}),
    responseSchema: z.object({
      success: z.boolean(),
    }),
    description: 'Logout from the chat system',
  },

  // Channel operations
  'channel.create': {
    requestSchema: z.object({
      name: z.string(),
      description: z.string().optional(),
      isPrivate: z.boolean().default(false),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      channel: ChannelSchema.optional(),
      error: z.string().optional(),
    }),
    description: 'Create a new channel',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'channel.update': {
    requestSchema: z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      isPrivate: z.boolean().optional(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      channel: ChannelSchema.optional(),
      error: z.string().optional(),
    }),
    description: 'Update a channel',
    access: {
      allowedRoles: ['admin', 'moderator'] as RoleKey[]
    }
  },
  'channel.delete': {
    requestSchema: z.object({
      id: z.string(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
    description: 'Delete a channel',
    access: {
      allowedRoles: ['admin'] as RoleKey[]
    }
  },
  'channel.join': {
    requestSchema: z.object({
      channelId: z.string(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      channelId: z.string().optional(),
      error: z.string().optional(),
    }),
    description: 'Join a channel',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'channel.leave': {
    requestSchema: z.object({
      channelId: z.string(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
    description: 'Leave a channel',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'channel.list': {
    requestSchema: z.object({}),
    responseSchema: z.object({
      channels: z.array(ChannelSchema),
    }),
    description: 'Get list of channels',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },

  // Message operations
  'message.send': {
    requestSchema: z.object({
      channelId: z.string(),
      content: z.string(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      id: z.string().optional(),
      timestamp: z.number().optional(),
      error: z.string().optional(),
    }),
    description: 'Send a message to a channel',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'message.edit': {
    requestSchema: z.object({
      id: z.string(),
      channelId: z.string(),
      content: z.string(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      timestamp: z.number().optional(),
      error: z.string().optional(),
    }),
    description: 'Edit a message',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'message.delete': {
    requestSchema: z.object({
      id: z.string(),
      channelId: z.string(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
    description: 'Delete a message',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'message.history': {
    requestSchema: z.object({
      channelId: z.string(),
      limit: z.number().optional(),
      before: z.number().optional(),
    }),
    responseSchema: z.object({
      messages: z.array(MessageSchema),
      hasMore: z.boolean(),
    }),
    description: 'Get message history for a channel',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },

  // User operations
  'user.setPresence': {
    requestSchema: z.object({
      status: z.enum(['online', 'away', 'offline']),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
    description: 'Set user presence status',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'user.setTyping': {
    requestSchema: z.object({
      channelId: z.string(),
      isTyping: z.boolean(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
    description: 'Set typing indicator',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
});

// Define errors
const errors = createErrorMap({
  'chat.invalid_credentials': {
    code: 'chat.invalid_credentials',
    message: 'Invalid username or password',
    severity: 'error',
  },
  'chat.permission_denied': {
    code: 'chat.permission_denied',
    message: 'You do not have permission to perform this action',
    severity: 'error',
  },
  'chat.invalid_channel': {
    code: 'chat.invalid_channel',
    message: 'Channel not found',
    severity: 'error',
  },
  'chat.invalid_message': {
    code: 'chat.invalid_message',
    message: 'Message not found or invalid',
    severity: 'error',
  },
  'chat.not_member': {
    code: 'chat.not_member',
    message: 'You are not a member of this channel',
    severity: 'error',
  },
  'chat.already_member': {
    code: 'chat.already_member',
    message: 'You are already a member of this channel',
    severity: 'error',
  },
  'chat.message_not_found': {
    code: 'chat.message_not_found',
    message: 'Message not found',
    severity: 'error',
  },
  'chat.channel_exists': {
    code: 'chat.channel_exists',
    message: 'Channel with this name already exists',
    severity: 'error',
  },
});

// Define role permissions
const roles = {
  admin: {
    name: 'admin',
    description: 'Administrator with full access',
    inherits: ['moderator'],
  },
  moderator: {
    name: 'moderator',
    description: 'Moderator with elevated permissions',
    inherits: ['user'],
  },
  user: {
    name: 'user',
    description: 'Regular user',
    inherits: ['guest'],
  },
  guest: {
    name: 'guest',
    description: 'Guest with limited access',
    inherits: [],
  },
};

// Export the chat contract
export const chatContract = createContract({
  name: 'chat-contract',
  version: '1.0.0',
  events,
  requests,
  errors,
  roles,
});

// Export types for easy use elsewhere
export type ChatMessage = z.infer<typeof MessageSchema>;
export type TypingIndicator = z.infer<typeof TypingIndicatorSchema>;
export type UserPresence = z.infer<typeof PresenceSchema>;
export type Channel = z.infer<typeof ChannelSchema>;
```

### In-Memory Transport Example (src/transport/in-memory-transport.ts)

```typescript
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
```

## Development Workflow

1. Define your chat contract first with events, requests, and permissions
2. Implement the in-memory transport for local testing
3. Build the server implementation with proper authentication and data storage
4. Create the client implementation that connects to the server
5. Add a simple CLI or UI layer to interact with the chat

## Testing

You can use the built-in testing utilities from the messaging library:

```typescript
import { TestMessaging } from '@magicbutton.cloud/messaging';

// Create a test environment
const testEnv = new TestMessaging({
  serverOptions: {
    // Your server options
  },
  clientOptions: {
    // Your client options
  }
});

// Run your tests
// ...

// Clean up
await testEnv.cleanup();
```

## Key Concepts

When implementing your chat application, keep these messaging library concepts in mind:

1. **Contract-First Design**: Define all events, requests, and permissions in your contract
2. **Transport Abstraction**: The in-memory transport allows for testing without network dependencies
3. **Role-Based Access Control**: Define different permissions for admins, moderators, and users
4. **Message Context**: Use message context to pass authentication and metadata
5. **Middleware**: Add middleware for logging, validation, and authentication
6. **Error Handling**: Use the error registry for standardized error handling

## Next Steps

After implementing the basic chat application with in-memory transport, you can:

1. Add a real transport implementation (WebSocket, HTTP, etc.)
2. Implement persistence with a database
3. Create a proper UI for the chat
4. Add additional features like file sharing, reactions, etc.