import type { EventSchemas, RequestSchemas, MessageContext } from "./types"

/**
 * Creates a type-safe request schema map for defining request/response pairs
 *
 * This function helps maintain type safety when defining request schemas.
 * It simply returns the input object, but with proper TypeScript typing.
 * It supports both the traditional format with requestSchema/responseSchema
 * and the alternative format with request/response.
 *
 * @template T - The type of request schemas
 * @param {T} schemas - Object containing request schemas
 * @returns {T} - The validated request schema map
 *
 * @example
 * ```typescript
 * // Traditional format
 * const traditionalSchemas = createRequestSchemaMap({
 *   getUser: {
 *     requestSchema: z.object({ userId: z.string() }),
 *     responseSchema: z.object({ name: z.string(), email: z.string() })
 *   }
 * });
 *
 * // Alternative format with description
 * const alternativeSchemas = createRequestSchemaMap({
 *   "user.get": {
 *     request: z.object({ userId: z.string() }),
 *     response: z.object({ name: z.string(), email: z.string() }),
 *     description: "Get user by ID"
 *   }
 * });
 * ```
 */
export function createRequestSchemaMap<T extends RequestSchemas>(schemas: T): T {
  return schemas
}

/**
 * Creates a type-safe event schema map for defining event types
 *
 * This function helps maintain type safety when defining event schemas.
 * It simply returns the input object, but with proper TypeScript typing.
 * It supports both direct schema objects and objects with schema and description fields.
 *
 * @template T - The type of event schemas
 * @param {T} schemas - Object containing event schemas or objects with schema and description
 * @returns {T} - The validated event schema map
 *
 * @example
 * ```typescript
 * // Simple format with just schemas
 * const simpleEvents = createEventMap({
 *   userCreated: z.object({ userId: z.string(), timestamp: z.number() }),
 *   userDeleted: z.object({ userId: z.string(), timestamp: z.number() })
 * });
 *
 * // Extended format with schema and description
 * const extendedEvents = createEventMap({
 *   'user.created': {
 *     schema: z.object({ userId: z.string(), timestamp: z.number() }),
 *     description: 'Emitted when a new user is created'
 *   },
 *   'user.deleted': {
 *     schema: z.object({ userId: z.string(), timestamp: z.number() }),
 *     description: 'Emitted when a user is deleted from the system'
 *   }
 * });
 * ```
 */
export function createEventMap<T extends EventSchemas>(schemas: T): T {
  return schemas
}

/**
 * Creates a type-safe error definition map
 *
 * This function helps maintain type safety when defining error types.
 * It simply returns the input object, but ensures proper error structure.
 *
 * @template T - The type of error definitions
 * @param {T} errors - Object containing error definitions with code, message and optional status
 * @returns {T} - The validated error map
 *
 * @example
 * ```typescript
 * const errorMap = createErrorMap({
 *   NOT_FOUND: { code: 'NOT_FOUND', message: 'Resource not found', status: 404 },
 *   UNAUTHORIZED: { code: 'UNAUTHORIZED', message: 'Unauthorized access', status: 401 }
 * });
 * ```
 */
export function createErrorMap<T extends Record<string, { code: string; message: string; status?: number }>>(
  errors: T,
): T {
  return errors
}

/**
 * Creates a complete contract combining events, requests, and errors
 *
 * A contract defines the communication protocol between clients and servers,
 * including all events, requests/responses, and error types.
 *
 * @template TEvents - The type of event schemas
 * @template TRequests - The type of request schemas
 * @template TErrors - The type of error definitions
 * @param {Object} contract - The contract definition object
 * @param {string} [contract.name] - The name of the contract
 * @param {string} [contract.version] - The version of the contract
 * @param {string} [contract.description] - The description of the contract
 * @param {TEvents} contract.events - Event schemas for the contract
 * @param {TRequests} contract.requests - Request schemas for the contract
 * @param {TErrors} [contract.errors] - Error definitions for the contract
 * @returns {Object} - The complete contract with name, version, events, requests, and errors
 *
 * @example
 * ```typescript
 * const userContract = createContract({
 *   name: 'user-service',
 *   version: '1.0.0',
 *   description: 'User service contract',
 *   events: {
 *     userCreated: z.object({ id: z.string() }),
 *     userUpdated: z.object({ id: z.string(), changes: z.record(z.string()) })
 *   },
 *   requests: {
 *     getUser: {
 *       requestSchema: z.object({ id: z.string() }),
 *       responseSchema: z.object({ id: z.string(), name: z.string() })
 *     }
 *   },
 *   errors: {
 *     USER_NOT_FOUND: { code: 'USER_NOT_FOUND', message: 'User not found', status: 404 }
 *   }
 * });
 * ```
 */
export function createContract<
  TEvents extends EventSchemas,
  TRequests extends RequestSchemas,
  TErrors extends Record<string, { code: string; message: string; status?: number }>,
>(contract: {
  name?: string
  version?: string
  description?: string
  events: TEvents
  requests: TRequests
  errors?: TErrors
}): {
  name: string
  version: string
  description?: string
  events: TEvents
  requests: TRequests
  errors: TErrors | Record<string, never>
} {
  return {
    name: contract.name || 'unnamed-contract',
    version: contract.version || '1.0.0',
    description: contract.description,
    events: contract.events,
    requests: contract.requests,
    errors: contract.errors || ({} as Record<string, never>),
  }
}

/**
 * Creates a message context with default values for missing properties
 *
 * Message contexts carry metadata about messages, including authentication,
 * tracing information, and routing details.
 *
 * @param {Partial<MessageContext>} [context={}] - Partial message context to populate
 * @returns {MessageContext} - Complete message context with all required fields
 *
 * @example
 * ```typescript
 * // Create a basic context
 * const context = createMessageContext();
 *
 * // Create a context with authentication
 * const authContext = createMessageContext({
 *   auth: {
 *     token: 'jwt-token',
 *     actor: { id: 'user-123', type: 'user' }
 *   }
 * });
 *
 * // Create a context with tracing info
 * const tracingContext = createMessageContext({
 *   traceId: 'trace-123',
 *   spanId: 'span-456'
 * });
 * ```
 */
export function createMessageContext(context: Partial<MessageContext> = {}): MessageContext {
  return {
    id: context.id || crypto.randomUUID(),
    timestamp: context.timestamp || Date.now(),
    source: context.source,
    target: context.target,
    auth: context.auth,
    metadata: context.metadata || {},
    traceId: context.traceId || crypto.randomUUID(),
    spanId: context.spanId || crypto.randomUUID(),
    parentSpanId: context.parentSpanId,
  }
}
