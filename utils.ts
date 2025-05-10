import type { EventSchemas, RequestSchemas, MessageContext } from "./types"

/**
 * Creates a type-safe request schema map for defining request/response pairs
 *
 * This function helps maintain type safety when defining request schemas.
 * It simply returns the input object, but with proper TypeScript typing.
 *
 * @template T - The type of request schemas
 * @param {T} schemas - Object containing request schemas with requestSchema and responseSchema
 * @returns {T} - The validated request schema map
 *
 * @example
 * ```typescript
 * const requestSchemas = createRequestSchemaMap({
 *   getUser: {
 *     requestSchema: z.object({ userId: z.string() }),
 *     responseSchema: z.object({ name: z.string(), email: z.string() })
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
 *
 * @template T - The type of event schemas
 * @param {T} schemas - Object containing event schemas
 * @returns {T} - The validated event schema map
 *
 * @example
 * ```typescript
 * const eventSchemas = createEventMap({
 *   userCreated: z.object({ userId: z.string(), timestamp: z.number() }),
 *   userDeleted: z.object({ userId: z.string(), timestamp: z.number() })
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
 * @param {TEvents} contract.events - Event schemas for the contract
 * @param {TRequests} contract.requests - Request schemas for the contract
 * @param {TErrors} [contract.errors] - Error definitions for the contract
 * @returns {Object} - The complete contract with events, requests, and errors
 *
 * @example
 * ```typescript
 * const userContract = createContract({
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
  events: TEvents
  requests: TRequests
  errors?: TErrors
}): {
  events: TEvents
  requests: TRequests
  errors: TErrors | Record<string, never>
} {
  return {
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
