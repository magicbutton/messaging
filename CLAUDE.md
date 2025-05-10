# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
pnpm install

# Build the library
pnpm run build

# Watch mode for development
pnpm run dev

# Lint code
pnpm run lint

# Type check without emitting files
pnpm run typecheck

# Clean build artifacts
pnpm run clean
```

## Project Architecture

Magic Button Messaging is a type-safe, domain-driven design framework for distributed systems communication. It provides a robust foundation for building scalable, maintainable, and secure communication between distributed system components.

### Core Concepts

1. **Contract-First Design**: The library uses a contract-first approach with Zod schemas for type safety. Contracts define events, requests/responses, and error codes.

2. **Transport Abstraction**: The `TransportAdapter` interface abstracts the underlying communication protocol. An `InMemoryTransport` is included for testing, but custom transports can be implemented.

3. **Client/Server Architecture**: The library provides `Client` and `Server` classes that use transport adapters for communication.

4. **Access Control**: There's a built-in role-based access control system for securing communications.

5. **Message Context**: Context information (auth, tracing, etc.) can be passed through the communication chain.

6. **Middleware**: Extensible middleware system for logging, authentication, validation, etc.

7. **Error Handling**: Standardized error handling with retry capabilities.

8. **Observability**: Tools for logging, metrics, and tracing.

### Key Components

- **Contracts**: Define the shape of communication (events, requests, errors) using Zod schemas
- **Client**: Used to connect to servers, send requests, and subscribe to events
- **Server**: Handles requests and broadcasts events to clients
- **TransportAdapter**: Interface for implementing different communication protocols
- **AccessControl**: Role-based permission system
- **MiddlewareManager**: Pipeline for processing messages
- **ErrorRegistry**: Centralized error definition and handling
- **ObservabilityProvider**: Interface for logging, metrics, and tracing

### Important Files

- `client.ts`: Client implementation for connecting to servers
- `server.ts`: Server implementation for handling requests and managing clients
- `transport-adapter.ts`: Interface for transport implementations
- `in-memory-transport.ts`: In-memory transport implementation for testing
- `access-control.ts`: Role-based access control system
- `types.ts`: Core type definitions
- `system-contract.ts`: System-level events and requests
- `utils.ts`: Utility functions for creating contracts, events, etc.
- `middleware.ts`: Middleware system for request/response pipeline
- `observability.ts`: Tools for logging, metrics, and tracing
- `errors.ts`: Error handling utilities and error registry
- `testing.ts`: Testing utilities including MockTransport and TestMessaging

## Example Usage Patterns

### Creating a Contract

```typescript
import { z } from 'zod';
import { createContract, createEventMap, createRequestSchemaMap } from '@magicbutton.cloud/messaging';

const eventSchemas = createEventMap({
  userCreated: z.object({
    userId: z.string(),
    username: z.string()
  })
});

const requestSchemas = createRequestSchemaMap({
  getUserProfile: {
    requestSchema: z.object({ userId: z.string() }),
    responseSchema: z.object({
      userId: z.string(),
      username: z.string(),
      email: z.string()
    })
  }
});

export const userContract = createContract({
  events: eventSchemas,
  requests: requestSchemas
});
```

### Client Implementation

```typescript
import { Client, createTransportAdapter } from '@magicbutton.cloud/messaging';
import { WebSocketTransport } from '@magicbutton.cloud/messaging-websocket';

// Create client
const transport = createTransportAdapter(new WebSocketTransport());
const client = new Client(transport, {
  clientId: 'frontend-client',
  clientType: 'webapp'
});

// Connect to server
await client.connect('ws://api.example.com/messaging');

// Send request
const response = await client.request('getUserProfile', { userId: '123' });

// Subscribe to events
client.on('userCreated', (payload, context) => {
  console.log('New user created:', payload);
});

// Emit event
await client.emit('userAction', { action: 'clicked', elementId: 'submit-button' });
```

### Server Implementation

```typescript
import { Server, createTransportAdapter } from '@magicbutton.cloud/messaging';
import { WebSocketTransport } from '@magicbutton.cloud/messaging-websocket';

// Create server
const transport = createTransportAdapter(new WebSocketTransport());
const server = new Server(transport, {
  serverId: 'user-service',
  version: '1.0.0'
});

// Register request handlers
server.handleRequest('getUserProfile', async (payload, context, clientId) => {
  const user = await database.findUser(payload.userId);
  return {
    userId: user.id,
    username: user.username,
    email: user.email
  };
});

// Start server
await server.start('ws://0.0.0.0:3000/messaging');

// Broadcast event to all clients
await server.broadcast('systemNotification', {
  message: 'Server maintenance scheduled'
});
```

## Best Practices

1. Start by defining contracts with Zod schemas
2. Implement or use an existing transport adapter
3. Create server and client instances with appropriate configurations
4. Register request handlers on the server
5. Connect clients and send requests or subscribe to events
6. Use middleware for cross-cutting concerns
7. Implement proper error handling
8. Set up observability for monitoring

## Implementation Notes

- The library uses TypeScript generics extensively for type safety
- Custom errors should follow the error pattern established in the contracts
- Authentication and authorization are handled separately but integrated
- Always properly handle connection lifecycles (connect/disconnect)
- Heartbeats are used to maintain connection status
- Use MockTransport and TestMessaging for unit testing
- Check USAGE.md for more detailed examples and patterns

## Troubleshooting Tips

1. **Connection Issues**:
   - Check if the server is running and the connection string is correct
   - Verify network connectivity and firewall settings
   - Look for transport-specific errors in logs

2. **Schema Validation Errors**:
   - Ensure payload matches schema definition
   - Check for typos in field names
   - Verify value types match schema types

3. **Authentication Problems**:
   - Check token expiration
   - Verify client has necessary permissions
   - Confirm auth middleware is properly configured

4. **Performance Optimization**:
   - Use appropriate transport for your use case
   - Implement caching for frequently accessed data
   - Consider message batching for high-volume scenarios