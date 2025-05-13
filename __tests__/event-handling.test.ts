import { z } from 'zod';
import { 
  TestMessaging, 
  createContract, 
  createEventMap, 
  createRequestSchemaMap,
  createMessageContext
} from '../index';

describe('Event Handling', () => {
  // Define a test contract with events
  const testContract = createContract({
    name: 'event-test-contract',
    version: '1.0.0',
    events: createEventMap({
      'user.created': z.object({
        userId: z.string(),
        username: z.string(),
        email: z.string().email()
      }),
      'user.updated': z.object({
        userId: z.string(),
        changes: z.record(z.string(), z.any())
      }),
      'message.sent': z.object({
        messageId: z.string(),
        from: z.string(),
        to: z.string(),
        content: z.string(),
        timestamp: z.number()
      })
    }),
    requests: createRequestSchemaMap({}),
    errors: {}
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

  test('Server can emit events to client', async () => {
    // Set up a listener on the client to receive events
    const receivedEvents: any[] = [];
    const unsubscribe = messaging.client.on('user.created', (data, context) => {
      receivedEvents.push({ type: 'user.created', data, context });
    });

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

    // Server emits an event
    const eventData = {
      userId: 'user-123',
      username: 'testuser',
      email: 'test@example.com'
    };
    
    await messaging.server.emitEvent('user.created', eventData);
    
    // Wait for the event to be received
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify the event was received
    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].data).toEqual(eventData);
    
    // Clean up
    unsubscribe();
  });

  test('Client can subscribe to multiple event types', async () => {
    // Set up listeners for multiple event types
    const receivedEvents: any[] = [];
    
    const unsubscribe1 = messaging.client.on('user.created', (data) => {
      receivedEvents.push({ type: 'user.created', data });
    });
    
    const unsubscribe2 = messaging.client.on('user.updated', (data) => {
      receivedEvents.push({ type: 'user.updated', data });
    });
    
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

    // Server emits both event types
    await messaging.server.emitEvent('user.created', {
      userId: 'user-456',
      username: 'newuser',
      email: 'new@example.com'
    });
    
    await messaging.server.emitEvent('user.updated', {
      userId: 'user-456',
      changes: {
        username: 'updateduser'
      }
    });
    
    // Wait for events to be received
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify both events were received
    expect(receivedEvents.length).toBe(2);
    expect(receivedEvents[0].type).toBe('user.created');
    expect(receivedEvents[1].type).toBe('user.updated');
    
    // Clean up
    unsubscribe1();
    unsubscribe2();
  });

  test('Client can unsubscribe from events', async () => {
    // Set up a listener
    const receivedEvents: any[] = [];
    const unsubscribe = messaging.client.on('message.sent', (data) => {
      receivedEvents.push(data);
    });
    
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

    // Server emits an event
    await messaging.server.emitEvent('message.sent', {
      messageId: 'msg-123',
      from: 'user-1',
      to: 'user-2',
      content: 'Hello!',
      timestamp: Date.now()
    });
    
    // Wait for the event to be received
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Unsubscribe from the event
    unsubscribe();
    
    // Clear the received events
    receivedEvents.length = 0;
    
    // Server emits another event
    await messaging.server.emitEvent('message.sent', {
      messageId: 'msg-456',
      from: 'user-1',
      to: 'user-2',
      content: 'Are you there?',
      timestamp: Date.now()
    });
    
    // Wait for a potential event
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify no events were received after unsubscribing
    expect(receivedEvents.length).toBe(0);
  });

  test('Events can include context information', async () => {
    // Set up a listener on the client
    const receivedContexts: any[] = [];
    const unsubscribe = messaging.client.on('user.created', (data, context) => {
      receivedContexts.push(context);
    });
    
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

    // Create a context with specific values
    const customContext = createMessageContext({
      source: 'test-server',
      metadata: {
        origin: 'test-suite',
        importance: 'high'
      }
    });
    
    // Server emits an event with the custom context
    await messaging.server.emitEvent(
      'user.created', 
      {
        userId: 'user-789',
        username: 'contextuser',
        email: 'context@example.com'
      },
      customContext
    );
    
    // Wait for the event to be received
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify the context was received correctly
    expect(receivedContexts.length).toBe(1);
    expect(receivedContexts[0].source).toBe('test-server');
    expect(receivedContexts[0].metadata?.origin).toBe('test-suite');
    expect(receivedContexts[0].metadata?.importance).toBe('high');
    
    // Clean up
    unsubscribe();
  });
});