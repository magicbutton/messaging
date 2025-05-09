import type { TransportAdapter, MessageContext } from "./types"
import type { systemEvents, systemRequests } from "./system-contract"
import { v4 as uuidv4 } from "uuid"

/**
 * Client connection information
 */
interface ClientConnection {
  clientId: string
  connectionId: string
  clientType: string
  capabilities: string[]
  metadata: Record<string, unknown>
  lastActivity: number
  subscriptions: Map<string, { events: string[]; filter?: Record<string, unknown> }>
}

/**
 * Configuration options for the messaging server
 *
 * @interface ServerOptions
 * @property {string} [serverId] - Unique identifier for the server. If not provided, a UUID will be generated
 * @property {string} [version] - Version of the server. Default: "1.0.0"
 * @property {number} [heartbeatInterval] - Interval in milliseconds for sending heartbeat messages. Default: 30000
 * @property {number} [clientTimeout] - Timeout in milliseconds after which clients are considered disconnected. Default: 90000 (3x heartbeat interval)
 * @property {number} [maxClients] - Maximum number of clients that can connect to this server. Default: 1000
 * @property {string[]} [capabilities] - List of capabilities supported by this server
 */
export interface ServerOptions {
  serverId?: string
  version?: string
  heartbeatInterval?: number
  clientTimeout?: number
  maxClients?: number
  capabilities?: string[]
}

/**
 * Server class that manages client connections and message routing
 *
 * The Server is responsible for:
 * - Managing client connections and their lifecycle
 * - Routing messages between clients
 * - Handling client registration and authentication
 * - Processing requests and distributing events
 * - Monitoring client health through heartbeats
 *
 * @class Server
 * @template TEvents Type of events this server can handle, extended with system events
 * @template TRequests Type of requests this server can process, extended with system requests
 */
export class Server<TEvents extends Record<string, any> = {}, TRequests extends Record<string, any> = {}> {
  private adapter: TransportAdapter<typeof systemEvents & TEvents, typeof systemRequests & TRequests>
  private options: Required<ServerOptions>
  private clients: Map<string, ClientConnection> = new Map()
  private connectionIdToClientId: Map<string, string> = new Map()
  private heartbeatTimer: NodeJS.Timeout | null = null
  private startTime: number = Date.now()
  private requestHandlers: Map<string, (payload: any, context: MessageContext, clientId: string) => Promise<any>> =
    new Map()

  /**
   * Creates a new messaging server instance
   *
   * @constructor
   * @param {TransportAdapter<TEvents & systemEvents, TRequests & systemRequests>} adapter - The transport adapter to use for communication
   * @param {ServerOptions} [options={}] - Configuration options for the server
   * @example
   * // Create a server with in-memory transport
   * const transport = new InMemoryTransport();
   * const server = new Server(transport, {
   *   serverId: "main-message-server",
   *   version: "2.0.0",
   *   maxClients: 500
   * });
   *
   * // Start the server
   * await server.start("memory://my-server");
   */
  constructor(
    adapter: TransportAdapter<typeof systemEvents & TEvents, typeof systemRequests & TRequests>,
    options: ServerOptions = {},
  ) {
    this.adapter = adapter
    this.options = {
      serverId: options.serverId || uuidv4(),
      version: options.version || "1.0.0",
      heartbeatInterval: options.heartbeatInterval || 30000,
      clientTimeout: options.clientTimeout || 90000, // 3x heartbeat interval by default
      maxClients: options.maxClients || 1000,
      capabilities: options.capabilities || [],
    }

    // Set up system request handlers
    this.setupSystemRequestHandlers()
  }

  /**
   * Set up system request handlers
   */
  private setupSystemRequestHandlers(): void {
    // Handle client registration
    this.adapter.handleRequest("$register", async (payload, context) => {
      return this.handleClientRegister(payload, context)
    })

    // Handle client unregistration
    this.adapter.handleRequest("$unregister", async (payload, context) => {
      return this.handleClientUnregister(payload, context)
    })

    // Handle ping requests
    this.adapter.handleRequest("$ping", async (payload, context) => {
      return {
        timestamp: payload.timestamp,
        serverTime: Date.now(),
        echo: payload.payload,
      }
    })

    // Handle server info requests
    this.adapter.handleRequest("$serverInfo", async (payload, context) => {
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
    this.adapter.handleRequest("$subscribe", async (payload, context) => {
      return this.handleClientSubscribe(payload, context)
    })

    // Handle unsubscription requests
    this.adapter.handleRequest("$unsubscribe", async (payload, context) => {
      return this.handleClientUnsubscribe(payload, context)
    })

    // Set up heartbeat handler
    this.adapter.on("$heartbeat", (payload, context) => {
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
    await this.adapter.emit("$connected", {
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
    await this.adapter.emit("$disconnected", {
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
   * Starts the server with the specified connection string.
   * Connects the transport adapter and begins listening for client connections.
   * Also starts the heartbeat monitor to track client health.
   *
   * @async
   * @param {string} connectionString - The connection string where the server will listen
   * @returns {Promise<void>} A promise that resolves when the server has started
   * @throws {Error} If the server fails to start or the transport adapter cannot connect
   * @example
   * // Start server on an in-memory transport
   * await server.start("memory://message-hub");
   *
   * // Start server on a WebSocket transport
   * await server.start("ws://0.0.0.0:8080/messaging");
   */
  async start(connectionString: string): Promise<void> {
    // Connect the transport adapter
    await this.adapter.connect(connectionString)

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

    // Disconnect the transport adapter
    await this.adapter.disconnect()

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
      await this.adapter.emit("$heartbeat", {
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
        await this.adapter.emit("$disconnected", {
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
        this.adapter.emit("$disconnected", {
          clientId: client.clientId,
          connectionId: client.connectionId,
          reason,
          timestamp: now,
        }),
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
    await this.adapter.emit("$broadcast", {
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
  async sendToClient<E extends string & keyof TEvents>(clientId: string, event: E, payload: any): Promise<void> {
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
    await this.adapter.emit(event, payload, context)
  }

  /**
   * Register a request handler
   * @param requestType The request type
   * @param handler The request handler
   */
  handleRequest<R extends string & keyof TRequests>(
    requestType: R,
    handler: (payload: any, context: MessageContext, clientId: string) => Promise<any>,
  ): void {
    // Store the handler
    this.requestHandlers.set(requestType, handler)

    // Register with the adapter
    this.adapter.handleRequest(requestType, async (payload, context) => {
      // Get client ID from context
      const clientId = this.getClientIdFromContext(context)
      if (!clientId) {
        throw new Error("Client ID not found in request context")
      }

      // Check if client is registered
      if (!this.clients.has(clientId)) {
        throw new Error(`Client ${clientId} not registered`)
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
}
