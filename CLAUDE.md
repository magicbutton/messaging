# Magic Button Messaging - Claude Prompts

This document provides useful prompts for using Claude with the Magic Button Messaging library. These prompts are designed to help Claude understand how to generate code for common patterns and use cases.

## Library Overview

Magic Button Messaging (version 1.1.1) is a TypeScript framework that provides abstractions for client-server communication systems. The library's core value is in defining clear interfaces and factory patterns while containing shared messaging logic so you don't have to implement it yourself.

Key features:
- **Abstraction Layer**: Interfaces for client, server, transport, and authentication implementations
- **Factory Pattern**: Standardized factory interfaces that enable dependency injection and flexible component creation
- **Shared Logic**: Contains the core messaging framework logic while allowing for custom implementations
- **Type Safety**: Strong TypeScript typing with Zod schema validation
- **Transport Agnostic**: Works with any transport protocol (HTTP, WebSockets, NATS, etc.) through the transport interface

The library doesn't lock you into specific implementations - you can create your own client, server, transport, or auth provider while leveraging the shared messaging architecture.

## Contract Generation

Use this prompt when you need Claude to generate a contract for your domain:

```
I need to create a contract for @magicbutton.cloud/messaging. Please help me generate a contract for a {DOMAIN} system with the following requirements:

## Domain Context
{Provide context about your domain, entities, and operations}

## Events
{List the events that should be defined in the contract, with their purpose}

## Requests/Responses
{List the request/response pairs that should be defined, with their purpose}

## Error Scenarios
{List potential error scenarios that should be defined in the contract}

Please generate the complete TypeScript code for this contract using the @magicbutton.cloud/messaging library's createContract, createEventMap, and createRequestSchemaMap functions, along with Zod schemas.

Reference the USAGE.md file included with the package for examples of well-structured contracts.
```



## Testing Implementation

Use this prompt when you need Claude to generate test code:

```
Please help me write tests for the following @magicbutton.cloud/messaging implementation:

```typescript
// Paste your code here (client, server, or both)
```

The tests should cover:
1. Request/response functionality
2. Event handling
3. Error scenarios
4. Authentication/authorization if applicable

Please generate complete TypeScript test code using the @magicbutton.cloud/messaging testing utilities (TestMessaging, MockTransport).

Reference the USAGE.md file included with the package for examples of well-structured test implementations.
```

## Tips for Working with Claude

1. **Be Specific**: Provide clear, detailed instructions about what you want Claude to generate
2. **Include Context**: Share relevant domain knowledge to help Claude understand your use case
3. **Provide Examples**: When possible, show examples of similar code you want Claude to emulate
4. **Start Simple**: Begin with basic requirements and then add complexity iteratively
5. **Review Generated Code**: Always review and test Claude's code before using in production

## Common Patterns

When working with Claude, consider these common patterns for the Messaging library:

1. **Contract-First Development**: Always start by defining your contract
2. **Transport Abstraction**: Use the appropriate transport for your use case
3. **Middleware Pipeline**: Utilize middleware for cross-cutting concerns
4. **Error Registry**: Define errors centrally for consistent handling
5. **Testing Strategy**: Use MockTransport for unit tests and integration tests
6. **Factory Pattern Implementation**: Create custom factories for components that need dependency injection
7. **Custom Provider Implementation**: Extend the base interfaces to create customized providers

## Custom Implementations

One of the key strengths of the Magic Button Messaging library is its extensibility. You can implement:

1. **Custom Transports**: Create transport implementations for specific protocols (HTTP, WebSockets, NATS, etc.)
2. **Custom Auth Providers**: Implement your own authentication logic while using the library's auth interfaces
3. **Custom Transport Factories**: Create factories that produce configured transport instances
4. **Custom Authorization Providers**: Implement role-based or other access control mechanisms

The library provides the architecture and shared logic while giving you the flexibility to implement components that fit your specific requirements.