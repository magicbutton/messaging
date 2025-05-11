# Magic Button Messaging - Starter Prompts

This directory contains starter prompts and examples to help you get started with building applications using the Magic Button Messaging library.

## Contents

- `chat-application/`: Ready-to-use starter prompt with example code for building a chat application
  - `CLAUDE.md`: Comprehensive prompt with embedded example code for a chat application
- `CLAUDE.md`: Basic prompt template for bootstrapping a chat application
- `chat-contract-example.ts`: Example implementation of a complete chat contract
- `in-memory-transport-example.ts`: Example implementation of an in-memory transport adapter

## Using the Starter Prompts

### 1. Creating a New Chat Application

For a complete and comprehensive approach, use the prompt in `chat-application/CLAUDE.md` which includes:

- Detailed prompt template
- Complete example code for the chat contract
- Complete example code for the in-memory transport
- Development guidelines and workflow

Alternatively, you can use the basic prompt in the root `CLAUDE.md` to ask Claude to help you create a chat application from scratch. Both prompts will guide Claude to create:

- Contract definitions
- In-memory transport
- Server implementation
- Client implementation

### 2. Understanding the Contract Pattern

Review the `chat-contract-example.ts` file to understand how to structure your contracts with:

- Zod schemas for type safety
- Event definitions with access controls
- Request/response definitions with permissions
- Error definitions and role-based permissions

### 3. Implementing In-Memory Transport

The `in-memory-transport-example.ts` file shows a complete implementation of an in-memory transport adapter that:

- Works across multiple clients and servers
- Handles system events and requests
- Supports the full transport interface

## Integration with Magic Button Messaging

These examples are designed to work with version 1.0.10 of the Magic Button Messaging library. Make sure to install the correct version:

```bash
npm install @magicbutton.cloud/messaging@1.0.10
```

## Next Steps

After creating your initial application using these starter prompts:

1. Add proper error handling
2. Implement authentication and authorization
3. Add persistent storage for messages and user data
4. Create a UI for your chat application
5. Consider implementing a network transport for real-world usage