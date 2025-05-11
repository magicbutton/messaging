# Chat Client App Starter Prompt

Use this prompt when asking Claude to help you build a chat client application using the @magicbutton.cloud/messaging library with an in-memory transport.

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