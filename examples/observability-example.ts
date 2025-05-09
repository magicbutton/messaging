import { Client, Server, InMemoryTransport } from "../"
import * as z from "zod"
import { createContract, createEventMap, createRequestSchemaMap } from "../utils"
import {
  LogLevel,
  DefaultObservabilityProvider,
  setObservabilityProvider,
  createTracedContext,
  logEvent,
  logRequest,
  logResponse
} from "../observability"

// First, set up the observability provider with desired log level
const observabilityProvider = new DefaultObservabilityProvider(LogLevel.DEBUG)
setObservabilityProvider(observabilityProvider)

// Get loggers for different components
const mainLogger = observabilityProvider.getLogger("main")
const metricsLogger = observabilityProvider.getLogger("metrics")

// Create a contract for our service
const chatServiceContract = createContract({
  events: createEventMap({
    "chat.messageReceived": z.object({
      messageId: z.string(),
      roomId: z.string(),
      senderId: z.string(),
      content: z.string(),
      timestamp: z.number()
    }),
    "chat.userJoined": z.object({
      userId: z.string(),
      roomId: z.string(),
      timestamp: z.number()
    })
  }),
  requests: createRequestSchemaMap({
    "chat.sendMessage": {
      requestSchema: z.object({
        roomId: z.string(),
        content: z.string()
      }),
      responseSchema: z.object({
        success: z.boolean(),
        messageId: z.string().optional(),
        timestamp: z.number().optional(),
        error: z.object({
          code: z.string(),
          message: z.string()
        }).optional()
      })
    }
  })
})

async function demonstrateObservability() {
  mainLogger.info("Starting observability example")
  
  // Set up server and client
  const transport = new InMemoryTransport()
  const server = new Server(transport)
  const client = new Client(transport)
  
  // Start the server
  await server.start("memory://chat-service")
  mainLogger.info("Server started")
  
  // Connect the client
  await client.connect("memory://chat-service")
  mainLogger.info("Client connected")
  
  // Register a request handler on the server
  server.handleRequest("chat.sendMessage", async (payload, context, clientId) => {
    // Create a traced context for this operation
    const tracedContext = createTracedContext(context, "chat.sendMessage.handler")
    
    // Log the request with tracing information
    logRequest({
      type: "chat.sendMessage",
      payload,
      context: tracedContext
    })
    
    const startTime = Date.now()
    
    try {
      // Process the message
      const messageId = `msg-${Math.random().toString(36).substring(2, 10)}`
      const timestamp = Date.now()
      
      // Emit an event with the same trace context
      await server.emit("chat.messageReceived", {
        messageId,
        roomId: payload.roomId,
        senderId: clientId,
        content: payload.content,
        timestamp
      }, tracedContext)
      
      // Create response
      const response = {
        success: true,
        messageId,
        timestamp
      }
      
      // Log the response with timing
      logResponse("chat.sendMessage", {
        success: true,
        data: response,
        context: tracedContext
      }, startTime)
      
      return response
    } catch (error) {
      // Handle errors with proper logging
      const errorResponse = {
        success: false,
        error: {
          code: "processing_error",
          message: error instanceof Error ? error.message : String(error)
        }
      }
      
      // Log error response
      logResponse("chat.sendMessage", {
        success: false,
        error: errorResponse.error,
        context: tracedContext
      }, startTime)
      
      return errorResponse
    }
  })
  
  // Subscribe to events on the client
  client.on("chat.messageReceived", (payload, context) => {
    logEvent({
      type: "chat.messageReceived",
      payload,
      context
    })
    
    mainLogger.info("Received chat message", { messageId: payload.messageId, content: payload.content })
  })
  
  // Send a message from the client
  try {
    // Create a traced context for the request
    const requestContext = createTracedContext({}, "chat.sendMessage.request")
    
    mainLogger.info("Sending chat message")
    
    // Send the request with tracing
    const response = await client.request("chat.sendMessage", {
      roomId: "room-123",
      content: "Hello, world!"
    }, requestContext)
    
    mainLogger.info("Message sent successfully", { messageId: response.messageId })
  } catch (error) {
    mainLogger.error("Error sending message", error instanceof Error ? error : new Error(String(error)))
  }
  
  // Demonstrate metrics
  const metrics = observabilityProvider.getMetrics()
  metrics.increment("example.completed", 1)
  metricsLogger.info("Example completed")
  
  // Clean up
  await client.disconnect()
  await server.stop()
  mainLogger.info("Example finished")
}

// Run the example
demonstrateObservability().catch(error => {
  console.error("Example failed:", error)
})