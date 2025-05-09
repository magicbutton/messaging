import type { EventSchemas, RequestSchemas, MessageContext } from "./types"

/**
 * Create a request schema map
 * @param schemas The request schemas
 * @returns The request schema map
 */
export function createRequestSchemaMap<T extends RequestSchemas>(schemas: T): T {
  return schemas
}

/**
 * Create an event map
 * @param schemas The event schemas
 * @returns The event map
 */
export function createEventMap<T extends EventSchemas>(schemas: T): T {
  return schemas
}

/**
 * Create an error map
 * @param errors The error definitions
 * @returns The error map
 */
export function createErrorMap<T extends Record<string, { code: string; message: string; status?: number }>>(
  errors: T,
): T {
  return errors
}

/**
 * Create a contract
 * @param events The event schemas
 * @param requests The request schemas
 * @param errors The error definitions
 * @returns The contract
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
 * Create a message context
 * @param context The message context
 * @returns The message context
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
