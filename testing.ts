import { InMemoryTransport } from "./in-memory-transport"
import { MessagingClient } from "./client"
import { MessagingServer } from "./server"
import type { Transport, MessageContext, EventPayload, RequestPayload, ResponsePayload } from "./types"
import { createMessageContext } from "./utils"
import { getObservabilityProvider } from "./observability"

/**
 * Event capture callback function
 */
export type EventCaptureCallback<T = any> = (
  eventType: string,
  payload: T, 
  context: MessageContext
) => void

/**
 * Request capture callback function
 */
export type RequestCaptureCallback<TReq = any, TRes = any> = (
  requestType: string,
  payload: TReq,
  response: ResponsePayload<TRes>,
  context: MessageContext
) => void

/**
 * Options for MockTransport
 */
export interface MockTransportOptions {
  /**
   * Whether to log events and requests
   */
  debug?: boolean
  
  /**
   * Fixed delay for all operations in milliseconds
   */
  delayMs?: number
  
  /**
   * Randomly fail operations with the given probability (0-1)
   */
  failureRate?: number
}

/**
 * MockTransport for testing messaging without a real transport
 * Captures events and requests for inspection in tests
 */
export class MockTransport<TEvents extends Record<string, any> = {}, TRequests extends Record<string, any> = {}>
  implements Transport<any>
{
  private connected = false
  private connectionString = ""
  private options: Required<MockTransportOptions>
  private logger = getObservabilityProvider().getLogger("mock-transport")
  
  // Handlers registered by clients/servers
  private eventHandlers: Map<string, Set<(payload: any, context: MessageContext) => void>> = new Map()
  private requestHandlers: Map<string, (payload: any, context: MessageContext) => Promise<any>> = new Map()
  
  // Capture callbacks for testing
  private eventCaptures: Set<EventCaptureCallback> = new Set()
  private requestCaptures: Set<RequestCaptureCallback> = new Set()
  
  // History for assertions
  private eventHistory: Array<{type: string, payload: any, context: MessageContext}> = []
  private requestHistory: Array<{type: string, payload: any, response: any, context: MessageContext}> = []
  
  constructor(options: MockTransportOptions = {}) {
    this.options = {
      debug: options.debug ?? false,
      delayMs: options.delayMs ?? 0,
      failureRate: options.failureRate ?? 0
    }
  }
  
  /**
   * Connect to the mock transport
   */
  async connect(connectionString: string): Promise<void> {
    await this.simulateDelay()
    this.simulateFailure("connect")
    
    this.connectionString = connectionString
    this.connected = true
    
    if (this.options.debug) {
      this.logger.info(`MockTransport connected to ${connectionString}`)
    }
  }
  
  /**
   * Disconnect from the mock transport
   */
  async disconnect(): Promise<void> {
    await this.simulateDelay()
    this.simulateFailure("disconnect")
    
    this.connected = false
    
    if (this.options.debug) {
      this.logger.info("MockTransport disconnected")
    }
  }
  
  /**
   * Get the connection string
   */
  getConnectionString(): string {
    return this.connectionString
  }
  
  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected
  }
  
  /**
   * Emit an event
   */
  async emit<E extends string & keyof TEvents>(
    event: E, 
    payload: any, 
    context: MessageContext = {}
  ): Promise<void> {
    await this.simulateDelay()
    this.simulateFailure(`emit:${event}`)
    
    if (!this.connected) {
      throw new Error("Not connected")
    }
    
    const handlers = this.eventHandlers.get(event)
    const fullContext: MessageContext = {
      ...createMessageContext(context),
      source: context.source || "mock-client",
    }
    
    // Capture for testing
    this.captureEvent(event, payload, fullContext)
    
    if (this.options.debug) {
      this.logger.debug(`Event emitted: ${String(event)}`, { payload, context: fullContext })
    }
    
    // Call handlers
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload, fullContext)
        } catch (error) {
          this.logger.error(`Error in event handler for ${String(event)}:`, 
            error instanceof Error ? error : new Error(String(error)))
        }
      }
    }
  }
  
  /**
   * Register an event handler
   */
  on<E extends string & keyof TEvents>(
    event: E,
    handler: (payload: any, context: MessageContext) => void,
    subscriptionContext?: MessageContext
  ): void {
    let handlers = this.eventHandlers.get(event)
    if (!handlers) {
      handlers = new Set()
      this.eventHandlers.set(event, handlers)
    }
    handlers.add(handler)
    
    if (this.options.debug) {
      this.logger.debug(`Event handler registered for ${String(event)}`)
    }
  }
  
  /**
   * Unregister an event handler
   */
  off<E extends string & keyof TEvents>(
    event: E, 
    handler: (payload: any, context: MessageContext) => void
  ): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.eventHandlers.delete(event)
      }
      
      if (this.options.debug) {
        this.logger.debug(`Event handler unregistered for ${String(event)}`)
      }
    }
  }
  
  /**
   * Send a request
   */
  async request<R extends string & keyof TRequests>(
    requestType: R,
    payload: any,
    context: MessageContext = {}
  ): Promise<any> {
    await this.simulateDelay()
    this.simulateFailure(`request:${requestType}`)
    
    if (!this.connected) {
      throw new Error("Not connected")
    }
    
    const handler = this.requestHandlers.get(requestType)
    if (!handler) {
      throw new Error(`No handler registered for request type ${String(requestType)}`)
    }
    
    const fullContext: MessageContext = {
      ...createMessageContext(context),
      source: context.source || "mock-client"
    }
    
    if (this.options.debug) {
      this.logger.debug(`Request sent: ${String(requestType)}`, { payload, context: fullContext })
    }
    
    try {
      const response = await handler(payload, fullContext)
      
      // Capture for testing
      this.captureRequest(requestType, payload, response, fullContext)
      
      if (this.options.debug) {
        this.logger.debug(`Response received for ${String(requestType)}`, { response })
      }
      
      return response
    } catch (error) {
      if (this.options.debug) {
        this.logger.error(`Error in request handler for ${String(requestType)}:`, 
          error instanceof Error ? error : new Error(String(error)))
      }
      throw error
    }
  }
  
  /**
   * Register a request handler
   */
  handleRequest<R extends string & keyof TRequests>(
    requestType: R,
    handler: (payload: any, context: MessageContext) => Promise<any>
  ): void {
    this.requestHandlers.set(requestType, handler)
    
    if (this.options.debug) {
      this.logger.debug(`Request handler registered for ${String(requestType)}`)
    }
  }
  
  /**
   * Login to the mock transport (always succeeds)
   */
  async login(credentials: { username: string; password: string } | { token: string }): Promise<any> {
    await this.simulateDelay()
    this.simulateFailure("login")
    
    if (!this.connected) {
      throw new Error("Not connected")
    }
    
    if (this.options.debug) {
      this.logger.debug("Login succeeded", { 
        credentials: "token" in credentials ? { token: "***" } : { username: credentials.username }
      })
    }
    
    // Mock successful login
    return {
      success: true,
      token: "mock-token-" + Math.random().toString(36).substring(2),
      expiresAt: Date.now() + 3600 * 1000,
      user: {
        id: "mock-user-" + Math.random().toString(36).substring(2),
        username: "token" in credentials ? "token-user" : credentials.username
      }
    }
  }
  
  /**
   * Logout from the mock transport
   */
  async logout(): Promise<void> {
    await this.simulateDelay()
    this.simulateFailure("logout")
    
    if (this.options.debug) {
      this.logger.debug("Logged out")
    }
  }
  
  /**
   * Register a callback to capture events for testing
   */
  onEvent<T = any>(callback: EventCaptureCallback<T>): () => void {
    this.eventCaptures.add(callback as EventCaptureCallback)
    return () => {
      this.eventCaptures.delete(callback as EventCaptureCallback)
    }
  }
  
  /**
   * Register a callback to capture requests for testing
   */
  onRequest<TReq = any, TRes = any>(callback: RequestCaptureCallback<TReq, TRes>): () => void {
    this.requestCaptures.add(callback as RequestCaptureCallback)
    return () => {
      this.requestCaptures.delete(callback as RequestCaptureCallback)
    }
  }
  
  /**
   * Get event history for assertions
   */
  getEventHistory<T = any>(eventType?: string): Array<{type: string, payload: T, context: MessageContext}> {
    if (eventType) {
      return this.eventHistory.filter(event => event.type === eventType) as any
    }
    return this.eventHistory as any
  }
  
  /**
   * Get request history for assertions
   */
  getRequestHistory<TReq = any, TRes = any>(
    requestType?: string
  ): Array<{type: string, payload: TReq, response: ResponsePayload<TRes>, context: MessageContext}> {
    if (requestType) {
      return this.requestHistory.filter(request => request.type === requestType) as any
    }
    return this.requestHistory as any
  }
  
  /**
   * Clear all history
   */
  clearHistory(): void {
    this.eventHistory = []
    this.requestHistory = []
  }
  
  /**
   * Capture an event for testing
   */
  private captureEvent(type: string, payload: any, context: MessageContext): void {
    // Save to history
    this.eventHistory.push({ type, payload, context })
    
    // Notify callbacks
    for (const callback of this.eventCaptures) {
      try {
        callback(type, payload, context)
      } catch (error) {
        this.logger.error("Error in event capture callback:", 
          error instanceof Error ? error : new Error(String(error)))
      }
    }
  }
  
  /**
   * Capture a request for testing
   */
  private captureRequest(type: string, payload: any, response: any, context: MessageContext): void {
    // Save to history
    this.requestHistory.push({ type, payload, response, context })
    
    // Notify callbacks
    for (const callback of this.requestCaptures) {
      try {
        callback(type, payload, response, context)
      } catch (error) {
        this.logger.error("Error in request capture callback:",
          error instanceof Error ? error : new Error(String(error)))
      }
    }
  }
  
  /**
   * Simulate a delay for the mock transport
   */
  private async simulateDelay(): Promise<void> {
    if (this.options.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.options.delayMs))
    }
  }
  
  /**
   * Simulate a failure for the mock transport
   */
  private simulateFailure(operation: string): void {
    if (this.options.failureRate > 0 && Math.random() < this.options.failureRate) {
      throw new Error(`Simulated failure in operation: ${operation}`)
    }
  }
}

/**
 * Options for creating a test messaging environment
 */
export interface TestMessagingOptions {
  /**
   * Transport to use (defaults to MockTransport)
   */
  transport?: Transport<any>
  
  /**
   * Server options
   */
  serverOptions?: {
    /**
     * Server ID (defaults to "test-server")
     */
    serverId?: string
    
    /**
     * Server capabilities
     */
    capabilities?: string[]
    
    /**
     * Whether to auto-start the server (defaults to true)
     */
    autoStart?: boolean
    
    /**
     * Connection string to use (defaults to "memory://test-messaging")
     */
    connectionString?: string
  }
  
  /**
   * Client options
   */
  clientOptions?: {
    /**
     * Client ID (defaults to "test-client")
     */
    clientId?: string
    
    /**
     * Client type (defaults to "test")
     */
    clientType?: string
    
    /**
     * Client capabilities
     */
    capabilities?: string[]
    
    /**
     * Whether to auto-connect the client (defaults to true)
     */
    autoConnect?: boolean
  }
}

/**
 * Test messaging environment for testing clients and servers
 */
export class TestMessaging<TEvents extends Record<string, any> = {}, TRequests extends Record<string, any> = {}> {
  /**
   * The mock transport adapter
   */
  readonly transport: Transport<any>

  /**
   * The server instance
   */
  readonly server: MessagingServer<any>

  /**
   * The client instance
   */
  readonly client: MessagingClient<any>
  
  /**
   * The connection string
   */
  readonly connectionString: string
  
  constructor(options: TestMessagingOptions = {}) {
    const serverOpts = options.serverOptions || {}
    const clientOpts = options.clientOptions || {}
    
    // Create or use provided transport
    this.transport = options.transport || new MockTransport<TEvents, TRequests>()
    
    // Create server
    this.server = new MessagingServer<any>(this.transport, {
      serverId: serverOpts.serverId || "test-server",
      capabilities: serverOpts.capabilities,
      heartbeatInterval: 1000, // More frequent for tests
      clientTimeout: 3000
    })

    // Create client
    this.client = new MessagingClient<any>(this.transport, {
      clientId: clientOpts.clientId || "test-client",
      clientType: clientOpts.clientType || "test",
      capabilities: clientOpts.capabilities,
      heartbeatInterval: 1000, // More frequent for tests
      reconnectInterval: 1000
    })
    
    // Set connection string
    this.connectionString = serverOpts.connectionString || "memory://test-messaging"
    
    // Auto-start server if requested
    if (serverOpts.autoStart !== false) {
      // We can't await this in a constructor, so we execute and ignore
      this.server.start(this.connectionString).catch(error => {
        console.error("Error auto-starting server:", error)
      })
    }
    
    // Auto-connect client if requested
    if (clientOpts.autoConnect !== false) {
      // Add a small delay to ensure server is started
      setTimeout(() => {
        this.client.connect(this.connectionString).catch(error => {
          console.error("Error auto-connecting client:", error)
        })
      }, 100)
    }
  }
  
  /**
   * Get the mock transport as the correct type
   */
  getMockTransport(): MockTransport<TEvents, TRequests> {
    if (this.transport instanceof MockTransport) {
      return this.transport
    }
    throw new Error("Transport is not a MockTransport")
  }
  
  /**
   * Register a request handler on the server with simplified API
   */
  handleRequest<R extends string & keyof TRequests>(
    type: R, 
    handler: (data: any, clientId: string) => Promise<any> | any
  ): void {
    this.server.handleRequest(type, async (payload, context, clientId) => {
      return handler(payload, clientId)
    })
  }
  
  /**
   * Wait for events of a specific type to be emitted
   */
  async waitForEvent<T = any>(
    eventType: string, 
    count = 1, 
    timeoutMs = 5000
  ): Promise<Array<{type: string, payload: T, context: MessageContext}>> {
    if (!(this.transport instanceof MockTransport)) {
      throw new Error("Transport must be a MockTransport to wait for events")
    }
    
    return new Promise((resolve, reject) => {
      const events: Array<{type: string, payload: T, context: MessageContext}> = []
      const mockTransport = this.transport as MockTransport
      
      // Get existing events
      const existingEvents = mockTransport.getEventHistory<T>(eventType)
      events.push(...existingEvents)
      
      if (events.length >= count) {
        resolve(events.slice(0, count))
        return
      }
      
      // Set up timeout
      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error(`Timed out waiting for ${count} events of type ${eventType}`))
      }, timeoutMs)
      
      // Set up listener for new events
      const removeListener = mockTransport.onEvent<T>((type, payload, context) => {
        if (type === eventType) {
          events.push({ type, payload, context })
          
          if (events.length >= count) {
            cleanup()
            resolve(events.slice(0, count))
          }
        }
      })
      
      // Cleanup function
      const cleanup = () => {
        clearTimeout(timeout)
        removeListener()
      }
    })
  }
  
  /**
   * Wait for a specific request to be made
   */
  async waitForRequest<TReq = any, TRes = any>(
    requestType: string,
    count = 1,
    timeoutMs = 5000
  ): Promise<Array<{type: string, payload: TReq, response: ResponsePayload<TRes>, context: MessageContext}>> {
    if (!(this.transport instanceof MockTransport)) {
      throw new Error("Transport must be a MockTransport to wait for requests")
    }
    
    return new Promise((resolve, reject) => {
      const requests: Array<{
        type: string, 
        payload: TReq, 
        response: ResponsePayload<TRes>, 
        context: MessageContext
      }> = []
      
      const mockTransport = this.transport as MockTransport
      
      // Get existing requests
      const existingRequests = mockTransport.getRequestHistory<TReq, TRes>(requestType)
      requests.push(...existingRequests)
      
      if (requests.length >= count) {
        resolve(requests.slice(0, count))
        return
      }
      
      // Set up timeout
      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error(`Timed out waiting for ${count} requests of type ${requestType}`))
      }, timeoutMs)
      
      // Set up listener for new requests
      const removeListener = mockTransport.onRequest<TReq, TRes>((type, payload, response, context) => {
        if (type === requestType) {
          requests.push({ type, payload, response, context })
          
          if (requests.length >= count) {
            cleanup()
            resolve(requests.slice(0, count))
          }
        }
      })
      
      // Cleanup function
      const cleanup = () => {
        clearTimeout(timeout)
        removeListener()
      }
    })
  }
  
  /**
   * Clean up the test environment
   */
  async cleanup(): Promise<void> {
    try {
      if (this.client.isConnected()) {
        await this.client.disconnect()
      }
      await this.server.stop()
      
      if (this.transport instanceof MockTransport) {
        this.transport.clearHistory()
      }
    } catch (error) {
      console.error("Error cleaning up test environment:", error)
    }
  }
}