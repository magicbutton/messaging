import { TestMessaging, MockTransport } from "../testing"
import * as z from "zod"
import { createContract, createEventMap, createRequestSchemaMap } from "../utils"
import { LogLevel, DefaultObservabilityProvider, setObservabilityProvider } from "../observability"

// Set up logging
const observabilityProvider = new DefaultObservabilityProvider(LogLevel.DEBUG)
setObservabilityProvider(observabilityProvider)
const logger = observabilityProvider.getLogger("testing-example")

// Define a contract for our test service
const chatContract = createContract({
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

// Run the test scenario
async function runTestingExample() {
  logger.info("Starting testing example")
  
  // Create a mock transport with some artificial delay
  const mockTransport = new MockTransport({
    debug: true,
    delayMs: 50 // 50ms delay to simulate network latency
  })
  
  // Create the test environment
  const testEnv = new TestMessaging({
    transport: mockTransport,
    serverOptions: {
      serverId: "test-chat-server",
      capabilities: ["chat"]
    },
    clientOptions: {
      clientId: "test-chat-client",
      clientType: "web",
      capabilities: ["chat"]
    }
  })
  
  try {
    // Register request handler on the server
    testEnv.handleRequest("chat.sendMessage", async (data, clientId) => {
      logger.info(`Received message from client ${clientId}`, { data })
      
      // Create a response
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2)}`
      const timestamp = Date.now()
      
      // Emit an event
      await testEnv.server.emit("chat.messageReceived", {
        messageId,
        roomId: data.roomId,
        senderId: clientId,
        content: data.content,
        timestamp
      })
      
      // Return the response
      return {
        success: true,
        messageId,
        timestamp
      }
    })
    
    // Wait for server and client to be ready
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Subscribe to events on the client
    testEnv.client.on("chat.messageReceived", (payload, context) => {
      logger.info("Received chat message event", { messageId: payload.messageId, content: payload.content })
    })
    
    // Test 1: Send a message and wait for the response
    logger.info("Test 1: Sending a chat message")
    
    const response = await testEnv.client.request("chat.sendMessage", {
      roomId: "test-room",
      content: "Hello, World!"
    })
    
    logger.info("Got response", { messageId: response.messageId })
    
    // Test 2: Verify events were emitted correctly
    logger.info("Test 2: Verifying message event was emitted")
    
    const events = await testEnv.waitForEvent("chat.messageReceived")
    logger.info("Verified event was emitted", { 
      eventCount: events.length,
      messageId: events[0].payload.messageId
    })
    
    // Test 3: Verify request was captured correctly
    logger.info("Test 3: Verifying request was captured")
    
    const requests = testEnv.getMockTransport().getRequestHistory("chat.sendMessage")
    logger.info("Verified request was captured", { 
      requestCount: requests.length,
      content: requests[0].payload.content
    })
    
    // Test 4: Non-blocking wait for events
    logger.info("Test 4: Testing non-blocking wait for events")
    
    // Start waiting for an event that will occur in the future
    const eventPromise = testEnv.waitForEvent("chat.userJoined")
    
    // Emit the event after a delay
    setTimeout(async () => {
      await testEnv.server.emit("chat.userJoined", {
        userId: "user-123",
        roomId: "test-room",
        timestamp: Date.now()
      })
    }, 100)
    
    // Wait for the event
    const userEvents = await eventPromise
    logger.info("Caught user joined event", {
      userId: userEvents[0].payload.userId
    })
    
    logger.info("All tests completed successfully")
  } finally {
    // Clean up
    await testEnv.cleanup()
  }
}

// Run the example
runTestingExample().catch(error => {
  console.error("Testing example failed:", error)
})