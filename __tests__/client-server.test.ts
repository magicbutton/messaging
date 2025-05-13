import { z } from 'zod';
import { 
  TestMessaging, 
  createContract, 
  createEventMap, 
  createRequestSchemaMap,
  createMessageContext
} from '../index';

describe('Client-Server Communication', () => {
  // Define a test contract with events and requests
  const testContract = createContract({
    name: 'test-contract',
    version: '1.0.0',
    events: createEventMap({
      'test.event': z.object({
        message: z.string()
      }),
      'test.notification': z.object({
        id: z.string(),
        type: z.string(),
        content: z.string()
      })
    }),
    requests: createRequestSchemaMap({
      'test.ping': {
        request: z.object({
          timestamp: z.number()
        }),
        response: z.object({
          echo: z.number(),
          serverTime: z.number()
        })
      },
      'test.getData': {
        request: z.object({
          id: z.string()
        }),
        response: z.object({
          id: z.string(),
          data: z.any()
        })
      }
    }),
    errors: {
      'TEST_ERROR': {
        code: 'TEST_ERROR',
        message: 'A test error occurred',
        severity: 'error'
      },
      'DATA_NOT_FOUND': {
        code: 'DATA_NOT_FOUND',
        message: 'The requested data was not found',
        severity: 'warning'
      }
    }
  });

  // Test instance
  let messaging: TestMessaging<typeof testContract.events, typeof testContract.requests>;

  beforeEach(() => {
    // Set up a fresh test environment before each test
    messaging = new TestMessaging<
      typeof testContract.events, 
      typeof testContract.requests
    >();
  });

  afterEach(async () => {
    // Clean up after each test
    await messaging.cleanup();
  });

  test('Client can connect to server', async () => {
    // Wait for the client to connect (should happen automatically)
    await new Promise<void>((resolve) => {
      if (messaging.client.isConnected()) {
        resolve();
      } else {
        const unsubscribe = messaging.client.onStatusChange((status) => {
          if (status === 'connected') {
            unsubscribe();
            resolve();
          }
        });
      }
    });

    // Verify the connection is established
    expect(messaging.client.isConnected()).toBe(true);
  });

  test('Client can disconnect from server', async () => {
    // Ensure client is connected first
    if (!messaging.client.isConnected()) {
      await messaging.client.connect(messaging.connectionString);
    }
    
    // Disconnect the client
    await messaging.client.disconnect();
    
    // Verify the client is disconnected
    expect(messaging.client.isConnected()).toBe(false);
  });

  test('Server reports connected clients', async () => {
    // Ensure client is connected
    if (!messaging.client.isConnected()) {
      await messaging.client.connect(messaging.connectionString);
    }
    
    // Check the server's connected clients
    const clients = messaging.server.getConnectedClients();
    
    // Should have at least one client (our test client)
    expect(clients.length).toBeGreaterThan(0);
    expect(clients.some(c => c.clientId === messaging.client.getClientId())).toBe(true);
  });
});