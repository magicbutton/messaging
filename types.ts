import type * as z from "zod"

// Basic types for events and requests
export type EventSchemas = Record<string, z.ZodType>
export type RequestSchemas = Record<
  string,
  {
    requestSchema: z.ZodType
    responseSchema: z.ZodType
  }
>

/**
 * Authentication result
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
 * Actor in the system
 */
export interface Actor {
  id: string
  type: string
  roles?: string[]
  permissions?: string[]
  metadata?: Record<string, any>
}

/**
 * Message context for requests and events
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
