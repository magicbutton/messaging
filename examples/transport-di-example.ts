/**
 * Example demonstrating factory-based dependency injection with @magicbutton.cloud/messaging
 * 
 * This example shows how to:
 * 1. Register and use factories for all components
 * 2. Create a custom transport implementation with its factory
 * 3. Configure client and server using dependency injection
 */

import * as z from "zod";
import {
  // Transport factory
  TransportProvider,
  TransportFactory,
  TransportConfig,
  BaseTransport,
  
  // Client factory
  ClientProvider,
  ClientFactory,
  ClientConfig,
  MessagingClient,

  // Server factory
  ServerProvider,
  ServerFactory,
  ServerConfig,
  MessagingServer,

  // Auth provider factories
  AuthProviderRegistry,
  AuthProviderFactory,
  AuthProviderConfig,
  DefaultAuthProviderFactory,

  // Authorization provider factories
  AuthorizationProviderRegistry,
  AuthorizationProviderFactory,
  AuthorizationProviderConfig,
  DefaultAuthorizationProviderFactory,

  // Observability factories
  ObservabilityProviderRegistry,
  ObservabilityProviderFactory,
  ObservabilityConfig,
  DefaultObservabilityProviderFactory,
  ConsoleLoggerFactory,
  LogLevel,
  
  // Core types
  createContract,
  Transport,
  Contract,
  MessageContext,
  AuthResult,
  InferEventData,
  InferRequestData,
  InferResponseData,
  setObservabilityProvider
} from "../index";

// STEP 1: Define a contract for your application
const chatContract = createContract({
  name: "ChatContract",
  version: "1.0.0",
  events: {
    "messageReceived": z.object({
      id: z.string(),
      content: z.string(),
      sender: z.string(),
      timestamp: z.string()
    }),
    "userJoined": z.object({
      userId: z.string(),
      username: z.string(),
      timestamp: z.string()
    }),
    "userLeft": z.object({
      userId: z.string(),
      username: z.string(),
      timestamp: z.string()
    })
  },
  requests: {
    "sendMessage": {
      request: z.object({
        content: z.string(),
        timestamp: z.string()
      }),
      response: z.object({
        id: z.string(),
        success: z.boolean()
      })
    },
    "getUsers": {
      request: z.object({}),
      response: z.object({
        users: z.array(z.object({
          id: z.string(),
          username: z.string()
        }))
      })
    }
  },
  errors: {
    "message_too_long": {
      code: "MESSAGE_TOO_LONG",
      message: "Message exceeds maximum length",
      severity: "warning",
      retryable: true
    },
    "not_authenticated": {
      code: "NOT_AUTHENTICATED",
      message: "User not authenticated",
      severity: "error",
      retryable: false
    }
  }
});

// Define the type using the contract
type ChatContract = typeof chatContract;

// STEP 2: Create a custom transport implementation

/**
 * Custom HTTP transport for the chat application
 */
class HttpTransport<TContract extends Contract> extends BaseTransport<TContract> {
  private apiUrl: string = "";
  private eventSource: EventSource | null = null;
  
  async connect(connectionString: string): Promise<void> {
    this.connectionString = connectionString;
    this.apiUrl = connectionString;
    this.connected = true;
    
    // Set up server-sent events for real-time communication
    this.setupEventSource();
    
    console.log(`HttpTransport connected to ${connectionString}`);
  }
  
  async disconnect(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.connected = false;
    console.log("HttpTransport disconnected");
  }
  
  private setupEventSource(): void {
    // Create EventSource for SSE (Server-Sent Events)
    this.eventSource = new EventSource(`${this.apiUrl}/events`);
    
    // Listen for generic events
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const eventType = data.type;
        const payload = data.payload;
        const context = data.context || {};
        
        // Find handlers for this event type
        const handlers = this.eventHandlers.get(eventType as any);
        if (handlers) {
          for (const handler of handlers) {
            try {
              handler(payload, context);
            } catch (error) {
              console.error(`Error in event handler for ${eventType}:`, error);
            }
          }
        }
      } catch (error) {
        console.error("Error processing event:", error);
      }
    };
    
    this.eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      
      // Try to reconnect if disconnected
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        setTimeout(() => this.setupEventSource(), 5000);
      }
    };
  }
  
  async emit<E extends keyof TContract["events"] & string>(
    event: E,
    payload: InferEventData<TContract["events"], E>,
    context: MessageContext = {}
  ): Promise<void> {
    if (!this.connected) {
      throw new Error("Not connected");
    }
    
    // Send event via HTTP POST
    await fetch(`${this.apiUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': context.auth?.token ? `Bearer ${context.auth.token}` : ''
      },
      body: JSON.stringify({
        type: event,
        payload,
        context
      })
    });
  }
  
  async request<R extends keyof TContract["requests"] & string>(
    requestType: R,
    payload: InferRequestData<TContract["requests"], R>,
    context: MessageContext = {}
  ): Promise<InferResponseData<TContract["requests"], R>> {
    if (!this.connected) {
      throw new Error("Not connected");
    }
    
    // Send request via HTTP POST
    const response = await fetch(`${this.apiUrl}/requests/${requestType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': context.auth?.token ? `Bearer ${context.auth.token}` : ''
      },
      body: JSON.stringify({
        payload,
        context
      })
    });
    
    // Parse response
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Unknown error");
    }
    
    return data;
  }
  
  // Other required methods (simplified for brevity)
  
  on<E extends keyof TContract["events"] & string>(
    event: E,
    handler: (payload: InferEventData<TContract["events"], E>, context: MessageContext) => void
  ): void {
    let handlers = this.eventHandlers.get(event);
    if (!handlers) {
      handlers = new Set();
      this.eventHandlers.set(event, handlers);
    }
    handlers.add(handler as any);
  }
  
  off<E extends keyof TContract["events"] & string>(
    event: E,
    handler: (payload: InferEventData<TContract["events"], E>, context: MessageContext) => void
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler as any);
    }
  }
  
  handleRequest<R extends keyof TContract["requests"] & string>(
    requestType: R,
    handler: (payload: InferRequestData<TContract["requests"], R>, context: MessageContext) => Promise<InferResponseData<TContract["requests"], R>>
  ): void {
    // In a real implementation, this would register a handler on the server side
    console.log(`Registered handler for request type: ${String(requestType)}`);
  }
  
  async login(credentials: { username: string; password: string } | { token: string }): Promise<AuthResult> {
    // Implement authentication logic
    if ("token" in credentials) {
      // Verify token
      const response = await fetch(`${this.apiUrl}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: credentials.token })
      });
      return await response.json();
    } else {
      // Login with username/password
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username: credentials.username,
          password: credentials.password
        })
      });
      return await response.json();
    }
  }
  
  async logout(): Promise<void> {
    await fetch(`${this.apiUrl}/auth/logout`, {
      method: 'POST'
    });
  }
  
  // Private event handlers storage
  private eventHandlers: Map<string, Set<(payload: any, context: MessageContext) => void>> = new Map();
}

// STEP 3: Create a factory for the custom transport

/**
 * Factory for creating HTTP transports
 */
class HttpTransportFactory<TContract extends Contract> implements TransportFactory<TContract> {
  createTransport(config: TransportConfig): Transport<TContract> {
    // Create the HTTP transport
    const transport = new HttpTransport<TContract>();
    
    // Auto-connect if connectionString is provided
    if (config.connectionString) {
      transport.connect(config.connectionString).catch(error => {
        console.error("Failed to auto-connect HTTP transport:", error);
      });
    }
    
    return transport;
  }
}

// STEP 4: Register all factories with their respective providers

// Register the HTTP transport factory
TransportProvider.registerFactory("http", new HttpTransportFactory<ChatContract>());

// Register the default client factory
ClientProvider.registerFactory("default", {
  createClient<TContract extends Contract>(config: ClientConfig<TContract>): MessagingClient<TContract> {
    return new MessagingClient<TContract>(config.transport, config.options);
  }
});

// Register the default server factory
ServerProvider.registerFactory("default", {
  createServer<TContract extends Contract>(config: ServerConfig<TContract>): MessagingServer<TContract> {
    return new MessagingServer<TContract>(config.transport, config.contract, config.options);
  }
});

// Create a custom logger factory with debug level enabled
const debugLoggerFactory = new ConsoleLoggerFactory(LogLevel.DEBUG);

// Register a custom observability provider factory
ObservabilityProviderRegistry.registerFactory("custom",
  new DefaultObservabilityProviderFactory(debugLoggerFactory));

// Also register it as default observability provider
// (in a real app, you might want to use different levels for each environment)
ObservabilityProviderRegistry.registerFactory("default",
  new DefaultObservabilityProviderFactory());

// STEP 5: Use the factories to create components

async function runExample() {
  try {
    console.log("Starting chat example with dependency injection...");

    // Create observability provider using the factory
    const observability = ObservabilityProviderRegistry.createObservabilityProvider({
      type: "custom",
      options: {
        defaultLogLevel: LogLevel.DEBUG,
        metricsOptions: {
          // Custom metrics configuration
          prefix: "chat_app"
        },
        // Define custom loggers for specific components
        customLoggers: {
          "transport": { logLevel: LogLevel.DEBUG },
          "auth": { logLevel: LogLevel.INFO }
        }
      }
    });

    // Replace the global provider with our custom one
    setObservabilityProvider(observability);

    // Create transport using the factory
    const transport = TransportProvider.createTransport<ChatContract>({
      type: "http",
      connectionString: "https://api.example.com/chat"
    });

    // Create client using the factory
    const client = ClientProvider.createClient<ChatContract>("default", {
      transport,
      options: {
        clientId: "client-123",
        clientType: "web",
        autoReconnect: true
      }
    });

    // Create server using the factory (in a real app, this would be in a separate process)
    const server = ServerProvider.createServer<ChatContract>("default", {
      transport,
      contract: chatContract,
      options: {
        serverId: "server-456",
        version: "1.0.0"
      }
    });
    
    // Start the server 
    await server.start("https://api.example.com/chat");
    
    // Connect the client
    await client.connect("https://api.example.com/chat");
    
    // Set up event handlers
    client.on("messageReceived", (payload, context) => {
      console.log(`Message received from ${payload.sender}: ${payload.content}`);
    });
    
    client.on("userJoined", (payload, context) => {
      console.log(`User joined: ${payload.username}`);
    });
    
    // Register request handlers on the server
    server.handleRequest("sendMessage", async (payload, context, clientId) => {
      console.log(`Message received from client ${clientId}: ${payload.content}`);
      
      // Process message and return response
      return {
        id: `msg-${Date.now()}`,
        success: true
      };
    });
    
    server.handleRequest("getUsers", async (payload, context, clientId) => {
      console.log(`Client ${clientId} requested user list`);
      
      // Return list of users
      return {
        users: [
          { id: "user-1", username: "alice" },
          { id: "user-2", username: "bob" }
        ]
      };
    });
    
    // Login the client
    const authResult = await client.login({
      username: "testuser",
      password: "password123"
    });
    
    if (authResult.success) {
      console.log("Login successful");
      
      // Send a message
      const response = await client.request("sendMessage", {
        content: "Hello from factory-based client!",
        timestamp: new Date().toISOString()
      });
      
      console.log("Message sent with ID:", response.id);
      
      // Get users
      const usersResponse = await client.request("getUsers", {});
      console.log("Users:", usersResponse.users);
    } else {
      console.error("Login failed:", authResult.error);
    }
    
    // Clean up
    setTimeout(async () => {
      await client.disconnect();
      await server.stop();
      console.log("Example completed");
    }, 5000);
    
  } catch (error) {
    console.error("Error in example:", error);
  }
}

// Run the example (commented out since this is just for demonstration)
// runExample();