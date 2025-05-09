# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Watch mode for development
npm run dev

# Lint code
npm run lint

# Type check without emitting files
npm run typecheck

# Clean build artifacts
npm run clean
```

## Project Architecture

Magic Button Messaging is a type-safe, domain-driven design framework for distributed systems communication. It provides a robust foundation for building scalable, maintainable, and secure communication between distributed system components.

### Core Concepts

1. **Contract-First Design**: The library uses a contract-first approach with Zod schemas for type safety. Contracts define events, requests/responses, and error codes.

2. **Transport Abstraction**: The `TransportAdapter` interface abstracts the underlying communication protocol. An `InMemoryTransport` is included for testing, but custom transports can be implemented.

3. **Client/Server Architecture**: The library provides `Client` and `Server` classes that use transport adapters for communication.

4. **Access Control**: There's a built-in role-based access control system for securing communications.

5. **Message Context**: Context information (auth, tracing, etc.) can be passed through the communication chain.

### Key Components

- **Contracts**: Define the shape of communication (events, requests, errors) using Zod schemas
- **Client**: Used to connect to servers, send requests, and subscribe to events
- **Server**: Handles requests and broadcasts events to clients
- **TransportAdapter**: Interface for implementing different communication protocols
- **AccessControl**: Role-based permission system

### Important Files

- `client.ts`: Client implementation for connecting to servers
- `server.ts`: Server implementation for handling requests and managing clients
- `transport-adapter.ts`: Interface for transport implementations
- `in-memory-transport.ts`: In-memory transport implementation for testing
- `access-control.ts`: Role-based access control system
- `types.ts`: Core type definitions
- `system-contract.ts`: System-level events and requests
- `utils.ts`: Utility functions for creating contracts, events, etc.

## Best Practices

1. Start by defining contracts with Zod schemas
2. Implement or use an existing transport adapter
3. Create server and client instances with appropriate configurations
4. Register request handlers on the server
5. Connect clients and send requests or subscribe to events

## Implementation Notes

- The library uses TypeScript generics extensively for type safety
- Custom errors should follow the error pattern established in the contracts
- Authentication and authorization are handled separately but integrated
- Always properly handle connection lifecycles (connect/disconnect)
- Heartbeats are used to maintain connection status