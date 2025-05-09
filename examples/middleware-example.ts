import { Client, Server, InMemoryTransport } from "../"
import * as z from "zod"
import { createContract, createEventMap, createRequestSchemaMap } from "../utils"
import { LogLevel, DefaultObservabilityProvider, setObservabilityProvider } from "../observability"
import {
  MiddlewareManager,
  createEventValidationMiddleware,
  createRequestValidationMiddleware,
  createEventLoggingMiddleware,
  createRequestLoggingMiddleware,
  createAuthenticationMiddleware
} from "../middleware"
import type { MessageContext } from "../types"

// Set up the observability provider with desired log level
const observabilityProvider = new DefaultObservabilityProvider(LogLevel.DEBUG)
setObservabilityProvider(observabilityProvider)

// Get logger for this example
const logger = observabilityProvider.getLogger("middleware-example")

// Create a contract for our service
const userServiceContract = createContract({
  events: createEventMap({
    "user.created": z.object({
      id: z.string(),
      username: z.string().min(3),
      email: z.string().email(),
      createdAt: z.number()
    }),
    "user.updated": z.object({
      id: z.string(),
      changes: z.record(z.string(), z.unknown()),
      updatedAt: z.number()
    })
  }),
  requests: createRequestSchemaMap({
    "user.create": {
      requestSchema: z.object({
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(8)
      }),
      responseSchema: z.object({
        success: z.boolean(),
        userId: z.string().optional(),
        createdAt: z.number().optional(),
        error: z.object({
          code: z.string(),
          message: z.string()
        }).optional()
      })
    },
    "user.getProfile": {
      requestSchema: z.object({
        userId: z.string()
      }),
      responseSchema: z.object({
        success: z.boolean(),
        user: z.object({
          id: z.string(),
          username: z.string(),
          email: z.string().email(),
          createdAt: z.number()
        }).optional(),
        error: z.object({
          code: z.string(),
          message: z.string()
        }).optional()
      })
    }
  })
})

// Simulate a simple in-memory user store
const users: Record<string, {
  id: string,
  username: string,
  email: string,
  password: string,
  createdAt: number
}> = {}

// Simple authentication function that checks for a token
function isAuthenticated(context: MessageContext): boolean {
  if (!context.auth?.token) {
    return false
  }
  
  // In a real system, you'd validate the token properly
  // This is just for demonstration purposes
  return context.auth.token === "valid-token"
}

async function demonstrateMiddleware() {
  logger.info("Starting middleware example")
  
  // Create middleware manager
  const middlewareManager = new MiddlewareManager()
  
  // Add validation middleware
  middlewareManager.useGlobalEventMiddleware(
    createEventValidationMiddleware(userServiceContract.events)
  )
  middlewareManager.useGlobalRequestMiddleware(
    createRequestValidationMiddleware(userServiceContract.requests)
  )
  
  // Add logging middleware
  middlewareManager.useGlobalEventMiddleware(createEventLoggingMiddleware())
  middlewareManager.useGlobalRequestMiddleware(createRequestLoggingMiddleware())
  
  // Add authentication middleware for protected requests
  // Exclude user.create since that's how users register
  middlewareManager.useGlobalRequestMiddleware(
    createAuthenticationMiddleware(isAuthenticated, {
      exclude: ["user.create"]
    })
  )
  
  // Add custom middleware for specific event
  middlewareManager.useEventMiddleware("user.created", async (event, next) => {
    logger.info(`Custom middleware for user.created event`, { userId: event.payload.id })
    
    // You can modify the event before passing it to the next middleware
    const enhancedEvent = {
      ...event,
      payload: {
        ...event.payload,
        // Add additional field
        welcomeMessage: `Welcome to our platform, ${event.payload.username}!`
      }
    }
    
    await next(enhancedEvent)
  })
  
  // Set up server and client
  const transport = new InMemoryTransport()
  const server = new Server(transport)
  const client = new Client(transport)
  
  // Start the server
  await server.start("memory://user-service")
  logger.info("Server started")
  
  // Connect the client
  await client.connect("memory://user-service")
  logger.info("Client connected")
  
  // Register request handlers on the server
  server.handleRequest("user.create", async (payload, context) => {
    // Apply middleware
    const result = await middlewareManager.processRequest({
      type: "user.create",
      payload,
      context
    })
    
    // If middleware validation failed, return the error
    if (!result.success) {
      return result
    }
    
    // Process the validated request
    const userId = `user-${Math.random().toString(36).substring(2, 10)}`
    const createdAt = Date.now()
    
    // Store the user
    users[userId] = {
      id: userId,
      username: payload.username,
      email: payload.email,
      password: payload.password,
      createdAt
    }
    
    // Emit user.created event through middleware
    await middlewareManager.processEvent({
      type: "user.created",
      payload: {
        id: userId,
        username: payload.username,
        email: payload.email,
        createdAt
      },
      context
    })
    
    // Return success response
    return {
      success: true,
      userId,
      createdAt
    }
  })
  
  server.handleRequest("user.getProfile", async (payload, context) => {
    // Apply middleware
    const result = await middlewareManager.processRequest({
      type: "user.getProfile",
      payload,
      context
    })
    
    // If middleware validation or authentication failed, return the error
    if (!result.success) {
      return result
    }
    
    // Get user by ID
    const user = users[payload.userId]
    
    if (!user) {
      return {
        success: false,
        error: {
          code: "user_not_found",
          message: `User with ID ${payload.userId} not found`
        }
      }
    }
    
    // Return user profile (excluding password)
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    }
  })
  
  // Subscribe to events on the client
  client.on("user.created", (payload, context) => {
    logger.info("User created event received", { 
      userId: payload.id,
      username: payload.username,
      welcomeMessage: (payload as any).welcomeMessage // Added by custom middleware
    })
  })
  
  // Scenario 1: Create user (should succeed)
  try {
    logger.info("Scenario 1: Creating a valid user")
    
    const createResponse = await client.request("user.create", {
      username: "johndoe",
      email: "john@example.com",
      password: "password123"
    })
    
    logger.info("User created successfully", { userId: createResponse.userId })
    
    // Remember the user ID for the next scenario
    const userId = createResponse.userId
    
    // Scenario 2: Get user profile without authentication (should fail)
    logger.info("Scenario 2: Getting user profile without authentication")
    
    try {
      await client.request("user.getProfile", {
        userId
      })
    } catch (error) {
      logger.info("Authentication failed as expected", {
        error: error instanceof Error ? error.message : String(error)
      })
    }
    
    // Scenario 3: Get user profile with authentication (should succeed)
    logger.info("Scenario 3: Getting user profile with authentication")
    
    const getProfileResponse = await client.request("user.getProfile", {
      userId
    }, {
      auth: {
        token: "valid-token"
      }
    })
    
    logger.info("User profile retrieved successfully", { 
      username: getProfileResponse.user?.username,
      email: getProfileResponse.user?.email
    })
    
    // Scenario 4: Create user with invalid data (should fail validation)
    logger.info("Scenario 4: Creating a user with invalid data")
    
    try {
      await client.request("user.create", {
        username: "jo", // Too short
        email: "not-an-email",
        password: "short"
      })
    } catch (error) {
      logger.info("Validation failed as expected", {
        error: error instanceof Error ? error.message : String(error)
      })
    }
    
  } catch (error) {
    logger.error("Example failed", error instanceof Error ? error : new Error(String(error)))
  }
  
  // Clean up
  await client.disconnect()
  await server.stop()
  logger.info("Example finished")
}

// Run the example
demonstrateMiddleware().catch(error => {
  console.error("Example failed:", error)
})