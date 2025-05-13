# Magic Button Messaging - Enhanced API Integration Guide

This guide explains how to integrate the enhanced messaging features including transport extensions, connection management, and middleware system.

## Table of Contents

1. [Introduction](#introduction)
2. [Transport Extensions](#transport-extensions)
3. [Connection Management](#connection-management)
4. [Middleware System](#middleware-system)
5. [Examples](#examples)
6. [Migration Guide](#migration-guide)

## Introduction

The Magic Button messaging SDK has been enhanced with three major improvements:

1. **Platform-specific Transport Extensions**: Allows you to add specialized functionality to transports for different environments (browser, CLI, server).
2. **Connection Management**: Robust connection handling with reconnection, heartbeat monitoring, and connection state management.
3. **Middleware System**: A flexible pipeline for cross-cutting concerns like logging, authentication, and validation.

These enhancements are fully backwards compatible with existing implementations.

## Transport Extensions

Transport extensions allow you to add platform-specific functionality to your transports without modifying the core transport implementation.

### Example: Chrome Extension Transport

```typescript
import { BrowserExtensions, ExtensibleTransport } from '@magicbutton.cloud/messaging';

// Create a transport with browser extensions
const transport = new ChromeExtensibleTransport({
  connectionName: 'client',
  context: 'browser',
  reconnect: true,
  browserExtensions: {
    async openSidePanel() {
      await chrome.sidePanel.open();
    },
    async closeSidePanel() {
      await chrome.sidePanel.close();
    },
    async getCurrentTabInfo() {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) {
        throw new Error('No active tab found');
      }
      return {
        tabId: tabs[0].id || -1,
        url: tabs[0].url || '',
        title: tabs[0].title || ''
      };
    }
  }
});

// Using the extensions
if (transport.hasExtension('openSidePanel')) {
  await transport.browser.openSidePanel();
}

// Or using the generic API
if (transport.hasExtension('openSidePanel')) {
  await transport.getExtension('openSidePanel')();
}
```

### Extension Categories

The SDK provides three categories of extensions:

- `browser`: For web browser specific functionality (Chrome, Firefox, etc.)
- `cli`: For command-line interface specific functionality
- `server`: For server-specific functionality

## Connection Management

The connection manager handles connection lifecycle including automatic reconnection, heartbeat monitoring, and connection state management.

```typescript
import { ConnectionManager, ConnectionEvent } from '@magicbutton.cloud/messaging';

// Create a connection manager
const connectionManager = new ConnectionManager(transport, {
  autoReconnect: true,
  maxReconnectAttempts: 5,
  initialReconnectDelayMs: 1000,
  reconnectBackoffFactor: 1.5,
  heartbeat: true,
  heartbeatIntervalMs: 30000,
  debug: true
});

// Listen for connection events
connectionManager.on(ConnectionEvent.CONNECTED, () => {
  console.log('Connected');
});

connectionManager.on(ConnectionEvent.RECONNECTING, (data) => {
  console.log(`Reconnecting (attempt ${data.attempt})...`);
});

connectionManager.on(ConnectionEvent.HEARTBEAT, (data) => {
  console.log(`Heartbeat received at ${new Date(data.timestamp).toISOString()}`);
});

// Use the connection manager
await connectionManager.connect();

// Later, to disconnect
await connectionManager.disconnect();

// Clean up when done
connectionManager.dispose();
```

## Middleware System

The middleware system allows you to intercept and modify requests, responses, and events at various points in their lifecycle.

```typescript
import { 
  createLoggingMiddleware, 
  createAuthenticationMiddleware, 
  createPerformanceMiddleware,
  MiddlewareManager
} from '@magicbutton.cloud/messaging';

// Create middleware manager
const middlewareManager = new MiddlewareManager();

// Add middleware for logging
middlewareManager.add(createLoggingMiddleware({
  logRequests: true,
  logResponses: true,
  logEvents: true,
  logErrors: true,
  redactFields: ['password', 'token', 'apiKey']
}));

// Add middleware for performance monitoring
middlewareManager.add(createPerformanceMiddleware({
  onRequestEnd: (request, response, duration) => {
    console.log(`Request ${request.type} completed in ${duration}ms`);
  }
}));

// Add middleware for authentication
middlewareManager.add(createAuthenticationMiddleware({
  getAuthToken: (context) => localStorage.getItem('auth_token') || undefined,
  verifyAuthToken: (token) => !!token,
  addAuthToken: (request) => ({
    ...request,
    headers: {
      ...request.headers,
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`
    }
  }),
  excludeRequests: ['login', 'register']
}));

// Use the middleware manager with your client/server
client.on('request', async (request, context) => {
  try {
    // Process request through middleware
    const processedRequest = await middlewareManager.executeRequestMiddleware(
      'beforeRequest',
      request,
      context
    );
    
    // Process the request...
    const response = await handleRequest(processedRequest);
    
    // Process response through middleware
    return await middlewareManager.executeResponseMiddleware(
      'afterResponse',
      response,
      request,
      context
    );
  } catch (error) {
    // Handle errors through middleware
    const processedError = await middlewareManager.executeErrorMiddleware(
      error,
      request,
      context
    );
    throw processedError;
  }
});
```

### Built-in Middleware

The SDK includes several built-in middleware:

- `createLoggingMiddleware`: For logging requests, responses, and events
- `createPerformanceMiddleware`: For monitoring performance of requests
- `createAuthenticationMiddleware`: For handling authentication
- `createValidationMiddleware`: For validating requests and responses
- `createTelemetryMiddleware`: For integrating with OpenTelemetry

### Custom Middleware

You can create custom middleware to address specific needs:

```typescript
const userTrackingMiddleware = {
  name: 'user-tracking-middleware',
  priority: 50, // Lower numbers run first
  beforeRequest: (request, context) => {
    // Add user information to the request
    return {
      ...request,
      headers: {
        ...request.headers,
        'User-ID': getCurrentUser()?.id
      }
    };
  },
  onError: (error, request, context) => {
    // Track errors
    trackError(error, {
      requestType: request?.type,
      userId: getCurrentUser()?.id
    });
    
    // Return the original error or a modified one
    return error;
  }
};

// Add the middleware
middlewareManager.add(userTrackingMiddleware);
```

## Examples

### Complete Client Example

```typescript
import { 
  ConnectionManager, 
  createLoggingMiddleware,
  createPerformanceMiddleware,
  ChromeExtensibleTransport
} from '@magicbutton.cloud/messaging';

// Create transport with extensions
const transport = new ChromeExtensibleTransport({
  connectionName: 'client',
  context: 'browser',
  browserExtensions: {
    async captureScreenshot() {
      return await chrome.tabs.captureVisibleTab();
    }
  }
});

// Create connection manager
const connectionManager = new ConnectionManager(transport, {
  autoReconnect: true,
  heartbeat: true
});

// Set up middleware
const middleware = [
  createLoggingMiddleware(),
  createPerformanceMiddleware()
];

// Create enhanced client
const client = createEnhancedClient({
  transport,
  connectionManager,
  middleware
});

// Connect and use
await client.connect();

// Use browser extension
const screenshot = await client.transport.browser.captureScreenshot();

// Make requests with middleware processing
const users = await client.request('getUsers', {});

// Clean up
await client.disconnect();
connectionManager.dispose();
```

### Complete Server Example

```typescript
import { 
  createLoggingMiddleware,
  createValidationMiddleware,
  ServerExtensibleTransport
} from '@magicbutton.cloud/messaging';

// Create transport with extensions
const transport = new ServerExtensibleTransport({
  connectionName: 'server',
  context: 'api-server',
  serverExtensions: {
    async getHealth() {
      return { 
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };
    }
  }
});

// Set up middleware
const middleware = [
  createLoggingMiddleware(),
  createValidationMiddleware(contractSchemas)
];

// Create enhanced server
const server = createEnhancedServer({
  transport,
  middleware
});

// Register handlers
server.on('getUsers', async () => {
  return { users: await getUsersFromDatabase() };
});

// Start server
await server.start();

// Use server extension
const healthStatus = await server.transport.server.getHealth();
```

## Migration Guide

### Migrating from the Basic API

If you're using the basic messaging API, you can migrate to the enhanced API with minimal changes:

1. **Replace Transport Instantiation**:

   Before:
   ```typescript
   const transportFactory = new ChromeTransportFactory();
   const transport = transportFactory.createClient(config);
   ```

   After:
   ```typescript
   const transportFactory = new ChromeExtensibleTransportFactory();
   const transport = transportFactory.createClient(config);
   ```

2. **Add Connection Manager** (optional):

   ```typescript
   const connectionManager = new ConnectionManager(transport, {
     autoReconnect: true,
     heartbeat: true
   });
   
   // Use connection manager instead of direct transport methods
   await connectionManager.connect();
   ```

3. **Add Middleware** (optional):

   ```typescript
   const middlewareManager = new MiddlewareManager();
   middlewareManager.add(createLoggingMiddleware());
   
   // Integrate middleware with your request/response handling
   ```

4. **Add Extensions** (optional):

   ```typescript
   transport.addExtension('customFeature', async () => {
     // Custom implementation
   });
   ```

The enhanced API is designed to be fully backwards compatible, so you can adopt these features incrementally.