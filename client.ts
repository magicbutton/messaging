import { v4 as uuidv4 } from "uuid"
import {
  Transport,
  Contract,
  ClientOptions,
  MessageContext,
  AuthResult,
  ClientStatus,
  InferEventData,
  InferRequestData,
  InferResponseData,
  AuthProvider
} from "./types"
import { AuthProviderRegistry } from "./auth-provider-factory"

/**
 * Generic messaging client that works with any contract and transport through dependency injection
 */
export class MessagingClient<TContract extends Contract> {
  private transport: Transport<TContract>
  private options: Required<ClientOptions>
  private status: ClientStatus = ClientStatus.DISCONNECTED
  private connectionId: string | null = null
  private serverId: string | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private lastHeartbeat = 0
  private subscriptions: Map<string, { events: string[]; filter?: Record<string, unknown> }> = new Map()
  private statusListeners: Set<(status: ClientStatus) => void> = new Set()
  private errorListeners: Set<(error: Error) => void> = new Set()
  private authProvider: AuthProvider
  private authToken?: string

  /**
   * Creates a new messaging client instance with dependency injection
   * 
   * @param transport - The transport implementation to use for communication
   * @param options - Configuration options for the client
   */
  constructor(
    transport: Transport<TContract>,
    options: ClientOptions = {}
  ) {
    this.transport = transport
    this.options = {
      clientId: options.clientId || uuidv4(),
      clientType: options.clientType || "generic",
      autoReconnect: options.autoReconnect !== false,
      reconnect: options.reconnect !== false,
      reconnectInterval: options.reconnectInterval || 5000,
      heartbeatInterval: options.heartbeatInterval || 30000,
      capabilities: options.capabilities || [],
      metadata: options.metadata || {},
      authProvider: options.authProvider || this.createDefaultAuthProvider(),
      debug: options.debug || false
    }

    // Set up authentication provider
    this.authProvider = this.options.authProvider

    // Set up system event handlers
    this.setupSystemEventHandlers()
  }

  /**
   * Set up system event handlers
   */
  private setupSystemEventHandlers(): void {
    // Handle heartbeat events
    this.transport.on("$heartbeat" as any, (payload) => {
      this.lastHeartbeat = payload.timestamp
    })

    // Handle broadcast events
    this.transport.on("$broadcast" as any, (payload, context) => {
      console.log(`Broadcast received: ${payload.message}`, payload.data)
    })

    // Handle error events
    this.transport.on("$error" as any, (payload) => {
      const error = new Error(payload.message)
      error.name = payload.code
      this.notifyErrorListeners(error)
    })
  }

  /**
   * Connects the client to a messaging server using the provided connection string.
   */
  async connect(connectionString: string): Promise<void> {
    try {
      this.setStatus(ClientStatus.CONNECTING)

      // Connect the transport
      await this.transport.connect(connectionString)

      // Register with the server
      const response = await this.transport.request("$register" as any, {
        clientId: this.options.clientId,
        clientType: this.options.clientType,
        capabilities: this.options.capabilities,
        metadata: this.options.metadata,
      })

      // Store connection details
      this.connectionId = response.connectionId
      this.serverId = response.serverId
      this.setStatus(ClientStatus.CONNECTED)

      // Start heartbeat
      this.startHeartbeat()

      // Restore subscriptions if any
      await this.restoreSubscriptions()

      if (this.options.debug) {
        console.log(`Connected to server ${this.serverId} with connection ID ${this.connectionId}`)
      }
    } catch (error) {
      this.setStatus(ClientStatus.ERROR)
      this.notifyErrorListeners(error instanceof Error ? error : new Error(String(error)))

      // Attempt to reconnect if enabled
      if (this.options.autoReconnect || this.options.reconnect) {
        this.scheduleReconnect()
      }

      throw error
    }
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
    try {
      // Stop heartbeat and reconnect timers
      this.stopHeartbeat()
      this.stopReconnect()

      // Only unregister if we have a connection
      if (this.connectionId) {
        await this.transport.request("$unregister" as any, {
          clientId: this.options.clientId,
          connectionId: this.connectionId,
        })
      }

      // Disconnect the transport
      await this.transport.disconnect()

      // Reset connection state
      this.connectionId = null
      this.serverId = null
      this.setStatus(ClientStatus.DISCONNECTED)

      console.log("Disconnected from server")
    } catch (error) {
      this.notifyErrorListeners(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * Start the heartbeat timer
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat()
    }, this.options.heartbeatInterval)
  }

  /**
   * Stop the heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * Send a heartbeat to the server
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      await this.transport.emit("$heartbeat" as any, {
        timestamp: Date.now(),
        clientId: this.options.clientId,
      })
    } catch (error) {
      console.error("Error sending heartbeat:", error)

      // Check if we need to reconnect
      if (this.status === ClientStatus.CONNECTED) {
        this.setStatus(ClientStatus.ERROR)
        if (this.options.autoReconnect || this.options.reconnect) {
          this.scheduleReconnect()
        }
      }
    }
  }

  /**
   * Schedule a reconnect attempt
   */
  private scheduleReconnect(): void {
    this.stopReconnect()
    this.setStatus(ClientStatus.RECONNECTING)

    this.reconnectTimer = setTimeout(async () => {
      try {
        // Try to reconnect
        await this.connect(this.transport.getConnectionString())
      } catch (error) {
        // If reconnect fails, schedule another attempt
        this.scheduleReconnect()
      }
    }, this.options.reconnectInterval)
  }

  /**
   * Stop the reconnect timer
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * Restore subscriptions after reconnecting
   */
  private async restoreSubscriptions(): Promise<void> {
    for (const [subscriptionId, { events, filter }] of this.subscriptions.entries()) {
      try {
        await this.transport.request("$subscribe" as any, {
          clientId: this.options.clientId,
          events,
          filter,
        })
      } catch (error) {
        console.error(`Error restoring subscription ${subscriptionId}:`, error)
      }
    }
  }

  /**
   * Set the client status and notify listeners
   */
  private setStatus(status: ClientStatus): void {
    this.status = status
    this.notifyStatusListeners()
  }

  /**
   * Notify status listeners of a status change
   */
  private notifyStatusListeners(): void {
    for (const listener of this.statusListeners) {
      try {
        listener(this.status)
      } catch (error) {
        console.error("Error in status listener:", error)
      }
    }
  }

  /**
   * Notify error listeners of an error
   */
  private notifyErrorListeners(error: Error): void {
    for (const listener of this.errorListeners) {
      try {
        listener(error)
      } catch (listenerError) {
        console.error("Error in error listener:", listenerError)
      }
    }
  }

  /**
   * Subscribe to events
   * @param events The events to subscribe to
   * @param filter Optional filter for the events
   */
  async subscribe(events: string[], filter?: Record<string, unknown>): Promise<string> {
    const response = await this.transport.request("$subscribe" as any, {
      clientId: this.options.clientId,
      events,
      filter,
    })

    // Store the subscription
    this.subscriptions.set(response.subscriptionId, { events, filter })

    return response.subscriptionId
  }

  /**
   * Unsubscribe from events
   * @param subscriptionId The subscription ID to unsubscribe
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    await this.transport.request("$unsubscribe" as any, {
      clientId: this.options.clientId,
      subscriptionId,
    })

    // Remove the subscription
    this.subscriptions.delete(subscriptionId)
  }

  /**
   * Get server information
   */
  async getServerInfo(): Promise<any> {
    return this.transport.request("$serverInfo" as any, {})
  }

  /**
   * Ping the server
   * @param payload Optional payload to include in the ping
   */
  async ping(payload?: string): Promise<{ roundTripTime: number }> {
    const startTime = Date.now()
    const response = await this.transport.request("$ping" as any, {
      timestamp: startTime,
      payload,
    })

    return {
      roundTripTime: Date.now() - startTime,
    }
  }

  /**
   * Send a request to the server
   * @param requestType The request type
   * @param payload The request payload
   * @param context Optional message context
   */
  async request<R extends keyof TContract["requests"] & string>(
    requestType: R,
    payload: InferRequestData<TContract["requests"], R>,
    context?: MessageContext,
  ): Promise<InferResponseData<TContract["requests"], R>> {
    // Merge auth information if we have a token
    const fullContext: MessageContext = { ...context }
    if (this.authToken) {
      fullContext.auth = {
        ...(fullContext.auth || {}),
        token: this.authToken
      }
    }
    
    return this.transport.request(requestType, payload, fullContext)
  }

  /**
   * Emit an event
   * @param event The event type
   * @param payload The event payload
   * @param context Optional message context
   */
  async emit<E extends keyof TContract["events"] & string>(
    event: E,
    payload: InferEventData<TContract["events"], E>,
    context?: MessageContext
  ): Promise<void> {
    // Merge auth information if we have a token
    const fullContext: MessageContext = { ...context }
    if (this.authToken) {
      fullContext.auth = {
        ...(fullContext.auth || {}),
        token: this.authToken
      }
    }
    
    return this.transport.emit(event, payload, fullContext)
  }

  /**
   * Register an event handler
   * @param event The event type
   * @param handler The event handler
   * @param context Optional subscription context
   */
  on<E extends keyof TContract["events"] & string>(
    event: E,
    handler: (
      payload: InferEventData<TContract["events"], E>, 
      context: MessageContext
    ) => void,
    context?: MessageContext,
  ): void {
    this.transport.on(event, handler, context)
  }

  /**
   * Register a status change listener
   * @param listener The status listener
   */
  onStatusChange(listener: (status: ClientStatus) => void): () => void {
    this.statusListeners.add(listener)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  /**
   * Register an error listener
   * @param listener The error listener
   */
  onError(listener: (error: Error) => void): () => void {
    this.errorListeners.add(listener)
    return () => {
      this.errorListeners.delete(listener)
    }
  }

  /**
   * Get the client ID
   */
  getClientId(): string {
    return this.options.clientId
  }

  /**
   * Get the connection ID
   */
  getConnectionId(): string | null {
    return this.connectionId
  }

  /**
   * Get the server ID
   */
  getServerId(): string | null {
    return this.serverId
  }

  /**
   * Get the client status
   */
  getStatus(): ClientStatus {
    return this.status
  }

  /**
   * Check if the client is connected
   */
  isConnected(): boolean {
    return this.status === ClientStatus.CONNECTED
  }

  /**
   * Get the authentication provider
   */
  getAuthProvider(): AuthProvider {
    return this.authProvider
  }

  /**
   * Creates a default auth provider using the factory pattern
   * @private
   */
  private createDefaultAuthProvider(): AuthProvider {
    // Use the registry to create a default auth provider if available
    if (AuthProviderRegistry.hasFactory("default")) {
      return AuthProviderRegistry.createAuthProvider({
        type: "default"
      });
    }

    // Fallback for backward compatibility if registry isn't set up
    // This will be removed in a future version
    console.warn("Using deprecated auth provider creation. Please register a factory.");
    const legacyProvider = require("./auth-provider").DefaultAuthProvider;
    return new legacyProvider();
  }

  /**
   * Login to the server
   * @param credentials The login credentials
   */
  async login(credentials: { username: string; password: string } | { token: string }): Promise<AuthResult> {
    // First authenticate with our auth provider
    const authResult = await this.authProvider.authenticate(credentials)
    
    if (authResult.success && authResult.token) {
      // Store the token for future requests
      this.authToken = authResult.token
      
      // Now login on the transport
      return this.transport.login(credentials)
    }
    
    return authResult
  }

  /**
   * Logout from the server
   */
  async logout(): Promise<void> {
    if (this.authToken) {
      // Logout from auth provider
      await this.authProvider.logout(this.authToken)
      
      // Clear token
      this.authToken = undefined
      
      // Logout from transport
      return this.transport.logout()
    }
  }
}