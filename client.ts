import type { TransportAdapter, MessageContext, AuthResult } from "./types"
import type { systemEvents, systemRequests } from "./system-contract"
import { v4 as uuidv4 } from "uuid"

/**
 * Client options for configuring the client
 */
export interface ClientOptions {
  clientId?: string
  clientType?: string
  autoReconnect?: boolean
  reconnectInterval?: number
  heartbeatInterval?: number
  capabilities?: string[]
  metadata?: Record<string, unknown>
}

/**
 * Client status enum
 */
export enum ClientStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
  ERROR = "error",
}

/**
 * Client class that uses a TransportAdapter to communicate with a server
 */
export class Client<TEvents extends Record<string, any> = {}, TRequests extends Record<string, any> = {}> {
  private adapter: TransportAdapter<typeof systemEvents & TEvents, typeof systemRequests & TRequests>
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

  /**
   * Create a new client
   * @param adapter The transport adapter to use
   * @param options Client options
   */
  constructor(
    adapter: TransportAdapter<typeof systemEvents & TEvents, typeof systemRequests & TRequests>,
    options: ClientOptions = {},
  ) {
    this.adapter = adapter
    this.options = {
      clientId: options.clientId || uuidv4(),
      clientType: options.clientType || "generic",
      autoReconnect: options.autoReconnect !== false,
      reconnectInterval: options.reconnectInterval || 5000,
      heartbeatInterval: options.heartbeatInterval || 30000,
      capabilities: options.capabilities || [],
      metadata: options.metadata || {},
    }

    // Set up system event handlers
    this.setupSystemEventHandlers()
  }

  /**
   * Set up system event handlers
   */
  private setupSystemEventHandlers(): void {
    // Handle heartbeat events
    this.adapter.on("$heartbeat", (payload) => {
      this.lastHeartbeat = payload.timestamp
    })

    // Handle broadcast events
    this.adapter.on("$broadcast", (payload, context) => {
      console.log(`Broadcast received: ${payload.message}`, payload.data)
    })

    // Handle error events
    this.adapter.on("$error", (payload) => {
      const error = new Error(payload.message)
      error.name = payload.code
      this.notifyErrorListeners(error)
    })
  }

  /**
   * Connect to the server
   * @param connectionString The connection string to use
   */
  async connect(connectionString: string): Promise<void> {
    try {
      this.setStatus(ClientStatus.CONNECTING)

      // Connect the transport adapter
      await this.adapter.connect(connectionString)

      // Register with the server
      const response = await this.adapter.request("$register", {
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

      console.log(`Connected to server ${this.serverId} with connection ID ${this.connectionId}`)
    } catch (error) {
      this.setStatus(ClientStatus.ERROR)
      this.notifyErrorListeners(error instanceof Error ? error : new Error(String(error)))

      // Attempt to reconnect if enabled
      if (this.options.autoReconnect) {
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
        await this.adapter.request("$unregister", {
          clientId: this.options.clientId,
          connectionId: this.connectionId,
        })
      }

      // Disconnect the transport adapter
      await this.adapter.disconnect()

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
      await this.adapter.emit("$heartbeat", {
        timestamp: Date.now(),
        clientId: this.options.clientId,
      })
    } catch (error) {
      console.error("Error sending heartbeat:", error)

      // Check if we need to reconnect
      if (this.status === ClientStatus.CONNECTED) {
        this.setStatus(ClientStatus.ERROR)
        if (this.options.autoReconnect) {
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
        await this.connect(this.adapter.getConnectionString())
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
        await this.adapter.request("$subscribe", {
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
    const response = await this.adapter.request("$subscribe", {
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
    await this.adapter.request("$unsubscribe", {
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
    return this.adapter.request("$serverInfo", {})
  }

  /**
   * Ping the server
   * @param payload Optional payload to include in the ping
   */
  async ping(payload?: string): Promise<{ roundTripTime: number }> {
    const startTime = Date.now()
    const response = await this.adapter.request("$ping", {
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
  async request<R extends string & keyof TRequests>(
    requestType: R,
    payload: any,
    context?: MessageContext,
  ): Promise<any> {
    return this.adapter.request(requestType, payload, context)
  }

  /**
   * Emit an event
   * @param event The event type
   * @param payload The event payload
   * @param context Optional message context
   */
  async emit<E extends string & keyof TEvents>(event: E, payload: any, context?: MessageContext): Promise<void> {
    return this.adapter.emit(event, payload, context)
  }

  /**
   * Register an event handler
   * @param event The event type
   * @param handler The event handler
   * @param context Optional subscription context
   */
  on<E extends string & keyof (TEvents & typeof systemEvents)>(
    event: E,
    handler: (payload: any, context: MessageContext) => void,
    context?: MessageContext,
  ): void {
    this.adapter.on(event, handler, context)
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
   * Login to the server
   * @param credentials The login credentials
   */
  async login(credentials: { username: string; password: string } | { token: string }): Promise<AuthResult> {
    return this.adapter.login(credentials)
  }

  /**
   * Logout from the server
   */
  async logout(): Promise<void> {
    return this.adapter.logout()
  }
}
