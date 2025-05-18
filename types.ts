import * as z from "zod"

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  DEBUG = "debug",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

// Define Zod schemas as the source of truth

/**
 * Schema for error definition
 */
export const ErrorDefinitionSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: z.nativeEnum(ErrorSeverity),
  retryable: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Type definition for error definition
 */
export interface IErrorDefinition extends z.infer<typeof ErrorDefinitionSchema> {}

/**
 * Schema for access control settings
 */
export const AccessSettingsSchema = z.object({
  allowedRoles: z.array(z.string()).optional(),
  deniedRoles: z.array(z.string()).optional(),
})

/**
 * Access control settings for requests and events
 * TRoles is the type of the role keys in the contract
 */
export interface IAccessSettings<TRoleKey extends string = string> {
  allowedRoles?: TRoleKey[]
  deniedRoles?: TRoleKey[]
}

/**
 * Schema for role definition
 */
export const RoleDefinitionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  inherits: z.array(z.string()).optional(),
})

/**
 * Role definition interface
 */
export interface IRoleDefinition extends z.infer<typeof RoleDefinitionSchema> {}

/**
 * Schema for permission definition
 */
export const PermissionDefinitionSchema = z.object({
  resource: z.string(),
  actions: z.array(z.string()),
  description: z.string().optional(),
})

/**
 * Permission definition for mapping roles to requests and events
 */
export interface IPermissionDefinition extends z.infer<typeof PermissionDefinitionSchema> {}

/**
 * Schema for actor
 */
export const ActorSchema = z.object({
  id: z.string(),
  type: z.string(),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

/**
 * Actor representation within the messaging system
 */
export interface IActor extends z.infer<typeof ActorSchema> {}

/**
 * Schema for message context
 */
export const MessageContextSchema = z.object({
  id: z.string().optional(),
  timestamp: z.number().optional(),
  source: z.string().optional(),
  target: z.string().optional(),
  auth: z.object({
    token: z.string().optional(),
    actor: ActorSchema.optional(),
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  traceId: z.string().optional(),
  spanId: z.string().optional(),
  parentSpanId: z.string().optional(),
})

/**
 * Context information for messages
 */
export interface IMessageContext extends z.infer<typeof MessageContextSchema> {}

/**
 * Schema for event payload
 */
export const EventPayloadSchema = z.object({
  type: z.string(),
  payload: z.any(),
  context: MessageContextSchema.optional(),
})

/**
 * Event payload structure for message events
 */
export interface IEventPayload<T = any> {
  type: string
  payload: T
  context?: IMessageContext
}

/**
 * Schema for request payload
 */
export const RequestPayloadSchema = z.object({
  type: z.string(),
  payload: z.any(),
  context: MessageContextSchema.optional(),
})

/**
 * Request payload structure for client-server requests
 */
export interface IRequestPayload<T = any> {
  type: string
  payload: T
  context?: IMessageContext
}

/**
 * Schema for response payload
 */
export const ResponsePayloadSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  context: MessageContextSchema.optional(),
})

/**
 * Response payload structure for server-client responses
 */
export interface IResponsePayload<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  context?: IMessageContext
}

/**
 * Schema for authentication result
 */
export const AuthResultSchema = z.object({
  success: z.boolean(),
  token: z.string().optional(),
  expiresAt: z.number().optional(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    roles: z.array(z.string()).optional(),
  }).catchall(z.any()).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
})

/**
 * Authentication result interface
 */
export interface IAuthResult extends z.infer<typeof AuthResultSchema> {}

/**
 * Schema for client options
 */
export const ClientOptionsSchema = z.object({
  clientId: z.string().optional(),
  clientType: z.string().optional(),
  autoReconnect: z.boolean().optional(),
  reconnect: z.boolean().optional(), // Alias for autoReconnect
  reconnectInterval: z.number().optional(),
  heartbeatInterval: z.number().optional(),
  capabilities: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  debug: z.boolean().optional(),
})

/**
 * Client options interface
 */
export interface IClientOptions {
  clientId?: string
  clientType?: string
  autoReconnect?: boolean
  reconnect?: boolean // Alias for autoReconnect
  reconnectInterval?: number
  heartbeatInterval?: number
  capabilities?: string[]
  metadata?: Record<string, unknown>
  authProvider?: IAuthProvider
  debug?: boolean
}

/**
 * Schema for server options
 */
export const ServerOptionsSchema = z.object({
  serverId: z.string().optional(),
  version: z.string().optional(),
  heartbeatInterval: z.number().optional(),
  clientTimeout: z.number().optional(),
  maxClients: z.number().optional(),
  capabilities: z.array(z.string()).optional(),
})

/**
 * Server options interface
 */
export interface IServerOptions {
  serverId?: string
  version?: string
  heartbeatInterval?: number
  clientTimeout?: number
  maxClients?: number
  capabilities?: string[]
  authProvider?: IAuthProvider
  authorizationProvider?: IAuthorizationProvider
}

/**
 * Enum representing the possible states of a messaging client
 */
export enum ClientStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  RECONNECTING = "reconnecting",
  ERROR = "error",
}

/**
 * Type definition for event schemas used in contracts
 * Maps event names to their Zod schema definitions,
 * or to objects with schema and description properties
 *
 * @template T The Zod schema type
 * @template TRoleKey The type of role keys
 */
export type EventSchemas<TRoleKey extends string = string> = Record<
  string,
  z.ZodType | {
    schema: z.ZodType
    description?: string
    access?: IAccessSettings<TRoleKey>
  }
>

/**
 * Type definition for request/response schemas used in contracts
 * Maps request names to their request and response schema definitions,
 * or to objects with request schema, response schema, and description properties
 *
 * @template TReq The request schema type
 * @template TRes The response schema type
 * @template TRoleKey The type of role keys
 */
export type RequestSchemas<TRoleKey extends string = string> = Record<
  string,
  {
    requestSchema: z.ZodType
    responseSchema: z.ZodType
    description?: string
    access?: IAccessSettings<TRoleKey>
  } |
  {
    request: z.ZodType
    response: z.ZodType
    description?: string
    access?: IAccessSettings<TRoleKey>
  }
>

/**
 * Definition for a messaging contract
 */
export interface IContract<
  TRoleKey extends string = string,
  TEvents extends EventSchemas<TRoleKey> = EventSchemas<TRoleKey>,
  TRequests extends RequestSchemas<TRoleKey> = RequestSchemas<TRoleKey>,
  TErrors extends Record<string, IErrorDefinition> = Record<string, IErrorDefinition>,
  TRoles extends Record<TRoleKey, IRoleDefinition> = Record<TRoleKey, IRoleDefinition>,
  TPermissions extends Record<string, IPermissionDefinition> = Record<string, IPermissionDefinition>
> {
  name: string
  version: string
  description?: string
  events: TEvents
  requests: TRequests
  errors: TErrors
  roles?: TRoles
  permissions?: TPermissions
}

/**
 * Contract schema generator function
 */
export const ContractSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  events: z.record(z.string(), z.union([
    z.instanceof(z.ZodType),
    z.object({
      schema: z.instanceof(z.ZodType),
      description: z.string().optional(),
      access: AccessSettingsSchema.optional(),
    })
  ])),
  requests: z.record(z.string(), z.union([
    z.object({
      requestSchema: z.instanceof(z.ZodType),
      responseSchema: z.instanceof(z.ZodType),
      description: z.string().optional(),
      access: AccessSettingsSchema.optional(),
    }),
    z.object({
      request: z.instanceof(z.ZodType),
      response: z.instanceof(z.ZodType),
      description: z.string().optional(),
      access: AccessSettingsSchema.optional(),
    })
  ])),
  errors: z.record(z.string(), ErrorDefinitionSchema),
  roles: z.record(z.string(), RoleDefinitionSchema).optional(),
  permissions: z.record(z.string(), PermissionDefinitionSchema).optional(),
})

// Helper type to infer schema type for both direct and object formats
export type SchemaType<T> = T extends z.ZodType ? T :
  T extends { schema: z.ZodType } ? T['schema'] : never;

// Helper type to infer request schema type from both formats
export type RequestSchemaType<T> = T extends { requestSchema: z.ZodType } ? T['requestSchema'] :
  T extends { request: z.ZodType } ? T['request'] : never;

// Helper type to infer response schema type from both formats
export type ResponseSchemaType<T> = T extends { responseSchema: z.ZodType } ? T['responseSchema'] :
  T extends { response: z.ZodType } ? T['response'] : never;

/**
 * Infer event data type from an event schema
 */
export type InferEventData<
  TEvents extends EventSchemas,
  TEvent extends keyof TEvents & string
> = z.infer<SchemaType<TEvents[TEvent]>>;

/**
 * Infer request data type from a request schema
 */
export type InferRequestData<
  TRequests extends RequestSchemas,
  TRequest extends keyof TRequests & string
> = z.infer<RequestSchemaType<TRequests[TRequest]>>;

/**
 * Infer response data type from a request schema
 */
export type InferResponseData<
  TRequests extends RequestSchemas,
  TRequest extends keyof TRequests & string
> = z.infer<ResponseSchemaType<TRequests[TRequest]>>;

/**
 * AuthProvider interface for pluggable authentication systems
 */
export interface IAuthProvider {
  /**
   * Authenticate a user with credentials
   */
  authenticate(credentials: { username: string; password: string } | { token: string }): Promise<IAuthResult>
  
  /**
   * Verify a token is valid
   */
  verifyToken(token: string): Promise<{ valid: boolean; actor?: IActor }>
  
  /**
   * Logout a user
   */
  logout(token: string): Promise<void>
}

/**
 * Schema for the AuthProvider validate token result
 */
export const AuthVerifyResultSchema = z.object({
  valid: z.boolean(),
  actor: ActorSchema.optional(),
})

export interface IAuthVerifyResult extends z.infer<typeof AuthVerifyResultSchema> {}

/**
 * Authorization provider interface for pluggable permission systems
 */
export interface IAuthorizationProvider<TContract extends IContract = IContract> {
  /**
   * Check if an actor has permission to access a request
   */
  canAccessRequest(
    actor: IActor,
    requestType: keyof TContract["requests"] & string
  ): Promise<boolean>

  /**
   * Check if an actor has permission to emit an event
   */
  canEmitEvent(
    actor: IActor,
    eventType: keyof TContract["events"] & string
  ): Promise<boolean>

  /**
   * Check if an actor has permission to listen to an event
   */
  canSubscribeToEvent(
    actor: IActor,
    eventType: keyof TContract["events"] & string
  ): Promise<boolean>

  /**
   * Check if an actor has a specific permission
   */
  hasPermission(actor: IActor, permission: string): Promise<boolean>

  /**
   * Get all permissions for an actor
   */
  getPermissions(actor: IActor): Promise<string[]>
}

/**
 * Transport interface for messaging
 */
export interface ITransport<
  TContract extends IContract = IContract
> {
  // Connection methods
  connect(connectionString: string): Promise<void>
  disconnect(): Promise<void>
  getConnectionString(): string
  isConnected(): boolean

  // Event methods
  emit<E extends keyof TContract["events"] & string>(
    event: E, 
    payload: InferEventData<TContract["events"], E>, 
    context?: IMessageContext
  ): Promise<void>
  
  on<E extends keyof TContract["events"] & string>(
    event: E,
    handler: (
      payload: InferEventData<TContract["events"], E>, 
      context: IMessageContext
    ) => void,
    subscriptionContext?: IMessageContext
  ): void
  
  off<E extends keyof TContract["events"] & string>(
    event: E, 
    handler: (
      payload: InferEventData<TContract["events"], E>, 
      context: IMessageContext
    ) => void
  ): void

  // Request methods
  request<R extends keyof TContract["requests"] & string>(
    requestType: R, 
    payload: InferRequestData<TContract["requests"], R>, 
    context?: IMessageContext
  ): Promise<InferResponseData<TContract["requests"], R>>
  
  handleRequest<R extends keyof TContract["requests"] & string>(
    requestType: R,
    handler: (
      payload: InferRequestData<TContract["requests"], R>, 
      context: IMessageContext
    ) => Promise<InferResponseData<TContract["requests"], R>>
  ): void

  // Authentication methods
  login(credentials: { username: string; password: string } | { token: string }): Promise<IAuthResult>
  logout(): Promise<void>
}

// Legacy aliases to maintain backward compatibility
export type ErrorDefinition = IErrorDefinition
export type AccessSettings<TRoleKey extends string = string> = IAccessSettings<TRoleKey>
export type RoleDefinition = IRoleDefinition
export type PermissionDefinition = IPermissionDefinition
export type Actor = IActor
export type MessageContext = IMessageContext
export type EventPayload<T = any> = IEventPayload<T>
export type RequestPayload<T = any> = IRequestPayload<T>
export type ResponsePayload<T = any> = IResponsePayload<T>
export type AuthResult = IAuthResult
export type Contract<
  TRoleKey extends string = string,
  TEvents extends EventSchemas<TRoleKey> = EventSchemas<TRoleKey>,
  TRequests extends RequestSchemas<TRoleKey> = RequestSchemas<TRoleKey>,
  TErrors extends Record<string, IErrorDefinition> = Record<string, IErrorDefinition>,
  TRoles extends Record<TRoleKey, IRoleDefinition> = Record<TRoleKey, IRoleDefinition>,
  TPermissions extends Record<string, IPermissionDefinition> = Record<string, IPermissionDefinition>
> = IContract<TRoleKey, TEvents, TRequests, TErrors, TRoles, TPermissions>
export type AuthProvider = IAuthProvider
export type AuthorizationProvider<TContract extends IContract = IContract> = IAuthorizationProvider<TContract>
export type Transport<TContract extends IContract = IContract> = ITransport<TContract>
export type ClientOptions = IClientOptions
export type ServerOptions = IServerOptions