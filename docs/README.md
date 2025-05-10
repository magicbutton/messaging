# Magic Button Messaging Documentation

Welcome to the Magic Button Messaging documentation. This library provides a type-safe, domain-driven design framework for distributed systems communication.

## Contents

This documentation is organized in two main sections:

1. **[API Reference](./api/index.html)** - Generated using TypeDoc, providing detailed documentation for all classes, interfaces, types, and functions in the library.

2. **Guides** - Coming soon: practical guides and examples for using the library effectively.

## Getting Started

To get started with Magic Button Messaging, follow these steps:

1. Install the library:
   ```bash
   npm install @magicbutton.cloud/messaging
   ```

2. Define your contract using Zod schemas:
   ```typescript
   import * as z from "zod";
   import { createContract, createEventMap, createRequestSchemaMap } from "@magicbutton.cloud/messaging";

   // Define events and requests
   const events = createEventMap({
     userCreated: z.object({ id: z.string() })
   });

   const requests = createRequestSchemaMap({
     getUser: {
       requestSchema: z.object({ id: z.string() }),
       responseSchema: z.object({ id: z.string(), name: z.string() })
     }
   });

   // Create the contract
   const contract = createContract({ events, requests });
   ```

3. Implement your server and client:
   ```typescript
   // Server
   const server = new Server(transport);
   await server.start("memory://my-service");
   
   // Client
   const client = new Client(transport);
   await client.connect("memory://my-service");
   ```

## Key Concepts

- **Contract-First Design**: Define your communication contracts with Zod schemas
- **Transport Abstraction**: Use built-in transports or create your own
- **Client/Server Architecture**: Dedicated classes for easy implementation
- **Access Control**: Built-in role-based access control
- **Middleware**: Pipeline for request/response processing

## Examples

See the [examples](../examples) directory for complete examples of various use cases.

## Contributing

Contributions are welcome! Please see our contributing guidelines for more information.