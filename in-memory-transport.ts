import { BaseTransport } from "./transport-adapter"
import type { Contract, MessageContext, AuthResult, InferEventData, InferRequestData, InferResponseData } from "./types"
import { v4 as uuidv4 } from "uuid"

/**
 * In-memory transport adapter for testing
 */
export class InMemoryTransport<TContract extends Contract> extends BaseTransport<TContract> {
  private eventHandlers: Map<string, Set<(payload: any, context: MessageContext) => void>> = new Map()
  private requestHandlers: Map<string, (payload: any, context: MessageContext) => Promise<any>> = new Map()
  private users: Map<string, { username: string; password: string; id: string }> = new Map()
  private tokens: Map<string, { userId: string; expiresAt: number }> = new Map()

  constructor() {
    super();
    // Add a test user
    this.users.set("test", {
      username: "test",
      password: "password",
      id: "user-1",
    })
  }

  /**
   * Connect to the transport
   * @param connectionString The connection string
   */
  async connect(connectionString: string): Promise<void> {
    this.connectionString = connectionString
    this.connected = true
    console.log(`InMemoryTransport connected to ${connectionString}`)
  }

  /**
   * Disconnect from the transport
   */
  async disconnect(): Promise<void> {
    this.connected = false
    console.log("InMemoryTransport disconnected")
  }

  /**
   * Emit an event
   * @param event The event type
   * @param payload The event payload
   * @param context The message context
   */
  async emit<E extends keyof TContract["events"] & string>(
    event: E, 
    payload: InferEventData<TContract["events"], E>, 
    context: MessageContext = {}
  ): Promise<void> {
    if (!this.connected) {
      throw new Error("Not connected")
    }

    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const fullContext: MessageContext = {
        id: context.id || uuidv4(),
        timestamp: context.timestamp || Date.now(),
        source: context.source || "client",
        ...context,
      }

      for (const handler of handlers) {
        try {
          handler(payload, fullContext)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      }
    }
  }

  /**
   * Register an event handler
   * @param event The event type
   * @param handler The event handler
   */
  on<E extends keyof TContract["events"] & string>(
    event: E,
    handler: (
      payload: InferEventData<TContract["events"], E>, 
      context: MessageContext
    ) => void,
    subscriptionContext?: MessageContext,
  ): void {
    let handlers = this.eventHandlers.get(event)
    if (!handlers) {
      handlers = new Set()
      this.eventHandlers.set(event, handlers)
    }
    handlers.add(handler as any)
  }

  /**
   * Unregister an event handler
   * @param event The event type
   * @param handler The event handler
   */
  off<E extends keyof TContract["events"] & string>(
    event: E, 
    handler: (
      payload: InferEventData<TContract["events"], E>, 
      context: MessageContext
    ) => void
  ): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler as any)
      if (handlers.size === 0) {
        this.eventHandlers.delete(event)
      }
    }
  }

  /**
   * Send a request
   * @param requestType The request type
   * @param payload The request payload
   * @param context The message context
   */
  async request<R extends keyof TContract["requests"] & string>(
    requestType: R,
    payload: InferRequestData<TContract["requests"], R>,
    context: MessageContext = {},
  ): Promise<InferResponseData<TContract["requests"], R>> {
    if (!this.connected) {
      throw new Error("Not connected")
    }

    const handler = this.requestHandlers.get(requestType)
    if (!handler) {
      throw new Error(`No handler registered for request type ${String(requestType)}`)
    }

    const fullContext: MessageContext = {
      id: context.id || uuidv4(),
      timestamp: context.timestamp || Date.now(),
      source: context.source || "client",
      ...context,
    }

    return handler(payload, fullContext)
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
      context: MessageContext
    ) => Promise<InferResponseData<TContract["requests"], R>>,
  ): void {
    this.requestHandlers.set(requestType, handler as any)
  }

  /**
   * Login to the transport
   * @param credentials The login credentials
   */
  async login(credentials: { username: string; password: string } | { token: string }): Promise<AuthResult> {
    if (!this.connected) {
      throw new Error("Not connected")
    }

    if ("token" in credentials) {
      // Token login
      const tokenInfo = this.tokens.get(credentials.token)
      if (!tokenInfo) {
        return {
          success: false,
          error: {
            code: "invalid_token",
            message: "Invalid token",
          },
        }
      }

      if (tokenInfo.expiresAt < Date.now()) {
        this.tokens.delete(credentials.token)
        return {
          success: false,
          error: {
            code: "token_expired",
            message: "Token expired",
          },
        }
      }

      const user = Array.from(this.users.values()).find((u) => u.id === tokenInfo.userId)
      if (!user) {
        return {
          success: false,
          error: {
            code: "user_not_found",
            message: "User not found",
          },
        }
      }

      return {
        success: true,
        token: credentials.token,
        expiresAt: tokenInfo.expiresAt,
        user: {
          id: user.id,
          username: user.username,
        },
      }
    } else {
      // Username/password login
      const user = this.users.get(credentials.username)
      if (!user || user.password !== credentials.password) {
        return {
          success: false,
          error: {
            code: "invalid_credentials",
            message: "Invalid username or password",
          },
        }
      }

      const token = uuidv4()
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

      this.tokens.set(token, {
        userId: user.id,
        expiresAt,
      })

      return {
        success: true,
        token,
        expiresAt,
        user: {
          id: user.id,
          username: user.username,
        },
      }
    }
  }

  /**
   * Logout from the transport
   */
  async logout(): Promise<void> {
    // In a real implementation, we would invalidate the token
    console.log("Logged out")
  }
}