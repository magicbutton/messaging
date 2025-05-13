import { z } from 'zod';
import { 
  TestMessaging, 
  createContract, 
  createEventMap, 
  createRequestSchemaMap,
  createMessageContext,
  MessagingError
} from '../index';

describe('Request-Response Handling', () => {
  // Define a test contract with requests
  const testContract = createContract({
    name: 'request-test-contract',
    version: '1.0.0',
    events: createEventMap({}),
    requests: createRequestSchemaMap({
      'user.getById': {
        request: z.object({
          userId: z.string()
        }),
        response: z.object({
          id: z.string(),
          username: z.string(),
          email: z.string().email(),
          role: z.string()
        })
      },
      'user.update': {
        request: z.object({
          userId: z.string(),
          data: z.object({
            username: z.string().optional(),
            email: z.string().email().optional(),
            role: z.string().optional()
          })
        }),
        response: z.object({
          success: z.boolean(),
          updatedUser: z.object({
            id: z.string(),
            username: z.string(),
            email: z.string().email(),
            role: z.string()
          })
        })
      },
      'user.delete': {
        request: z.object({
          userId: z.string()
        }),
        response: z.object({
          success: z.boolean()
        })
      }
    }),
    errors: {
      'USER_NOT_FOUND': {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        severity: 'error'
      },
      'INVALID_USER_DATA': {
        code: 'INVALID_USER_DATA',
        message: 'Invalid user data provided',
        severity: 'error'
      },
      'PERMISSION_DENIED': {
        code: 'PERMISSION_DENIED',
        message: 'Permission denied',
        severity: 'error'
      }
    }
  });

  // Mock user database
  const mockUsers = {
    'user-1': {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      role: 'admin'
    },
    'user-2': {
      id: 'user-2',
      username: 'bob',
      email: 'bob@example.com',
      role: 'user'
    }
  };

  // Test instance
  let messaging: TestMessaging<typeof testContract.events, typeof testContract.requests>;

  beforeEach(() => {
    // Set up a fresh test environment before each test
    messaging = new TestMessaging<
      typeof testContract.events, 
      typeof testContract.requests
    >();

    // Register request handlers on the server
    messaging.server.handleRequest('user.getById', async (payload, context) => {
      const { userId } = payload;
      const user = mockUsers[userId];
      
      if (!user) {
        throw new MessagingError({
          code: 'USER_NOT_FOUND',
          message: `User with ID ${userId} not found`,
          severity: 'error'
        });
      }
      
      return user;
    });

    messaging.server.handleRequest('user.update', async (payload, context) => {
      const { userId, data } = payload;
      const user = mockUsers[userId];
      
      if (!user) {
        throw new MessagingError({
          code: 'USER_NOT_FOUND',
          message: `User with ID ${userId} not found`,
          severity: 'error'
        });
      }
      
      // Update the user data
      const updatedUser = {
        ...user,
        ...data
      };
      
      // In a real app, we would persist this data
      mockUsers[userId] = updatedUser;
      
      return {
        success: true,
        updatedUser
      };
    });

    messaging.server.handleRequest('user.delete', async (payload, context) => {
      const { userId } = payload;
      const user = mockUsers[userId];
      
      if (!user) {
        throw new MessagingError({
          code: 'USER_NOT_FOUND',
          message: `User with ID ${userId} not found`,
          severity: 'error'
        });
      }
      
      // In a real app, we would delete the user
      delete mockUsers[userId];
      
      return {
        success: true
      };
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await messaging.cleanup();
    
    // Restore mock users
    mockUsers['user-1'] = {
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      role: 'admin'
    };
    
    mockUsers['user-2'] = {
      id: 'user-2',
      username: 'bob',
      email: 'bob@example.com',
      role: 'user'
    };
  });

  test('Client can make successful requests', async () => {
    // Wait for client to connect if not already connected
    if (!messaging.client.isConnected()) {
      await new Promise<void>((resolve) => {
        const unsub = messaging.client.onStatusChange((status) => {
          if (status === 'connected') {
            unsub();
            resolve();
          }
        });
      });
    }

    // Make a request to get a user
    const response = await messaging.client.request('user.getById', {
      userId: 'user-1'
    });
    
    // Verify the response
    expect(response).toBeDefined();
    expect(response.id).toBe('user-1');
    expect(response.username).toBe('alice');
    expect(response.email).toBe('alice@example.com');
    expect(response.role).toBe('admin');
  });

  test('Client can update data with requests', async () => {
    // Wait for client to connect if not already connected
    if (!messaging.client.isConnected()) {
      await new Promise<void>((resolve) => {
        const unsub = messaging.client.onStatusChange((status) => {
          if (status === 'connected') {
            unsub();
            resolve();
          }
        });
      });
    }

    // Make a request to update a user
    const response = await messaging.client.request('user.update', {
      userId: 'user-2',
      data: {
        username: 'robert',
        role: 'editor'
      }
    });
    
    // Verify the response
    expect(response.success).toBe(true);
    expect(response.updatedUser).toBeDefined();
    expect(response.updatedUser.username).toBe('robert');
    expect(response.updatedUser.role).toBe('editor');
    expect(response.updatedUser.email).toBe('bob@example.com'); // unchanged
    
    // Verify the update was applied by getting the user
    const getResponse = await messaging.client.request('user.getById', {
      userId: 'user-2'
    });
    
    expect(getResponse.username).toBe('robert');
    expect(getResponse.role).toBe('editor');
  });

  test('Server returns appropriate errors', async () => {
    // Wait for client to connect if not already connected
    if (!messaging.client.isConnected()) {
      await new Promise<void>((resolve) => {
        const unsub = messaging.client.onStatusChange((status) => {
          if (status === 'connected') {
            unsub();
            resolve();
          }
        });
      });
    }

    // Try to get a non-existent user
    try {
      await messaging.client.request('user.getById', {
        userId: 'user-999'
      });
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Verify the error
      expect(error).toBeDefined();
      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.severity).toBe('error');
    }
  });

  test('Client can send requests with context', async () => {
    // Set up a special handler that examines the context
    let receivedContext: any = null;
    
    messaging.server.handleRequest('user.getById', async (payload, context) => {
      // Store the context for verification
      receivedContext = context;
      
      const { userId } = payload;
      const user = mockUsers[userId];
      
      if (!user) {
        throw new MessagingError({
          code: 'USER_NOT_FOUND',
          message: `User with ID ${userId} not found`,
          severity: 'error'
        });
      }
      
      return user;
    }, { overwrite: true }); // Overwrite the existing handler
    
    // Wait for client to connect if not already connected
    if (!messaging.client.isConnected()) {
      await new Promise<void>((resolve) => {
        const unsub = messaging.client.onStatusChange((status) => {
          if (status === 'connected') {
            unsub();
            resolve();
          }
        });
      });
    }

    // Create a custom context
    const customContext = createMessageContext({
      source: 'test-client',
      metadata: {
        userAgent: 'test-browser',
        sessionId: '12345'
      }
    });
    
    // Make a request with the custom context
    await messaging.client.request('user.getById', {
      userId: 'user-1'
    }, customContext);
    
    // Verify the context was received by the server
    expect(receivedContext).toBeDefined();
    expect(receivedContext.source).toBe('test-client');
    expect(receivedContext.metadata?.userAgent).toBe('test-browser');
    expect(receivedContext.metadata?.sessionId).toBe('12345');
  });

  test('Client can delete data with requests', async () => {
    // Wait for client to connect if not already connected
    if (!messaging.client.isConnected()) {
      await new Promise<void>((resolve) => {
        const unsub = messaging.client.onStatusChange((status) => {
          if (status === 'connected') {
            unsub();
            resolve();
          }
        });
      });
    }

    // Delete a user
    const response = await messaging.client.request('user.delete', {
      userId: 'user-2'
    });
    
    // Verify the response
    expect(response.success).toBe(true);
    
    // Try to get the deleted user
    try {
      await messaging.client.request('user.getById', {
        userId: 'user-2'
      });
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Verify the error
      expect(error).toBeDefined();
      expect(error.code).toBe('USER_NOT_FOUND');
    }
  });
});