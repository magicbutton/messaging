/**
 * Example showcasing the factory pattern with configuration and middleware systems
 * 
 * This example demonstrates:
 * 1. Setting up a configuration system with multiple sources
 * 2. Creating custom middleware
 * 3. Using factories to set up the messaging system
 */

import * as z from "zod";
import {
  // Configuration system
  ConfigurationRegistry,
  MemoryConfigurationSource,
  DefaultConfigurationProviderFactory,
  MessagingConfig,
  
  // Middleware factory
  MiddlewareRegistry,
  DefaultMiddlewareProvider,
  
  // Other components
  createContract,
  MessagingClient,
  MessagingServer,
  TransportProvider,
  ClientProvider,
  ServerProvider,
  DefaultAuthProviderFactory,
  DefaultAuthorizationProviderFactory,
  ObservabilityProviderRegistry,
  DefaultObservabilityProviderFactory,
  LogLevel,
  
  // Middleware
  EventMiddleware,
  RequestMiddleware,
  
  // Types
  MessageContext,
  Contract
} from "../index";

// Define a sample contract
const sampleContract = createContract({
  name: "SampleContract",
  version: "1.0.0",
  events: {
    "userUpdated": z.object({
      userId: z.string(),
      name: z.string(),
      email: z.string().email(),
      updatedAt: z.string()
    }),
    "systemAlert": z.object({
      level: z.enum(["info", "warning", "error"]),
      message: z.string(),
      timestamp: z.string()
    })
  },
  requests: {
    "getUserProfile": {
      request: z.object({
        userId: z.string()
      }),
      response: z.object({
        userId: z.string(),
        name: z.string(),
        email: z.string().email(),
        createdAt: z.string(),
        updatedAt: z.string()
      })
    },
    "updateUserProfile": {
      request: z.object({
        userId: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional()
      }),
      response: z.object({
        success: z.boolean(),
        userId: z.string(),
        updatedAt: z.string()
      })
    }
  },
  errors: {
    "user_not_found": {
      code: "USER_NOT_FOUND",
      message: "User not found",
      severity: "error",
      retryable: false
    },
    "validation_error": {
      code: "VALIDATION_ERROR",
      message: "Validation error",
      severity: "warning",
      retryable: true
    }
  }
});

// Define the contract type
type SampleContract = typeof sampleContract;

// STEP 1: Create custom middleware

// Event tracking middleware
const eventTrackingMiddleware: EventMiddleware = async (event, next) => {
  console.log(`[EVENT TRACKING] Processing event: ${event.type}`, {
    timestamp: new Date().toISOString(),
    context: event.context
  });
  
  // Record the start time
  const startTime = Date.now();
  
  // Continue the middleware chain
  await next(event);
  
  // Calculate the processing time
  const processingTime = Date.now() - startTime;
  console.log(`[EVENT TRACKING] Event ${event.type} processed in ${processingTime}ms`);
  
  // In a real application, this would send metrics to a monitoring system
};

// Request metrics middleware
const requestMetricsMiddleware: RequestMiddleware = async (request, next) => {
  console.log(`[REQUEST METRICS] Processing request: ${request.type}`, {
    timestamp: new Date().toISOString(),
    context: request.context
  });
  
  // Record the start time
  const startTime = Date.now();
  
  // Continue the middleware chain
  const response = await next(request);
  
  // Calculate the processing time
  const processingTime = Date.now() - startTime;
  
  // Log metrics data
  console.log(`[REQUEST METRICS] Request ${request.type} processed in ${processingTime}ms`, {
    success: response.success,
    error: response.error ? response.error.code : undefined
  });
  
  // Return the response from the next middleware
  return response;
};

// STEP 2: Set up configuration system

// Create an in-memory configuration source with default settings
const defaultConfig: MessagingConfig<SampleContract> = {
  transport: {
    type: "in-memory"
  },
  client: {
    options: {
      clientId: "example-client",
      clientType: "example",
      autoReconnect: true
    }
  },
  server: {
    contract: sampleContract,
    options: {
      serverId: "example-server",
      version: "1.0.0"
    }
  },
  middleware: {
    type: "default",
    options: {
      validation: true,
      logging: true,
      authentication: {
        enabled: true,
        excludedRequests: ["getPublicData"]
      },
      custom: {
        eventMiddlewares: [
          {
            name: "eventTracking",
            global: true
          }
        ],
        requestMiddlewares: [
          {
            name: "requestMetrics",
            global: true
          }
        ]
      }
    }
  },
  observability: {
    type: "default",
    options: {
      defaultLogLevel: LogLevel.DEBUG
    }
  }
};

// Create an environment configuration source (for production environment)
// In a real application, this would load variables from process.env
const envSource = new EnvironmentConfigurationSource("env");

// Register the configuration sources
const memorySource = new MemoryConfigurationSource("default", defaultConfig);
ConfigurationRegistry.registerSource(memorySource);
ConfigurationRegistry.registerSource(envSource);

// STEP 3: Register custom middleware
const middlewareProvider = new DefaultMiddlewareProvider();
middlewareProvider.registerEventMiddleware("eventTracking", eventTrackingMiddleware);
middlewareProvider.registerRequestMiddleware("requestMetrics", requestMetricsMiddleware);

// Register the middleware provider
MiddlewareRegistry.registerMiddlewareProvider("custom", middlewareProvider);

// Main function to run the example
async function runExample() {
  try {
    console.log("Starting configuration and middleware example...");
    
    // Create configuration provider using multiple sources
    const configProvider = await ConfigurationRegistry.createProvider(
      "default", ["default", "env"]
    );
    
    // Get the complete configuration
    const config = configProvider.getAll() as MessagingConfig<SampleContract>;
    
    // Set up observability
    const observability = ObservabilityProviderRegistry.createObservabilityProvider(
      config.observability || { type: "default" }
    );
    
    // Create transport
    const transport = TransportProvider.createTransport<SampleContract>(config.transport);
    
    // Create middleware manager
    const middlewareManager = MiddlewareRegistry.createMiddlewareManager(
      config.middleware || { type: "default" },
      sampleContract
    );
    
    // Create client
    const client = ClientProvider.createClient<SampleContract>("default", {
      transport,
      options: config.client?.options
    });
    
    // Create server
    const server = ServerProvider.createServer<SampleContract>("default", {
      transport,
      contract: sampleContract,
      options: config.server?.options
    });
    
    // Set up middleware for server
    server.handleRequest("getUserProfile", async (payload, context, clientId) => {
      const { userId } = payload;
      
      // Process the request through middleware chain
      const processedRequest = await middlewareManager.processRequest({
        type: "getUserProfile",
        payload,
        context
      });
      
      // Check if middleware chain rejected the request
      if (!processedRequest.success) {
        return processedRequest;
      }
      
      // Simulate getting user data
      if (userId === "123") {
        return {
          userId: "123",
          name: "John Doe",
          email: "john@example.com",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z"
        };
      }
      
      // User not found
      return {
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      };
    });
    
    // Start the server
    await server.start("example-server");
    
    // Connect the client
    await client.connect("example-server");
    
    // Process an event through middleware
    await middlewareManager.processEvent({
      type: "userUpdated",
      payload: {
        userId: "123",
        name: "John Smith",
        email: "john@example.com",
        updatedAt: new Date().toISOString()
      },
      context: {
        id: "event-1",
        timestamp: Date.now(),
        source: "example-client"
      }
    });
    
    // Make a request from the client
    const response = await client.request("getUserProfile", {
      userId: "123"
    });
    
    console.log("User profile response:", response);
    
    // Make a request for a non-existent user (to test error handling)
    try {
      const errorResponse = await client.request("getUserProfile", {
        userId: "456"
      });
      
      console.log("Non-existent user response:", errorResponse);
    } catch (error) {
      console.error("Error requesting non-existent user:", error);
    }
    
    // Clean up
    await client.disconnect();
    await server.stop();
    
    console.log("Example completed successfully!");
  } catch (error) {
    console.error("Error in example:", error);
  }
}

// Run the example (commented out since this is just for demonstration)
// runExample();