# Documentation Guide

This document explains how to navigate and use the Magic Button Messaging documentation effectively.

## Documentation Structure

The documentation is organized as follows:

1. **API Reference**: Generated with TypeDoc from code comments
   - Located in `/docs/api/`
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

- [Client](./api/classes/Client.html) - Main client class for connecting to servers
- [Server](./api/classes/Server.html) - Server implementation for handling client requests
- [TransportAdapter](./api/interfaces/TransportAdapter.html) - Interface for implementing custom transports
- [AccessControl](./api/classes/AccessControl.html) - Role-based access control system

## Examples

The examples directory contains several complete examples:

- [Error Handling](../examples/error-handling-example.ts) - How to handle errors
- [Middleware](../examples/middleware-example.ts) - Using middleware
- [Observability](../examples/observability-example.ts) - Logging, metrics, and tracing
- [Testing](../examples/testing-example.ts) - Testing your contracts
- [Versioning](../examples/versioning-example.ts) - Versioning your contracts

## Best Practices

When using Magic Button Messaging, consider these best practices:

1. **Define Contracts First**: Start by defining your communication contracts with Zod schemas
2. **Use Type Safety**: Leverage TypeScript's type system and Zod's validation
3. **Choose the Right Transport**: Pick a transport that matches your needs (WebSockets, HTTP, etc.)
4. **Implement Access Control**: Secure your API with role-based access control
5. **Add Observability**: Use the built-in observability tools for monitoring

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