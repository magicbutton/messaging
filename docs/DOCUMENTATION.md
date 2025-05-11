# Documentation Guide

This document explains how to navigate and use the Magic Button Messaging documentation effectively.

## Documentation Structure

The documentation is organized as follows:

1. **API Reference**: Generated with TypeDoc from code comments
   - HTML Version: Located in `/docs/api/`
   - Markdown Version: Located in `/docs/markdown/`
   - Contains detailed documentation for all classes, interfaces, types, and functions
   - Browsable by module, class, or interface

2. **Examples**: Real-world usage examples
   - Located in `/examples/`
   - Each example demonstrates a specific feature or use case

## Using the API Reference

The API reference provides several ways to find the information you need:

- **Search**: Use the search box in the top-right corner to find specific items
- **Navigation**: Browse through modules, classes, interfaces, and functions
- **Hierarchies**: View the class hierarchy to understand relationships between classes

### Key Reference Pages

#### HTML Version
- [MessagingClient](./api/classes/MessagingClient.html) - Main client class for connecting to servers
- [MessagingServer](./api/classes/MessagingServer.html) - Server implementation for handling client requests
- [Transport Interface](./api/interfaces/ITransport.html) - Interface for implementing custom transports
- [Factory Interfaces](./api/modules.html) - Factory interfaces for all components

#### Markdown Version
- [Factory Interfaces](./markdown/interfaces.md) - Core interfaces for the factory pattern
- [Component Classes](./markdown/classes.md) - Implementation classes
- [Provider Registries](./markdown/modules.md) - Factory registries for dependency injection

## Examples

The examples directory contains several complete examples that demonstrate the factory pattern:

- [Transport DI Example](../examples/transport-di-example.ts) - Transport factory dependency injection
- [Configuration & Middleware Example](../examples/configuration-middleware-example.ts) - Using configuration and middleware factories

## Best Practices

When using Magic Button Messaging, consider these best practices:

1. **Use Factory Pattern**: Create components through factories for proper dependency injection
2. **Define Contracts First**: Start by defining your communication contracts with Zod schemas
3. **Use Type Safety**: Leverage TypeScript's type system and Zod's validation
4. **Choose the Right Transport**: Pick a transport that matches your needs (WebSockets, HTTP, etc.)
5. **Implement Access Control**: Secure your API with role-based access control
6. **Add Observability**: Use the built-in observability tools for monitoring
7. **Configure Through Registry**: Use the configuration system and registries for all components

## Troubleshooting

If you encounter issues:

1. Check the error messages - they often provide details about what went wrong
2. Ensure your contract is defined correctly with valid Zod schemas
3. Verify that your transport is configured properly
4. Check that clients and servers are connecting to the same endpoint

## Contributing to Documentation

We welcome contributions to our documentation! If you find issues or have improvements:

1. For code documentation, update the JSDoc comments in the source files
2. For markdown documentation, edit the files in the `/docs` directory
3. Submit a pull request with your changes