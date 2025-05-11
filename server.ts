import { v4 as uuidv4 } from "uuid"
import {
  Transport,
  Contract,
  ServerOptions,
  MessageContext,
  InferEventData,
  InferRequestData,
  InferResponseData,
  AuthProvider,
  AuthorizationProvider
} from "./types"
import { AuthProviderRegistry } from "./auth-provider-factory"
import { AuthorizationProviderRegistry } from "./authorization-provider-factory"

/**
 * Client connection information
 */
export interface ClientConnection {
  clientId: string
  connectionId: string
  clientType: string
  capabilities: string[]
  metadata: Record<string, unknown>
  lastActivity: number
  subscriptions: Map<string, { events: string[]; filter?: Record<string, unknown> }>
}

/**
 * Generic messaging server that works with any contract and transport through dependency injection
 */
export class MessagingServer<TContract extends Contract> {
  private transport: Transport<TContract>
  private options: Required<ServerOptions>
  private clients: Map<string, ClientConnection> = new Map()
  private connectionIdToClientId: Map<string, string> = new Map()
  private heartbeatTimer: NodeJS.Timeout | null = null
  private startTime: number = Date.now()
  private requestHandlers: Map<
    string, 
    (payload: any, context: MessageContext, clientId: string) => Promise<any>
  > = new Map()
  private authProvider: AuthProvider
  private authorizationProvider: AuthorizationProvider<TContract>

  /**
   * Creates a new messaging server instance with dependency injection
   * 
   * @param transport - The transport implementation to use for communication
   * @param contract - The contract definition to use for authorization
   * @param options - Configuration options for the server
   */
  constructor(
    transport: Transport<TContract>,
    contract: TContract,
    options: ServerOptions = {}
  ) {
    this.transport = transport
    this.options = {
      serverId: options.serverId || uuidv4(),
      version: options.version || "1.0.0",
      heartbeatInterval: options.heartbeatInterval || 30000,
      clientTimeout: options.clientTimeout || 90000, // 3x heartbeat interval by default
      maxClients: options.maxClients || 1000,
      capabilities: options.capabilities || [],
      authProvider: options.authProvider || this.createDefaultAuthProvider(),
      authorizationProvider: options.authorizationProvider || this.createDefaultAuthorizationProvider(contract)
    }

    // Set up authentication and authorization providers
    this.authProvider = this.options.authProvider
    this.authorizationProvider = this.options.authorizationProvider

    // Set up system request handlers
    this.setupSystemRequestHandlers()
  }

  /**
   * Set up system request handlers
   */
  private setupSystemRequestHandlers(): void {
    // Handle client registration
    this.transport.handleRequest("$register" as any, async (payload, context) => {
      return this.handleClientRegister(payload, context)
    })

    // Handle client unregistration
    this.transport.handleRequest("$unregister" as any, async (payload, context) => {
      return this.handleClientUnregister(payload, context)
    })

    // Handle ping requests
    this.transport.handleRequest("$ping" as any, async (payload, context) => {
      return {
        timestamp: payload.timestamp,
        serverTime: Date.now(),
        echo: payload.payload,
      }
    })

    // Handle server info requests
    this.transport.handleRequest("$serverInfo" as any, async (payload, context) => {
      return {
        serverId: this.options.serverId,
        version: this.options.version,
        uptime: Date.now() - this.startTime,
        connectedClients: this.clients.size,
        capabilities: this.options.capabilities,
        serverTime: Date.now(),
      }
    })

    // Handle subscription requests
    this.transport.handleRequest("$subscribe" as any, async (payload, context) => {
      return this.handleClientSubscribe(payload, context)
    })

    // Handle unsubscription requests
    this.transport.handleRequest("$unsubscribe" as any, async (payload, context) => {
      return this.handleClientUnsubscribe(payload, context)
    })

    // Set up heartbeat handler
    this.transport.on("$heartbeat" as any, (payload, context) => {
      if (payload.clientId) {
        this.updateClientActivity(payload.clientId)
      }
    })
  }

  /**
   * Handle client registration
   */
  private async handleClientRegister(payload: any, context: MessageContext): Promise<any> {
    const { clientId, clientType, capabilities = [], metadata = {} } = payload

    // Check if we've reached the maximum number of clients
    if (this.clients.size >= this.options.maxClients) {
      throw new Error("Server has reached maximum number of clients")
    }

    // Generate a connection ID
    const connectionId = uuidv4()

    // Create client connection
    const clientConnection: ClientConnection = {
      clientId,
      connectionId,
      clientType,
      capabilities,
      metadata,
      lastActivity: Date.now(),
      subscriptions: new Map(),
    }

    // Store client connection
    this.clients.set(clientId, clientConnection)
    this.connectionIdToClientId.set(connectionId, clientId)

    // Emit connected event
    await this.transport.emit("$connected" as any, {
      clientId,
      connectionId,
      timestamp: Date.now(),
      metadata,
    })

    console.log(`Client ${clientId} registered with connection ID ${connectionId}`)

    return {
      success: true,
      connectionId,
      serverId: this.options.serverId,
      serverTime: Date.now(),
      ttl: Math.floor(this.options.clientTimeout / 1000),
    }
  }

  /**
   * Handle client unregistration
   */
  private async handleClientUnregister(payload: any, context: MessageContext): Promise<any> {
    const { clientId, connectionId } = payload

    // Check if the client exists
    const client = this.clients.get(clientId)
    if (!client) {
      throw new Error(`Client ${clientId} not found`)
    }

    // Check if the connection ID matches
    if (client.connectionId !== connectionId) {
      throw new Error(`Invalid connection ID for client ${clientId}`)
    }

    // Remove client
    this.clients.delete(clientId)
    this.connectionIdToClientId.delete(connectionId)

    // Emit disconnected event
    await this.transport.emit("$disconnected" as any, {
      clientId,
      connectionId,
      reason: "Client unregistered",
      timestamp: Date.now(),
    })

    console.log(`Client ${clientId} unregistered`)

    return {
      success: true,
      timestamp: Date.now(),
    }
  }

  /**
   * Handle client subscription
   */
  private async handleClientSubscribe(payload: any, context: MessageContext): Promise<any> {
    const { clientId, events, filter } = payload

    // Check if the client exists
    const client = this.clients.get(clientId)
    if (!client) {
      throw new Error(`Client ${clientId} not found`)
    }
    
    // Check authorization for each event
    if (context.auth?.token && context.auth?.actor) {
      for (const eventType of events) {
        // Skip system events which start with $
        if (!eventType.startsWith('$')) {
          const canSubscribe = await this.authorizationProvider.canSubscribeToEvent(
            context.auth.actor,
            eventType
          )
          
          if (!canSubscribe) {
            throw new Error(`Unauthorized to subscribe to event: ${eventType}`)
          }
        }
      }
    }

    // Generate a subscription ID
    const subscriptionId = uuidv4()

    // Store subscription
    client.subscriptions.set(subscriptionId, { events, filter })

    console.log(`Client ${clientId} subscribed to events: ${events.join(", ")}`)

    return {
      success: true,
      subscriptionId,
      events,
    }
  }

  /**
   * Handle client unsubscription
   */
  private async handleClientUnsubscribe(payload: any, context: MessageContext): Promise<any> {
    const { clientId, subscriptionId } = payload

    // Check if the client exists
    const client = this.clients.get(clientId)
    if (!client) {
      throw new Error(`Client ${clientId} not found`)
    }

    // Remove subscription
    const removed = client.subscriptions.delete(subscriptionId)
    if (!removed) {
      throw new Error(`Subscription ${subscriptionId} not found for client ${clientId}`)
    }

    console.log(`Client ${clientId} unsubscribed from subscription ${subscriptionId}`)

    return {
      success: true,
    }
  }

  /**
   * Update client activity timestamp
   */
  private updateClientActivity(clientId: string): void {
    const client = this.clients.get(clientId)
    if (client) {
      client.lastActivity = Date.now()
    }
  }

  /**
   * Get access to the transport for use by methods in the example
   */
  get transportAdapter(): Transport<TContract> {
    return this.transport
  }

  /**
   * Starts the server with the specified connection string.
   */
  async start(connectionString: string): Promise<void> {
    // Connect the transport
    await this.transport.connect(connectionString)

    // Start heartbeat
    this.startHeartbeat()

    console.log(`Server ${this.options.serverId} started on ${connectionString}`)
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    // Stop heartbeat
    this.stopHeartbeat()

    // Disconnect all clients
    await this.disconnectAllClients("Server shutting down")

    // Disconnect the transport
    await this.transport.disconnect()

    console.log(`Server ${this.options.serverId} stopped`)
  }

  /**
   * Start the heartbeat timer
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.checkClients()
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
   * Send a heartbeat to all clients
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      await this.transport.emit("$heartbeat" as any, {
        timestamp: Date.now(),
        serverId: this.options.serverId,
      })
    } catch (error) {
      console.error("Error sending heartbeat:", error)
    }
  }

  /**
   * Check clients for timeouts
   */
  private async checkClients(): Promise<void> {
    const now = Date.now()
    const timeoutThreshold = now - this.options.clientTimeout

    // Find timed out clients
    const timedOutClients: ClientConnection[] = []
    for (const client of this.clients.values()) {
      if (client.lastActivity < timeoutThreshold) {
        timedOutClients.push(client)
      }
    }

    // Disconnect timed out clients
    for (const client of timedOutClients) {
      try {
        // Remove client
        this.clients.delete(client.clientId)
        this.connectionIdToClientId.delete(client.connectionId)

        // Emit disconnected event
        await this.transport.emit("$disconnected" as any, {
          clientId: client.clientId,
          connectionId: client.connectionId,
          reason: "Client timeout",
          timestamp: now,
        })

        console.log(`Client ${client.clientId} timed out and was disconnected`)
      } catch (error) {
        console.error(`Error disconnecting timed out client ${client.clientId}:`, error)
      }
    }
  }

  /**
   * Disconnect all clients
   * @param reason The reason for disconnection
   */
  private async disconnectAllClients(reason: string): Promise<void> {
    const now = Date.now()
    const disconnectPromises: Promise<void>[] = []

    for (const client of this.clients.values()) {
      disconnectPromises.push(
        this.transport.emit("$disconnected" as any, {
          clientId: client.clientId,
          connectionId: client.connectionId,
          reason,
          timestamp: now,
        })
      )
    }

    // Clear client maps
    this.clients.clear()
    this.connectionIdToClientId.clear()

    // Wait for all disconnect events to be sent
    await Promise.all(disconnectPromises)
  }

  /**
   * Broadcast a message to all clients
   * @param message The message to broadcast
   * @param data Optional data to include
   */
  async broadcast(message: string, data?: any): Promise<void> {
    await this.transport.emit("$broadcast" as any, {
      message,
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * Send a message to a specific client
   * @param clientId The client ID to send to
   * @param event The event type
   * @param payload The event payload
   */
  async sendToClient<E extends keyof TContract["events"] & string>(
    clientId: string, 
    event: E, 
    payload: InferEventData<TContract["events"], E>
  ): Promise<void> {
    // Check if the client exists
    const client = this.clients.get(clientId)
    if (!client) {
      throw new Error(`Client ${clientId} not found`)
    }

    // Create context with client info
    const context: MessageContext = {
      target: clientId,
      source: this.options.serverId,
      timestamp: Date.now(),
    }

    // Send the event
    await this.transport.emit(event, payload, context)
  }

  /**
   * Register a request handler
   * @param requestType The request type
   * @param handler The request handler
   */
  handleRequest<R extends keyof TContract["requests"] & string>(
    requestType: R,
    handler: (
      payload: InferRequestData<TContract["requests"], R>, 
      context: MessageContext, 
      clientId: string
    ) => Promise<InferResponseData<TContract["requests"], R>>,
  ): void {
    // Store the handler
    this.requestHandlers.set(requestType as string, handler as any)

    // Register with the adapter
    this.transport.handleRequest(requestType, async (payload, context) => {
      // Get client ID from context
      const clientId = this.getClientIdFromContext(context)
      if (!clientId) {
        throw new Error("Client ID not found in request context")
      }

      // Check if client is registered
      if (!this.clients.has(clientId)) {
        throw new Error(`Client ${clientId} not registered`)
      }
      
      // Check authorization
      if (context.auth?.actor) {
        const canAccess = await this.authorizationProvider.canAccessRequest(
          context.auth.actor,
          requestType
        )
        
        if (!canAccess) {
          throw new Error(`Unauthorized to access request: ${String(requestType)}`)
        }
      }

      // Update client activity
      this.updateClientActivity(clientId)

      // Call the handler
      return handler(payload, context, clientId)
    })
  }

  /**
   * Get client ID from message context
   */
  private getClientIdFromContext(context: MessageContext): string | null {
    // Try to get from source
    if (context.source) {
      return context.source
    }

    // Try to get from auth
    if (context.auth?.actor?.id) {
      return context.auth.actor.id
    }

    return null
  }

  /**
   * Get all connected clients
   */
  getClients(): ClientConnection[] {
    return Array.from(this.clients.values())
  }

  /**
   * Get a specific client
   * @param clientId The client ID to get
   */
  getClient(clientId: string): ClientConnection | undefined {
    return this.clients.get(clientId)
  }

  /**
   * Get the number of connected clients
   */
  getClientCount(): number {
    return this.clients.size
  }

  /**
   * Get server information
   */
  getServerInfo(): {
    serverId: string
    version: string
    uptime: number
    connectedClients: number
    capabilities: string[]
  } {
    return {
      serverId: this.options.serverId,
      version: this.options.version,
      uptime: Date.now() - this.startTime,
      connectedClients: this.clients.size,
      capabilities: this.options.capabilities,
    }
  }
  
  /**
   * Get the authentication provider
   */
  getAuthProvider(): AuthProvider {
    return this.authProvider
  }
  
  /**
   * Get the authorization provider
   */
  getAuthorizationProvider(): AuthorizationProvider<TContract> {
    return this.authorizationProvider
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
   * Creates a default authorization provider using the factory pattern
   * @param contract The contract to use for authorization
   * @private
   */
  private createDefaultAuthorizationProvider(contract: TContract): AuthorizationProvider<TContract> {
    // Use the registry to create a default authorization provider if available
    if (AuthorizationProviderRegistry.hasFactory("default")) {
      return AuthorizationProviderRegistry.createAuthorizationProvider<TContract>({
        type: "default",
        contract
      });
    }

    // Fallback for backward compatibility if registry isn't set up
    // This will be removed in a future version
    console.warn("Using deprecated authorization provider creation. Please register a factory.");
    const legacyProvider = require("./authorization-provider").DefaultAuthorizationProvider;
    return new legacyProvider(contract);
  }
}