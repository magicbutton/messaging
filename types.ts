import type * as z from "zod"

/**
 * Type definition for event schemas used in contracts
 * Maps event names to their Zod schema definitions
 *
 * @template T The Zod schema type
 */
export type EventSchemas = Record<string, z.ZodType>

/**
 * Type definition for request/response schemas used in contracts
 * Maps request names to their request and response schema definitions
 *
 * @template TReq The request schema type
 * @template TRes The response schema type
 */
export type RequestSchemas = Record<
  string,
  {
    requestSchema: z.ZodType
    responseSchema: z.ZodType
  }
>

/**
 * Authentication result interface representing the outcome of a login attempt
 *
 * @interface AuthResult
 * @property {boolean} success - Whether the authentication was successful
 * @property {string} [token] - Authentication token when successful
 * @property {number} [expiresAt] - Timestamp when the token expires
 * @property {Object} [user] - User information when authentication is successful
 * @property {string} user.id - Unique identifier for the user
 * @property {string} user.username - Username of the authenticated user
 * @property {Object} [error] - Error information when authentication fails
 * @property {string} error.code - Error code for the failure
 * @property {string} error.message - Human-readable error message
 */
export interface AuthResult {
  success: boolean
  token?: string
  expiresAt?: number
  user?: {
    id: string
    username: string
    [key: string]: any
  }
  error?: {
    code: string
    message: string
  }
}

/**
 * Actor representation within the messaging system
 * Used for authentication, authorization and tracking
 *
 * @interface Actor
 * @property {string} id - Unique identifier for this actor
 * @property {string} type - Type of actor (e.g., "user", "service", "system")
 * @property {string[]} [roles] - Roles assigned to this actor for role-based access control
 * @property {string[]} [permissions] - Direct permissions assigned to this actor
 * @property {Record<string, any>} [metadata] - Additional metadata about the actor
 */
export interface Actor {
  id: string
  type: string
  roles?: string[]
  permissions?: string[]
  metadata?: Record<string, any>
}

/**
 * Context information for messages, providing authentication, routing and tracing data
 *
 * @interface MessageContext
 * @property {string} [id] - Unique identifier for this message context
 * @property {number} [timestamp] - Time when the context was created
 * @property {string} [source] - Identifier of the sender
 * @property {string} [target] - Identifier of the intended recipient
 * @property {Object} [auth] - Authentication information
 * @property {string} [auth.token] - Authentication token
 * @property {Actor} [auth.actor] - Actor information for the authenticated entity
 * @property {Record<string, any>} [metadata] - Additional metadata for the message
 * @property {string} [traceId] - Distributed tracing ID for cross-service tracking
 * @property {string} [spanId] - Current span ID for the tracing context
 * @property {string} [parentSpanId] - Parent span ID if this is a child operation
 */
export interface MessageContext {
  id?: string
  timestamp?: number
  source?: string
  target?: string
  auth?: {
    token?: string
    actor?: Actor
  }
  metadata?: Record<string, any>
  traceId?: string
  spanId?: string
  parentSpanId?: string
}

/**
 * Event payload
 */
export interface EventPayload<T = any> {
  type: string
  payload: T
  context?: MessageContext
}

/**
 * Request payload
 */
export interface RequestPayload<T = any> {
  type: string
  payload: T
  context?: MessageContext
}

/**
 * Response payload
 */
export interface ResponsePayload<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  context?: MessageContext
}

/**
 * Transport adapter interface
 */
export interface TransportAdapter<
  TEvents extends Record<string, any> = {},
  TRequests extends Record<string, any> = {},
> {
  // Connection methods
  connect(connectionString: string): Promise<void>
  disconnect(): Promise<void>
  getConnectionString(): string
  isConnected(): boolean

  // Event methods
  emit<E extends string & keyof TEvents>(event: E, payload: any, context?: MessageContext): Promise<void>
  on<E extends string & keyof TEvents>(
    event: E,
    handler: (payload: any, context: MessageContext) => void,
    subscriptionContext?: MessageContext,
  ): void
  off<E extends string & keyof TEvents>(event: E, handler: (payload: any, context: MessageContext) => void): void

  // Request methods
  request<R extends string & keyof TRequests>(requestType: R, payload: any, context?: MessageContext): Promise<any>
  handleRequest<R extends string & keyof TRequests>(
    requestType: R,
    handler: (payload: any, context: MessageContext) => Promise<any>,
  ): void

  // Authentication methods
  login(credentials: { username: string; password: string } | { token: string }): Promise<AuthResult>
  logout(): Promise<void>
}

// Transport interface
export interface Transport<TEvents extends EventSchemas, TRequests extends RequestSchemas> {
  // Client methods
  sendRequest: <K extends keyof TRequests & string>(
    method: K,
    data: z.infer<TRequests[K]["requestSchema"]>,
  ) => Promise<z.infer<TRequests[K]["responseSchema"]>>

  subscribe: <K extends keyof TEvents & string>(event: K, callback: (data: z.infer<TEvents[K]>) => void) => () => void

  // Server methods
  registerRequestHandler: <K extends keyof TRequests & string>(
    method: K,
    handler: (data: z.infer<TRequests[K]["requestSchema"]>) => Promise<z.infer<TRequests[K]["responseSchema"]>>,
  ) => () => void

  publish: <K extends keyof TEvents & string>(event: K, data: z.infer<TEvents[K]>) => void
}

// Client interface
export interface Client<TEvents extends EventSchemas, TRequests extends RequestSchemas> {
  sendRequest: <K extends keyof TRequests & string>(
    method: K,
    data: z.infer<TRequests[K]["requestSchema"]>,
  ) => Promise<z.infer<TRequests[K]["responseSchema"]>>

  subscribe: <K extends keyof TEvents & string>(event: K, callback: (data: z.infer<TEvents[K]>) => void) => () => void
}

// Server interface
export interface Server<TEvents extends EventSchemas, TRequests extends RequestSchemas> {
  registerRequestHandler: <K extends keyof TRequests & string>(
    method: K,
    handler: (data: z.infer<TRequests[K]["requestSchema"]>) => Promise<z.infer<TRequests[K]["responseSchema"]>>,
  ) => () => void

  publish: <K extends keyof TEvents & string>(event: K, data: z.infer<TEvents[K]>) => void
}
