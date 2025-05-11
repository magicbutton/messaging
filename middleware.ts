import type { 
  MessageContext, 
  EventPayload, 
  RequestPayload, 
  ResponsePayload,
  EventSchemas,
  RequestSchemas
} from "./types"
import * as z from "zod"
import { getObservabilityProvider } from "./observability"

/**
 * Middleware function type for events
 */
export type EventMiddleware<T = any> = (
  event: EventPayload<T>,
  next: (event: EventPayload<T>) => Promise<void>
) => Promise<void>

/**
 * Middleware function type for requests
 */
export type RequestMiddleware<TReq = any, TRes = any> = (
  request: RequestPayload<TReq>,
  next: (request: RequestPayload<TReq>) => Promise<ResponsePayload<TRes>>
) => Promise<ResponsePayload<TRes>>

/**
 * Middleware manager for handling multiple middleware functions
 */
export class MiddlewareManager {
  private eventMiddleware: Map<string, EventMiddleware[]> = new Map()
  private requestMiddleware: Map<string, RequestMiddleware[]> = new Map()
  private globalEventMiddleware: EventMiddleware[] = []
  private globalRequestMiddleware: RequestMiddleware[] = []
  private logger = getObservabilityProvider().getLogger("middleware")

  /**
   * Add middleware for a specific event type
   * @param eventType Event type
   * @param middleware Middleware function
   * @returns MiddlewareManager instance for chaining
   */
  useEventMiddleware<T = any>(eventType: string, middleware: EventMiddleware<T>): this {
    const middlewares = this.eventMiddleware.get(eventType) || []
    middlewares.push(middleware as EventMiddleware)
    this.eventMiddleware.set(eventType, middlewares)
    return this
  }

  /**
   * Add middleware for a specific request type
   * @param requestType Request type
   * @param middleware Middleware function
   * @returns MiddlewareManager instance for chaining
   */
  useRequestMiddleware<TReq = any, TRes = any>(
    requestType: string, 
    middleware: RequestMiddleware<TReq, TRes>
  ): this {
    const middlewares = this.requestMiddleware.get(requestType) || []
    middlewares.push(middleware as RequestMiddleware)
    this.requestMiddleware.set(requestType, middlewares)
    return this
  }

  /**
   * Add global middleware for all events
   * @param middleware Middleware function
   * @returns MiddlewareManager instance for chaining
   */
  useGlobalEventMiddleware<T = any>(middleware: EventMiddleware<T>): this {
    this.globalEventMiddleware.push(middleware as EventMiddleware)
    return this
  }

  /**
   * Add global middleware for all requests
   * @param middleware Middleware function
   * @returns MiddlewareManager instance for chaining
   */
  useGlobalRequestMiddleware<TReq = any, TRes = any>(
    middleware: RequestMiddleware<TReq, TRes>
  ): this {
    this.globalRequestMiddleware.push(middleware as RequestMiddleware)
    return this
  }

  /**
   * Process an event through the middleware chain
   * @param event Event payload
   * @returns Promise resolved when processing is complete
   */
  async processEvent<T = any>(event: EventPayload<T>): Promise<void> {
    const middlewares = [
      ...this.globalEventMiddleware,
      ...(this.eventMiddleware.get(event.type) || [])
    ]

    // If no middleware, just return
    if (middlewares.length === 0) {
      return
    }

    const executeMiddlewareChain = async (
      event: EventPayload<T>, 
      middlewareIndex: number
    ): Promise<void> => {
      // If we've processed all middleware, we're done
      if (middlewareIndex >= middlewares.length) {
        return
      }

      const currentMiddleware = middlewares[middlewareIndex]
      
      // Execute the current middleware, passing a function that will execute the next one
      return currentMiddleware(event, async (updatedEvent) => {
        return executeMiddlewareChain(updatedEvent, middlewareIndex + 1)
      })
    }

    try {
      await executeMiddlewareChain(event, 0)
    } catch (error) {
      this.logger.error(`Error in event middleware chain for ${event.type}`, 
        error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * Process a request through the middleware chain
   * @param request Request payload
   * @returns Promise with response payload
   */
  async processRequest<TReq = any, TRes = any>(
    request: RequestPayload<TReq>
  ): Promise<ResponsePayload<TRes>> {
    const middlewares = [
      ...this.globalRequestMiddleware,
      ...(this.requestMiddleware.get(request.type) || [])
    ]

    // If no middleware, return empty successful response
    if (middlewares.length === 0) {
      return {
        success: true,
        context: request.context
      }
    }

    const executeMiddlewareChain = async (
      request: RequestPayload<TReq>, 
      middlewareIndex: number
    ): Promise<ResponsePayload<TRes>> => {
      // If we've processed all middleware, return success
      if (middlewareIndex >= middlewares.length) {
        return {
          success: true,
          context: request.context
        }
      }

      const currentMiddleware = middlewares[middlewareIndex]
      
      // Execute the current middleware, passing a function that will execute the next one
      return currentMiddleware(request, async (updatedRequest) => {
        return executeMiddlewareChain(updatedRequest, middlewareIndex + 1)
      })
    }

    try {
      return await executeMiddlewareChain(request, 0)
    } catch (error) {
      this.logger.error(`Error in request middleware chain for ${request.type}`, 
        error instanceof Error ? error : new Error(String(error)))
      
      // Return error response
      return {
        success: false,
        error: {
          code: "middleware_error",
          message: error instanceof Error ? error.message : String(error),
          details: error instanceof Error ? error.stack : undefined
        },
        context: request.context
      }
    }
  }
}

/**
 * Create a validation middleware for events
 * @param eventSchemas Event schemas to validate against
 * @returns Event middleware function
 */
export function createEventValidationMiddleware<TEvents extends EventSchemas>(
  eventSchemas: TEvents
): EventMiddleware {
  const logger = getObservabilityProvider().getLogger("validation.event")
  
  return async (event, next) => {
    const schemaObj = eventSchemas[event.type]

    if (!schemaObj) {
      logger.warn(`No schema found for event type: ${event.type}`)
      return next(event)
    }

    // Get the actual schema (handle both direct schema or {schema, description} format)
    const schema = 'schema' in schemaObj ? schemaObj.schema : schemaObj

    try {
      // Validate the event payload against the schema
      const validatedPayload = schema.parse(event.payload)

      // Continue with validated payload
      return next({
        ...event,
        payload: validatedPayload
      })
    } catch (error) {
      logger.error(`Validation error for event ${event.type}`, 
        error instanceof Error ? error : new Error(String(error)))
      
      // Convert Zod error to something more readable
      if (error instanceof z.ZodError) {
        const formattedError = new Error(
          `Validation error for event ${event.type}: ${error.errors.map(e => 
            `${e.path.join('.')}: ${e.message}`).join(', ')}`
        )
        throw formattedError
      }
      
      throw error
    }
  }
}

/**
 * Create a validation middleware for requests
 * @param requestSchemas Request schemas to validate against
 * @returns Request middleware function
 */
export function createRequestValidationMiddleware<TRequests extends RequestSchemas>(
  requestSchemas: TRequests
): RequestMiddleware {
  const logger = getObservabilityProvider().getLogger("validation.request")

  return async (request, next) => {
    const schemasObj = requestSchemas[request.type]

    if (!schemasObj) {
      logger.warn(`No schema found for request type: ${request.type}`)
      return next(request)
    }

    // Get the actual schemas (handle both formats)
    const requestSchema = 'requestSchema' in schemasObj ? schemasObj.requestSchema : schemasObj.request
    const responseSchema = 'responseSchema' in schemasObj ? schemasObj.responseSchema : schemasObj.response

    try {
      // Validate the request payload against the schema
      const validatedPayload = requestSchema.parse(request.payload)

      // Continue with validated payload
      const response = await next({
        ...request,
        payload: validatedPayload
      })

      // If response is successful, validate it too
      if (response.success && response.data) {
        try {
          const validatedResponse = responseSchema.parse(response.data)
          return {
            ...response,
            data: validatedResponse
          }
        } catch (error) {
          logger.error(`Validation error for response to ${request.type}`,
            error instanceof Error ? error : new Error(String(error)))

          // Convert Zod error to something more readable
          if (error instanceof z.ZodError) {
            return {
              success: false,
              error: {
                code: "response_validation_error",
                message: `Response validation failed`,
                details: error.errors.map(e => ({
                  path: e.path.join('.'),
                  message: e.message
                }))
              },
              context: response.context
            }
          }

          return {
            success: false,
            error: {
              code: "response_validation_error",
              message: error instanceof Error ? error.message : String(error)
            },
            context: response.context
          }
        }
      }

      return response
    } catch (error) {
      logger.error(`Validation error for request ${request.type}`,
        error instanceof Error ? error : new Error(String(error)))

      // Convert Zod error to something more readable
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: {
            code: "request_validation_error",
            message: `Request validation failed`,
            details: error.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message
            }))
          },
          context: request.context
        }
      }

      return {
        success: false,
        error: {
          code: "request_validation_error",
          message: error instanceof Error ? error.message : String(error)
        },
        context: request.context
      }
    }
  }
}

/**
 * Create a logging middleware for events
 * @returns Event middleware function
 */
export function createEventLoggingMiddleware(): EventMiddleware {
  const logger = getObservabilityProvider().getLogger("middleware.event")
  
  return async (event, next) => {
    const startTime = Date.now()
    logger.debug(`Event ${event.type} processing started`, {
      context: {
        id: event.context?.id,
        traceId: event.context?.traceId,
        spanId: event.context?.spanId
      }
    })
    
    try {
      await next(event)
      
      const duration = Date.now() - startTime
      logger.debug(`Event ${event.type} processed successfully`, {
        duration,
        context: {
          id: event.context?.id,
          traceId: event.context?.traceId,
          spanId: event.context?.spanId
        }
      })
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(`Error processing event ${event.type}`, error instanceof Error ? error : new Error(String(error)), {
        duration,
        context: {
          id: event.context?.id,
          traceId: event.context?.traceId,
          spanId: event.context?.spanId
        }
      })
      
      throw error
    }
  }
}

/**
 * Create a logging middleware for requests
 * @returns Request middleware function
 */
export function createRequestLoggingMiddleware(): RequestMiddleware {
  const logger = getObservabilityProvider().getLogger("middleware.request")
  
  return async (request, next) => {
    const startTime = Date.now()
    logger.debug(`Request ${request.type} processing started`, {
      context: {
        id: request.context?.id,
        traceId: request.context?.traceId,
        spanId: request.context?.spanId
      }
    })
    
    try {
      const response = await next(request)
      
      const duration = Date.now() - startTime
      if (response.success) {
        logger.debug(`Request ${request.type} processed successfully`, {
          duration,
          context: {
            id: request.context?.id,
            traceId: request.context?.traceId,
            spanId: request.context?.spanId
          }
        })
      } else {
        logger.warn(`Request ${request.type} failed`, {
          error: response.error,
          duration,
          context: {
            id: request.context?.id,
            traceId: request.context?.traceId,
            spanId: request.context?.spanId
          }
        })
      }
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(`Error processing request ${request.type}`, error instanceof Error ? error : new Error(String(error)), {
        duration,
        context: {
          id: request.context?.id,
          traceId: request.context?.traceId,
          spanId: request.context?.spanId
        }
      })
      
      return {
        success: false,
        error: {
          code: "middleware_error",
          message: error instanceof Error ? error.message : String(error),
          details: error instanceof Error ? error.stack : undefined
        },
        context: request.context
      }
    }
  }
}

/**
 * Create an authentication middleware for requests
 * @param authCheck Function to check if the request is authenticated
 * @param options Options for the middleware
 * @returns Request middleware function
 */
export function createAuthenticationMiddleware(
  authCheck: (context: MessageContext) => boolean | Promise<boolean>,
  options: {
    exclude?: string[]
  } = {}
): RequestMiddleware {
  const logger = getObservabilityProvider().getLogger("middleware.auth")
  const { exclude = [] } = options
  
  return async (request, next) => {
    // Skip authentication for excluded request types
    if (exclude.includes(request.type)) {
      return next(request)
    }
    
    // Check if authenticated
    try {
      const isAuthenticated = await authCheck(request.context || {})
      
      if (!isAuthenticated) {
        logger.warn(`Authentication failed for request ${request.type}`, {
          context: {
            id: request.context?.id,
            traceId: request.context?.traceId,
            spanId: request.context?.spanId
          }
        })
        
        return {
          success: false,
          error: {
            code: "authentication_error",
            message: "Authentication failed"
          },
          context: request.context
        }
      }
      
      return next(request)
    } catch (error) {
      logger.error(`Error in authentication middleware for request ${request.type}`, 
        error instanceof Error ? error : new Error(String(error)))
      
      return {
        success: false,
        error: {
          code: "authentication_error",
          message: "Authentication check failed",
          details: error instanceof Error ? error.message : String(error)
        },
        context: request.context
      }
    }
  }
}