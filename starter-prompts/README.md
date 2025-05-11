# Magic Button Messaging - Starter Prompts

This directory contains starter prompts and examples to help you get started with building applications using the Magic Button Messaging library.

## Contents

- `chat-application/`: Ready-to-use starter prompt with example code for building a chat application
  - `CLAUDE.md`: Comprehensive prompt with embedded example code for a chat application
- `react-chat-app/`: Starter prompt for building a modern React-based chat application
  - `CLAUDE.md`: Comprehensive prompt with React components, hooks, and context implementation

## Using the Starter Prompts

### 1. Creating a Basic Chat Application

For a complete and comprehensive approach, use the prompt in `chat-application/CLAUDE.md` which includes:

- Detailed prompt template
- Complete example code for the chat contract
- Complete example code for the in-memory transport
- Development guidelines and workflow

### 2. Creating a React Chat Application

Use the prompt in `react-chat-app/CLAUDE.md` to build a modern React chat application with:

- React (latest version) with TypeScript
- Context API for state management
- Custom hooks for messaging functionality
- Complete UI components
- Real-time messaging with typing indicators and presence

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