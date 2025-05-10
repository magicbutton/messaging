# Magic Button Messaging Usage Guide

This document provides comprehensive examples and patterns for using the Magic Button Messaging library.

## Quick Start

```typescript
import { Client, createTransportAdapter } from '@magicbutton.cloud/messaging';
import { WebSocketTransport } from '@magicbutton.cloud/messaging-websocket';

// Create a transport adapter
const transport = createTransportAdapter(new WebSocketTransport());

// Initialize client
const client = new Client(transport, {
  clientId: 'my-client-id',
  clientType: 'frontend'
});

// Connect to server
await client.connect('ws://example.com/messaging');

// Send request
const response = await client.request('getUserProfile', { userId: '123' });

// Subscribe to events
client.on('userUpdated', (payload, context) => {
  console.log('User updated:', payload);
});

// Emit event
await client.emit('clientAction', { action: 'buttonClicked', data: { buttonId: 'submit' } });

// Disconnect when done
await client.disconnect();
```

## Defining Contracts

Contracts define the shape of your messages using Zod schemas:

```typescript
import { z } from 'zod';
import { createContract, createEventMap, createRequestSchemaMap } from '@magicbutton.cloud/messaging';

// Define event schemas
const eventSchemas = createEventMap({
  userCreated: z.object({ 
    userId: z.string(),
    username: z.string(),
    createdAt: z.number()
  }),
  userUpdated: z.object({ 
    userId: z.string(),
    changes: z.record(z.unknown())
  })
});

// Define request/response schemas
const requestSchemas = createRequestSchemaMap({
  getUserProfile: {
    requestSchema: z.object({ userId: z.string() }),
    responseSchema: z.object({ 
      userId: z.string(),
      username: z.string(),
      email: z.string().email(),
      profileData: z.record(z.unknown())
    })
  },
  updateUserProfile: {
    requestSchema: z.object({ 
      userId: z.string(),
      updates: z.record(z.unknown())
    }),
    responseSchema: z.object({ 
      success: z.boolean(),
      updatedFields: z.array(z.string())
    })
  }
});

// Create the contract
const userContract = createContract({
  events: eventSchemas,
  requests: requestSchemas
});

// Export the contract
export default userContract;
```

## Server Implementation

```typescript
import { Server, createTransportAdapter } from '@magicbutton.cloud/messaging';
import { WebSocketTransport } from '@magicbutton.cloud/messaging-websocket';
import userContract from './contracts/userContract';

// Setup transport
const transport = createTransportAdapter(new WebSocketTransport());

// Create server
const server = new Server(transport, {
  serverId: 'user-service',
  version: '1.0.0'
});

// Register request handlers
server.handleRequest('getUserProfile', async (payload, context, clientId) => {
  const { userId } = payload;
  // Fetch user from database
  const user = await db.users.findById(userId);
  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    profileData: user.profile
  };
});

// Start server
await server.start('ws://0.0.0.0:3000/messaging');

// Broadcast event to all clients
await server.broadcast('System update', { 
  message: 'Server maintenance in 5 minutes',
  duration: '15 minutes'
});
```

## Access Control

```typescript
import { 
  createRole, 
  createSystem, 
  createAccessControl,
  createAuthenticationMiddleware
} from '@magicbutton.cloud/messaging';

// Define roles and permissions
const adminRole = createRole({
  name: 'admin',
  permissions: ['users.read', 'users.write', 'users.delete']
});

const userRole = createRole({
  name: 'user',
  permissions: ['users.read', 'users.write.own']
});

// Create system
const system = createSystem({
  name: 'user-management',
  resources: ['users', 'profiles', 'settings'],
  actions: ['read', 'write', 'delete'],
  roles: [adminRole, userRole]
});

// Create access control instance
const accessControl = createAccessControl(system);

// Authentication middleware
const authMiddleware = createAuthenticationMiddleware(
  async (context) => {
    if (!context.auth?.token) return false;
    // Verify token with your auth service
    const isValid = await authService.verifyToken(context.auth.token);
    return isValid;
  },
  { exclude: ['$ping', '$serverInfo'] } // Public endpoints
);

// Apply middleware to server
server.middleware.useGlobalRequestMiddleware(authMiddleware);
```

## Error Handling

```typescript
import { 
  ErrorRegistry, 
  ErrorType, 
  ErrorSeverity, 
  handleErrors, 
  retry 
} from '@magicbutton.cloud/messaging';

// Create custom error registry
const errorRegistry = new ErrorRegistry();
errorRegistry.registerMany([
  {
    code: 'USER_NOT_FOUND',
    message: 'User with ID {userId} not found',
    metadata: {
      type: ErrorType.BUSINESS,
      severity: ErrorSeverity.WARNING,
      statusCode: 404,
      retry: { retryable: false }
    }
  },
  {
    code: 'DATABASE_ERROR',
    message: 'Database error: {details}',
    metadata: {
      type: ErrorType.SYSTEM,
      severity: ErrorSeverity.ERROR,
      statusCode: 500,
      retry: { retryable: true, delayMs: 1000, maxRetries: 3 }
    }
  }
]);

// Use custom error in handlers
server.handleRequest('getUserProfile', async (payload, context, clientId) => {
  try {
    const user = await db.users.findById(payload.userId);
    if (!user) {
      throw errorRegistry.createError('USER_NOT_FOUND', {
        params: { userId: payload.userId }
      });
    }
    return user;
  } catch (error) {
    if (error.name === 'DatabaseError') {
      throw errorRegistry.createError('DATABASE_ERROR', {
        cause: error,
        params: { details: error.message }
      });
    }
    throw error;
  }
});

// Retry logic
const getUserWithRetry = async (userId) => {
  return retry(
    async () => {
      const user = await db.users.findById(userId);
      if (!user) throw new Error('User not found');
      return user;
    },
    {
      maxRetries: 3,
      initialDelayMs: 1000,
      backoffFactor: 2,
      retryIf: (error) => error.message.includes('connection')
    }
  );
};
```

## Observability

```typescript
import { 
  setObservabilityProvider, 
  DefaultObservabilityProvider,
  LogLevel 
} from '@magicbutton.cloud/messaging';

// Custom logger implementation
class CustomLogger {
  constructor(name) {
    this.name = name;
  }
  
  debug(message, context) {
    console.debug(`[${this.name}] ${message}`, context);
  }

  info(message, context) {
    console.info(`[${this.name}] ${message}`, context);
  }

  warn(message, context) {
    console.warn(`[${this.name}] ${message}`, context);
  }

  error(message, error, context) {
    console.error(`[${this.name}] ${message}`, error, context);
  }
}

// Create observability provider
const observabilityProvider = new DefaultObservabilityProvider(LogLevel.DEBUG);

// Set custom logger
observabilityProvider.setLogger('requests', new CustomLogger('requests'));

// Use provider
setObservabilityProvider(observabilityProvider);
```

## Testing

```typescript
import { 
  TestMessaging, 
  MockTransport 
} from '@magicbutton.cloud/messaging';

describe('User Service', () => {
  let testEnv;
  
  beforeEach(() => {
    // Create test environment
    testEnv = new TestMessaging({
      serverOptions: {
        serverId: 'test-server',
        autoStart: true
      },
      clientOptions: {
        clientId: 'test-client',
        autoConnect: true
      }
    });
    
    // Register request handler
    testEnv.handleRequest('getUserProfile', async (payload, clientId) => {
      return {
        userId: payload.userId,
        username: 'testuser',
        email: 'test@example.com'
      };
    });
  });
  
  afterEach(async () => {
    await testEnv.cleanup();
  });
  
  test('should get user profile', async () => {
    // Send request
    const response = await testEnv.client.request('getUserProfile', { userId: '123' });
    
    // Verify response
    expect(response.userId).toBe('123');
    expect(response.username).toBe('testuser');
    
    // Verify request was made with correct payload
    const [request] = await testEnv.waitForRequest('getUserProfile');
    expect(request.payload.userId).toBe('123');
  });
  
  test('should emit and receive events', async () => {
    // Register event handler
    const eventHandler = jest.fn();
    testEnv.client.on('userUpdated', eventHandler);
    
    // Emit event from server
    await testEnv.server.broadcast('userUpdated', { userId: '123', field: 'email' });
    
    // Wait for event to be processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify event was received
    expect(eventHandler).toHaveBeenCalled();
    expect(eventHandler.mock.calls[0][0]).toEqual({ userId: '123', field: 'email' });
    
    // Alternative: wait for specific event
    await testEnv.client.emit('clientAction', { action: 'click' });
    const [event] = await testEnv.waitForEvent('clientAction');
    expect(event.payload.action).toBe('click');
  });
});
```

## Performance Considerations

- Use the `InMemoryTransport` for local development and testing
- For high-throughput applications, consider using a message broker like RabbitMQ or Kafka
- Implement proper error handling and retries for network failures
- Use versioned contracts for backward compatibility
- Cache frequently used data to reduce request volume

## Common Pitfalls

- Not properly handling disconnections and reconnections
- Missing error handling for network failures
- Forgetting to validate input/output with schemas
- Not implementing authentication and authorization
- Creating circular dependencies in event handlers