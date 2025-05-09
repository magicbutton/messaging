# Magic Button Messaging

A type-safe, domain-driven design framework for distributed systems communication. Magic Button Messaging provides a robust foundation for building scalable, maintainable, and secure communication between distributed system components.

![Magic Button Messaging](https://via.placeholder.com/800x400?text=Magic+Button+Messaging)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Contracts](#contracts)
  - [Transport Adapters](#transport-adapters)
  - [Client and Server](#client-and-server)
  - [Access Control](#access-control)
  - [Message Context](#message-context)
- [API Reference](#api-reference)
- [Examples](#examples)
  - [Basic Usage](#basic-usage)
  - [Custom Transport](#custom-transport)
  - [Access Control](#access-control-example)
  - [Error Handling](#error-handling)
  - [React Integration](#react-integration)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Contract-First Design**: Define your communication contracts with Zod schemas for complete type safety
- **Pluggable Transport Layer**: Use built-in transports or create your own (HTTP, WebSockets, MQTT, etc.)
- **Middleware Pipeline**: Insert middleware for logging, authentication, validation, and more
- **Access Control**: Built-in role-based access control for secure communication
- **Type Safety**: Full TypeScript support with inferred types from your Zod schemas
- **Client/Server Architecture**: Dedicated client and server classes for easy implementation
- **Event-Driven Communication**: Support for both request/response and event-based communication patterns
- **Context Propagation**: Pass context information (auth, tracing, etc.) through your communication chain

## Installation

```bash
# Using npm
npm install @magicbutton.cloud/messaging

# Using yarn
yarn add @magicbutton.cloud/messaging

# Using pnpm
pnpm add @magicbutton.cloud/messaging
```

## Quick Start

### Define Your Contract

```typescript
import * as z from "zod"
import { createContract, createEventMap, createRequestSchemaMap } from "@magicbutton.cloud/messaging"

// Define event schemas
const events = createEventMap({
  userCreated: z.object({
    id: z.string(),
    email: z.string().email(),
    createdAt: z.number(),
  }),
  userUpdated: z.object({
    id: z.string(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    updatedAt: z.number(),
  }),
})

// Define request/response schemas
const requests = createRequestSchemaMap({
  getUserById: {
    requestSchema: z.object({
      id: z.string(),
    }),
    responseSchema: z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string().nullable(),
      createdAt: z.number(),
    }),
  },
  createUser: {
    requestSchema: z.object({
      email: z.string().email(),
      name: z.string().optional(),
    }),
    responseSchema: z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string().nullable(),
      createdAt: z.number(),
    }),
  },
})

// Define error codes
const errors = {
  USER_NOT_FOUND: { code: "USER_NOT_FOUND", message: "User not found", status: 404 },
  INVALID_EMAIL: { code: "INVALID_EMAIL", message: "Invalid email format", status: 400 },
}

// Create the contract
const userServiceContract = createContract({
  events,
  requests,
  errors,
})

export type UserServiceContract = typeof userServiceContract
```

### Server Implementation

```typescript
import { Server, InMemoryTransport } from "@magicbutton.cloud/messaging"
import { userServiceContract } from "./contract"

// Create a server with the in-memory transport
const transport = new InMemoryTransport()
const server = new Server(transport)

// Start the server
await server.start("memory://user-service")

// Handle the getUserById request
server.handleRequest("getUserById", async (payload, context, clientId) => {
  const { id } = payload
  
  // Simulate database lookup
  const user = users.find(u => u.id === id)
  
  if (!user) {
    throw new Error("USER_NOT_FOUND")
  }
  
  return user
})

// Handle the createUser request
server.handleRequest("createUser", async (payload, context, clientId) => {
  const { email, name } = payload
  
  // Create a new user
  const user = {
    id: crypto.randomUUID(),
    email,
    name: name || null,
    createdAt: Date.now(),
  }
  
  // Save the user
  users.push(user)
  
  // Emit userCreated event
  await server.broadcast("userCreated", user)
  
  return user
})

console.log("User service running on memory://user-service")
```

### Client Implementation

```typescript
import { Client, InMemoryTransport } from "@magicbutton.cloud/messaging"
import { userServiceContract } from "./contract"

// Create a client with the in-memory transport
const transport = new InMemoryTransport()
const client = new Client(transport, {
  clientId: "admin-client",
  clientType: "admin",
})

// Connect to the server
await client.connect("memory://user-service")

// Subscribe to events
client.on("userCreated", (payload) => {
  console.log("New user created:", payload)
})

// Send a request to create a user
const newUser = await client.request("createUser", {
  email: "john@example.com",
  name: "John Doe",
})
console.log("Created user:", newUser)

// Send a request to get a user
try {
  const user = await client.request("getUserById", { id: newUser.id })
  console.log("Retrieved user:", user)
} catch (error) {
  console.error("Error retrieving user:", error)
}
```

## Core Concepts

### Contracts

Contracts define the shape of your communication. They consist of:

- **Events**: One-way messages published by services
- **Requests**: Request/response pairs for service-to-service communication
- **Errors**: Standardized error codes and messages

```typescript
import * as z from "zod"
import { createContract, createEventMap, createRequestSchemaMap, createErrorMap } from "@magicbutton.cloud/messaging"

// Define events
const events = createEventMap({
  orderCreated: z.object({
    orderId: z.string(),
    customerId: z.string(),
    amount: z.number(),
    timestamp: z.number(),
  }),
})

// Define requests
const requests = createRequestSchemaMap({
  getOrderDetails: {
    requestSchema: z.object({
      orderId: z.string(),
    }),
    responseSchema: z.object({
      orderId: z.string(),
      customerId: z.string(),
      items: z.array(z.object({
        productId: z.string(),
        quantity: z.number(),
        price: z.number(),
      })),
      total: z.number(),
      status: z.enum(["pending", "processing", "shipped", "delivered"]),
      createdAt: z.number(),
    }),
  }),
})

// Define errors
const errors = createErrorMap({
  ORDER_NOT_FOUND: { code: "ORDER_NOT_FOUND", message: "Order not found", status: 404 },
  INVALID_ORDER_ID: { code: "INVALID_ORDER_ID", message: "Invalid order ID format", status: 400 },
})

// Create the contract
const orderServiceContract = createContract({
  events,
  requests,
  errors,
})

export type OrderServiceContract = typeof orderServiceContract
```

### Transport Adapters

Transport adapters abstract the underlying communication protocol. Magic Button Messaging comes with an `InMemoryTransport` for testing, but you can implement your own adapters for HTTP, WebSockets, MQTT, etc.

```typescript
import { TransportAdapter, MessageContext, AuthResult } from "@magicbutton.cloud/messaging"

// Example of a custom WebSocket transport adapter
export class WebSocketTransport implements TransportAdapter {
  private socket: WebSocket | null = null
  private eventHandlers = new Map()
  private requestHandlers = new Map()
  private connectionString = ""
  
  async connect(connectionString: string): Promise<void> {
    this.connectionString = connectionString
    this.socket = new WebSocket(connectionString)
    
    return new Promise((resolve, reject) => {
      this.socket!.onopen = () => resolve()
      this.socket!.onerror = (error) => reject(error)
      
      this.socket!.onmessage = (event) => {
        const message = JSON.parse(event.data)
        
        if (message.type === "event") {
          const handlers = this.eventHandlers.get(message.event)
          if (handlers) {
            handlers.forEach(handler => handler(message.payload, message.context))
          }
        } else if (message.type === "response") {
          // Handle responses to requests
          // ...
        }
      }
    })
  }
  
  // Implement other methods...
}
```

### Client and Server

The `Client` and `Server` classes provide high-level abstractions for communication:

```typescript
// Server example
const server = new Server(transport, {
  serverId: "order-service",
  version: "1.0.0",
})

await server.start("ws://localhost:8080")

server.handleRequest("getOrderDetails", async (payload, context, clientId) => {
  const { orderId } = payload
  return orderRepository.findById(orderId)
})

// Client example
const client = new Client(transport, {
  clientId: "web-client",
  autoReconnect: true,
})

await client.connect("ws://localhost:8080")

const orderDetails = await client.request("getOrderDetails", { orderId: "order-123" })
```

### Access Control

Magic Button Messaging includes a role-based access control system:

```typescript
import { createSystem, createRole, createAccessControl, createActor } from "@magicbutton.cloud/messaging"

// Define a system with resources, actions, and roles
const orderSystem = createSystem({
  name: "order-system",
  resources: ["order", "payment", "shipment"],
  actions: ["create", "read", "update", "delete"],
  roles: [
    createRole({
      name: "admin",
      permissions: ["order:*", "payment:*", "shipment:*"],
    }),
    createRole({
      name: "customer",
      permissions: ["order:read", "order:create"],
    }),
    createRole({
      name: "shipping-agent",
      permissions: ["order:read", "shipment:update"],
    }),
  ],
})

// Create an access control instance
const accessControl = createAccessControl(orderSystem)

// Create an actor
const user = createActor({
  id: "user-123",
  type: "user",
  roles: ["customer"],
})

// Check permissions
if (accessControl.hasPermission(user, "order:create")) {
  // User can create orders
}
```

### Message Context

Message context allows you to pass metadata with your messages:

```typescript
import { createMessageContext } from "@magicbutton.cloud/messaging"

// Create a message context
const context = createMessageContext({
  source: "web-client",
  target: "order-service",
  auth: {
    token: "jwt-token",
    actor: {
      id: "user-123",
      type: "user",
      roles: ["customer"],
    },
  },
  metadata: {
    requestId: "req-123",
    sessionId: "session-456",
  },
  traceId: "trace-789",
})

// Use the context in a request
const orderDetails = await client.request("getOrderDetails", { orderId: "order-123" }, context)
```

## API Reference

### Core Functions

- `createContract(options)`: Create a contract with events, requests, and errors
- `createEventMap(schemas)`: Create an event schema map
- `createRequestSchemaMap(schemas)`: Create a request schema map
- `createErrorMap(errors)`: Create an error map
- `createMessageContext(context)`: Create a message context
- `createTransportAdapter(transport)`: Create a transport adapter

### Access Control

- `createSystem(system)`: Create a system definition
- `createRole(role)`: Create a role definition
- `createActor(actor)`: Create an actor
- `createAccessControl(system)`: Create an access control instance

### Classes

- `Client`: Client for sending requests and subscribing to events
- `Server`: Server for handling requests and publishing events
- `InMemoryTransport`: In-memory transport adapter for testing

## Examples

### Basic Usage

```typescript
import * as z from "zod"
import { 
  createContract, 
  createEventMap, 
  createRequestSchemaMap, 
  InMemoryTransport, 
  Client, 
  Server 
} from "@magicbutton.cloud/messaging"

// Define contract
const contract = createContract({
  events: createEventMap({
    greeting: z.object({ message: z.string() }),
  }),
  requests: createRequestSchemaMap({
    sayHello: {
      requestSchema: z.object({ name: z.string() }),
      responseSchema: z.object({ greeting: z.string() }),
    },
  }),
})

// Set up server
const serverTransport = new InMemoryTransport()
const server = new Server(serverTransport)
await server.start("memory://hello-service")

server.handleRequest("sayHello", async (payload) => {
  return { greeting: `Hello, ${payload.name}!` }
})

// Set up client
const clientTransport = new InMemoryTransport()
const client = new Client(clientTransport)
await client.connect("memory://hello-service")

// Send request
const response = await client.request("sayHello", { name: "World" })
console.log(response.greeting) // "Hello, World!"
```

### Custom Transport

```typescript
import { TransportAdapter, MessageContext } from "@magicbutton.cloud/messaging"

class HttpTransport implements TransportAdapter {
  private baseUrl: string = ""
  private connected: boolean = false
  private eventHandlers = new Map()
  private requestHandlers = new Map()
  private eventSource: EventSource | null = null
  
  async connect(connectionString: string): Promise<void> {
    this.baseUrl = connectionString
    this.connected = true
    
    // Set up SSE for events
    this.eventSource = new EventSource(`${this.baseUrl}/events`)
    this.eventSource.onmessage = (event) => {
      const { type, payload, context } = JSON.parse(event.data)
      const handlers = this.eventHandlers.get(type)
      if (handlers) {
        handlers.forEach(handler => handler(payload, context))
      }
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close()
    }
    this.connected = false
  }
  
  getConnectionString(): string {
    return this.baseUrl
  }
  
  isConnected(): boolean {
    return this.connected
  }
  
  async emit(event: string, payload: any, context?: MessageContext): Promise<void> {
    await fetch(`${this.baseUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: event, payload, context }),
    })
  }
  
  on(event: string, handler: (payload: any, context: MessageContext) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event).add(handler)
  }
  
  off(event: string, handler: (payload: any, context: MessageContext) => void): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }
  
  async request(requestType: string, payload: any, context?: MessageContext): Promise<any> {
    const response = await fetch(`${this.baseUrl}/requests/${requestType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, context }),
    })
    
    return response.json()
  }
  
  handleRequest(requestType: string, handler: (payload: any, context: MessageContext) => Promise<any>): void {
    this.requestHandlers.set(requestType, handler)
  }
  
  async login(credentials: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    
    return response.json()
  }
  
  async logout(): Promise<void> {
    await fetch(`${this.baseUrl}/auth/logout`, { method: 'POST' })
  }
}
```

### Access Control Example

```typescript
import { 
  createSystem, 
  createRole, 
  createAccessControl, 
  createActor 
} from "@magicbutton.cloud/messaging"

// Define a system
const documentSystem = createSystem({
  name: "document-system",
  resources: ["document", "folder", "comment"],
  actions: ["create", "read", "update", "delete", "share"],
  roles: [
    createRole({
      name: "admin",
      permissions: ["document:*", "folder:*", "comment:*"],
    }),
    createRole({
      name: "editor",
      permissions: ["document:read", "document:update", "document:create", "comment:*"],
      extends: ["viewer"],
    }),
    createRole({
      name: "viewer",
      permissions: ["document:read", "comment:read"],
    }),
  ],
})

// Create access control
const accessControl = createAccessControl(documentSystem)

// Create actors
const adminUser = createActor({
  id: "user-1",
  type: "user",
  roles: ["admin"],
})

const editorUser = createActor({
  id: "user-2",
  type: "user",
  roles: ["editor"],
})

const viewerUser = createActor({
  id: "user-3",
  type: "user",
  roles: ["viewer"],
})

// Check permissions
console.log(accessControl.hasPermission(adminUser, "document:delete")) // true
console.log(accessControl.hasPermission(editorUser, "document:delete")) // false
console.log(accessControl.hasPermission(editorUser, "document:update")) // true
console.log(accessControl.hasPermission(viewerUser, "document:read")) // true
console.log(accessControl.hasPermission(viewerUser, "document:update")) // false

// Get all permissions
console.log(accessControl.getPermissions(editorUser))
// ["document:read", "document:update", "document:create", "comment:read", "comment:create", "comment:update", "comment:delete"]
```

### Error Handling

```typescript
import * as z from "zod"
import { 
  createContract, 
  createRequestSchemaMap, 
  createErrorMap, 
  InMemoryTransport, 
  Client, 
  Server 
} from "@magicbutton.cloud/messaging"

// Define contract with errors
const contract = createContract({
  events: {},
  requests: createRequestSchemaMap({
    getUserById: {
      requestSchema: z.object({ id: z.string() }),
      responseSchema: z.object({ 
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
      }),
    },
  }),
  errors: createErrorMap({
    USER_NOT_FOUND: { code: "USER_NOT_FOUND", message: "User not found", status: 404 },
    INVALID_USER_ID: { code: "INVALID_USER_ID", message: "Invalid user ID format", status: 400 },
  }),
})

// Set up server
const serverTransport = new InMemoryTransport()
const server = new Server(serverTransport)
await server.start("memory://user-service")

// Mock user database
const users = [
  { id: "user-1", name: "John Doe", email: "john@example.com" },
]

server.handleRequest("getUserById", async (payload) => {
  const { id } = payload
  
  // Validate ID format
  if (!id.startsWith("user-")) {
    throw new Error("INVALID_USER_ID")
  }
  
  // Find user
  const user = users.find(u => u.id === id)
  if (!user) {
    throw new Error("USER_NOT_FOUND")
  }
  
  return user
})

// Set up client
const clientTransport = new InMemoryTransport()
const client = new Client(clientTransport)
await client.connect("memory://user-service")

// Successful request
try {
  const user = await client.request("getUserById", { id: "user-1" })
  console.log("User found:", user)
} catch (error) {
  console.error("Error:", error)
}

// Error handling - User not found
try {
  const user = await client.request("getUserById", { id: "user-999" })
  console.log("User found:", user)
} catch (error) {
  console.error("Error:", error.message) // "USER_NOT_FOUND"
}

// Error handling - Invalid ID
try {
  const user = await client.request("getUserById", { id: "invalid-id" })
  console.log("User found:", user)
} catch (error) {
  console.error("Error:", error.message) // "INVALID_USER_ID"
}
```

### React Integration

```tsx
import React, { useState, useEffect } from 'react'
import { Client, InMemoryTransport, createMessageContext } from '@magicbutton.cloud/messaging'
import { userServiceContract } from './contract'

// Create a client
const transport = new InMemoryTransport()
const client = new Client(transport, {
  clientId: "web-client",
  autoReconnect: true,
})

// React hook for using the messaging client
function useMessagingClient() {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    // Connect to the server
    client.connect("memory://user-service")
      .then(() => setIsConnected(true))
      .catch(err => setError(err))
    
    // Listen for status changes
    const unsubscribe = client.onStatusChange((status) => {
      setIsConnected(status === 'connected')
    })
    
    // Clean up
    return () => {
      unsubscribe()
      client.disconnect()
    }
  }, [])
  
  return { client, isConnected, error }
}

// Example component using the hook
function UserProfile({ userId }) {
  const { client, isConnected, error } = useMessagingClient()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userError, setUserError] = useState(null)
  
  useEffect(() => {
    if (!isConnected) return
    
    setLoading(true)
    
    // Create context with auth info
    const context = createMessageContext({
      auth: {
        token: localStorage.getItem('token'),
      },
    })
    
    // Fetch user data
    client.request('getUserById', { id: userId }, context)
      .then(userData => {
        setUser(userData)
        setLoading(false)
      })
      .catch(err => {
        setUserError(err.message)
        setLoading(false)
      })
  }, [userId, isConnected])
  
  if (!isConnected) return <div>Connecting to server...</div>
  if (error) return <div>Connection error: {error.message}</div>
  if (loading) return <div>Loading user data...</div>
  if (userError) return <div>Error loading user: {userError}</div>
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
      <button onClick={() => {
        client.request('updateUser', {
          id: userId,
          name: user.name + ' (Updated)',
        })
        .then(updatedUser => setUser(updatedUser))
      }}>
        Update Name
      </button>
    </div>
  )
}
```

## Contributing

We welcome contributions to Magic Button Messaging! Please see our [contributing guidelines](CONTRIBUTING.md) for more information.

## License

Magic Button Messaging is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
