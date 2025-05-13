import { Contract, IMessageContext, IRequestPayload, IResponsePayload, IEventPayload } from './types';
import { EnhancedMessageContext, EnhancedRequestPayload, EnhancedResponsePayload, EnhancedEventPayload } from './enhanced-types';

/**
 * Request middleware function
 */
export type RequestMiddlewareFunction<TContract extends Contract> = (
  request: EnhancedRequestPayload<TContract>, 
  context: EnhancedMessageContext
) => Promise<EnhancedRequestPayload<TContract> | void> | EnhancedRequestPayload<TContract> | void;

/**
 * Response middleware function
 */
export type ResponseMiddlewareFunction<TContract extends Contract> = (
  response: EnhancedResponsePayload<TContract>, 
  request: EnhancedRequestPayload<TContract>, 
  context: EnhancedMessageContext
) => Promise<EnhancedResponsePayload<TContract> | void> | EnhancedResponsePayload<TContract> | void;

/**
 * Event middleware function
 */
export type EventMiddlewareFunction<TContract extends Contract> = (
  event: EnhancedEventPayload<TContract>, 
  context: EnhancedMessageContext
) => Promise<EnhancedEventPayload<TContract> | void> | EnhancedEventPayload<TContract> | void;

/**
 * Error middleware function
 */
export type ErrorMiddlewareFunction<TContract extends Contract> = (
  error: Error, 
  request?: EnhancedRequestPayload<TContract>, 
  context?: EnhancedMessageContext
) => Promise<Error | void> | Error | void;

/**
 * Middleware execution phase
 */
export enum MiddlewarePhase {
  /**
   * Before a request is sent
   */
  BEFORE_REQUEST = 'beforeRequest',
  
  /**
   * After a request is sent but before the response is returned
   */
  AFTER_REQUEST = 'afterRequest',
  
  /**
   * Before a response is processed
   */
  BEFORE_RESPONSE = 'beforeResponse',
  
  /**
   * After a response is processed
   */
  AFTER_RESPONSE = 'afterResponse',
  
  /**
   * Before an event is sent
   */
  BEFORE_EVENT = 'beforeEvent',
  
  /**
   * Before an event is handled
   */
  BEFORE_EVENT_HANDLER = 'beforeEventHandler',
  
  /**
   * After an event is handled
   */
  AFTER_EVENT_HANDLER = 'afterEventHandler',
  
  /**
   * When an error occurs
   */
  ON_ERROR = 'onError'
}

/**
 * Middleware interface
 */
export interface Middleware<TContract extends Contract = any> {
  /**
   * Name of the middleware
   */
  name: string;
  
  /**
   * Priority of the middleware (lower number = higher priority)
   */
  priority?: number;
  
  /**
   * Before a request is sent
   */
  beforeRequest?: RequestMiddlewareFunction<TContract>;
  
  /**
   * After a request is sent but before the response is returned
   */
  afterRequest?: RequestMiddlewareFunction<TContract>;
  
  /**
   * Before a response is processed
   */
  beforeResponse?: ResponseMiddlewareFunction<TContract>;
  
  /**
   * After a response is processed
   */
  afterResponse?: ResponseMiddlewareFunction<TContract>;
  
  /**
   * Before an event is sent
   */
  beforeEvent?: EventMiddlewareFunction<TContract>;
  
  /**
   * Before an event is handled
   */
  beforeEventHandler?: EventMiddlewareFunction<TContract>;
  
  /**
   * After an event is handled
   */
  afterEventHandler?: EventMiddlewareFunction<TContract>;
  
  /**
   * When an error occurs
   */
  onError?: ErrorMiddlewareFunction<TContract>;
}

/**
 * MiddlewareManager handles execution of middleware chains
 */
export class MiddlewareManager<TContract extends Contract> {
  /**
   * Collection of registered middleware
   */
  private middleware: Middleware<TContract>[] = [];
  
  /**
   * Whether to enable debug logging
   */
  private debug = false;
  
  /**
   * Creates a new MiddlewareManager
   * @param debug Whether to enable debug logging
   */
  constructor(debug = false) {
    this.debug = debug;
  }
  
  /**
   * Adds middleware to the manager
   * @param middleware The middleware to add
   */
  add(middleware: Middleware<TContract>): void {
    this.middleware.push(middleware);
    
    // Sort middleware by priority (lower number = higher priority)
    this.middleware.sort((a, b) => {
      const priorityA = a.priority ?? 100;
      const priorityB = b.priority ?? 100;
      return priorityA - priorityB;
    });
    
    if (this.debug) {
      console.log(`[MiddlewareManager] Added middleware: ${middleware.name}`);
    }
  }
  
  /**
   * Removes middleware by name
   * @param name Name of the middleware to remove
   */
  remove(name: string): void {
    const initialCount = this.middleware.length;
    this.middleware = this.middleware.filter(m => m.name !== name);
    
    if (this.debug && initialCount !== this.middleware.length) {
      console.log(`[MiddlewareManager] Removed middleware: ${name}`);
    }
  }
  
  /**
   * Checks if a middleware with the specified name exists
   * @param name Name of the middleware to check
   */
  has(name: string): boolean {
    return this.middleware.some(m => m.name === name);
  }
  
  /**
   * Gets all middleware with the specified phase
   * @param phase The middleware phase
   */
  private getMiddlewareForPhase(phase: MiddlewarePhase): Middleware<TContract>[] {
    return this.middleware.filter(m => m[phase] !== undefined);
  }
  
  /**
   * Executes request middleware chain
   * @param phase The middleware phase to execute
   * @param request The request payload
   * @param context The message context
   */
  async executeRequestMiddleware(
    phase: MiddlewarePhase.BEFORE_REQUEST | MiddlewarePhase.AFTER_REQUEST,
    request: IRequestPayload<TContract>,
    context: IMessageContext
  ): Promise<IRequestPayload<TContract>> {
    let currentRequest = request;
    
    if (this.debug) {
      console.log(`[MiddlewareManager] Executing ${phase} middleware chain`);
    }
    
    const middlewareList = this.getMiddlewareForPhase(phase);
    
    for (const middleware of middlewareList) {
      try {
        const middlewareFn = middleware[phase] as RequestMiddlewareFunction<TContract>;
        const result = await middlewareFn(currentRequest, context);
        
        if (result) {
          currentRequest = result;
        }
        
        if (this.debug) {
          console.log(`[MiddlewareManager] ${middleware.name}.${phase} executed successfully`);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        
        if (this.debug) {
          console.error(`[MiddlewareManager] Error in ${middleware.name}.${phase}:`, error);
        }
        
        // Execute error middleware
        await this.executeErrorMiddleware(error, currentRequest, context);
        
        // Re-throw the error to stop the middleware chain
        throw error;
      }
    }
    
    return currentRequest;
  }
  
  /**
   * Executes response middleware chain
   * @param phase The middleware phase to execute
   * @param response The response payload
   * @param request The original request payload
   * @param context The message context
   */
  async executeResponseMiddleware(
    phase: MiddlewarePhase.BEFORE_RESPONSE | MiddlewarePhase.AFTER_RESPONSE,
    response: IResponsePayload<TContract>,
    request: IRequestPayload<TContract>,
    context: IMessageContext
  ): Promise<IResponsePayload<TContract>> {
    let currentResponse = response;
    
    if (this.debug) {
      console.log(`[MiddlewareManager] Executing ${phase} middleware chain`);
    }
    
    const middlewareList = this.getMiddlewareForPhase(phase);
    
    for (const middleware of middlewareList) {
      try {
        const middlewareFn = middleware[phase] as ResponseMiddlewareFunction<TContract>;
        const result = await middlewareFn(currentResponse, request, context);
        
        if (result) {
          currentResponse = result;
        }
        
        if (this.debug) {
          console.log(`[MiddlewareManager] ${middleware.name}.${phase} executed successfully`);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        
        if (this.debug) {
          console.error(`[MiddlewareManager] Error in ${middleware.name}.${phase}:`, error);
        }
        
        // Execute error middleware
        await this.executeErrorMiddleware(error, request, context);
        
        // Re-throw the error to stop the middleware chain
        throw error;
      }
    }
    
    return currentResponse;
  }
  
  /**
   * Executes event middleware chain
   * @param phase The middleware phase to execute
   * @param event The event payload
   * @param context The message context
   */
  async executeEventMiddleware(
    phase: MiddlewarePhase.BEFORE_EVENT | MiddlewarePhase.BEFORE_EVENT_HANDLER | MiddlewarePhase.AFTER_EVENT_HANDLER,
    event: IEventPayload<TContract>,
    context: IMessageContext
  ): Promise<IEventPayload<TContract>> {
    let currentEvent = event;
    
    if (this.debug) {
      console.log(`[MiddlewareManager] Executing ${phase} middleware chain`);
    }
    
    const middlewareList = this.getMiddlewareForPhase(phase);
    
    for (const middleware of middlewareList) {
      try {
        const middlewareFn = middleware[phase] as EventMiddlewareFunction<TContract>;
        const result = await middlewareFn(currentEvent, context);
        
        if (result) {
          currentEvent = result;
        }
        
        if (this.debug) {
          console.log(`[MiddlewareManager] ${middleware.name}.${phase} executed successfully`);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        
        if (this.debug) {
          console.error(`[MiddlewareManager] Error in ${middleware.name}.${phase}:`, error);
        }
        
        // Execute error middleware
        await this.executeErrorMiddleware(error, undefined, context);
        
        // Re-throw the error to stop the middleware chain
        throw error;
      }
    }
    
    return currentEvent;
  }
  
  /**
   * Executes error middleware chain
   * @param error The error that occurred
   * @param request The original request payload (optional)
   * @param context The message context (optional)
   */
  async executeErrorMiddleware(
    error: Error,
    request?: IRequestPayload<TContract>,
    context?: IMessageContext
  ): Promise<Error> {
    let currentError = error;
    
    if (this.debug) {
      console.log(`[MiddlewareManager] Executing error middleware chain for error: ${error.message}`);
    }
    
    const middlewareList = this.getMiddlewareForPhase(MiddlewarePhase.ON_ERROR);
    
    for (const middleware of middlewareList) {
      try {
        const middlewareFn = middleware.onError as ErrorMiddlewareFunction<TContract>;
        const result = await middlewareFn(currentError, request, context);
        
        if (result instanceof Error) {
          currentError = result;
        }
        
        if (this.debug) {
          console.log(`[MiddlewareManager] ${middleware.name}.onError executed successfully`);
        }
      } catch (err) {
        const newError = err instanceof Error ? err : new Error(String(err));
        
        if (this.debug) {
          console.error(`[MiddlewareManager] Error in ${middleware.name}.onError:`, newError);
        }
        
        // We don't want to throw from the error middleware chain, so we just log it
        console.error(`[MiddlewareManager] Error in error middleware ${middleware.name}:`, newError);
      }
    }
    
    return currentError;
  }
}

/**
 * Built-in middleware for logging requests and responses
 * @param options Logging options
 */
export function createLoggingMiddleware<TContract extends Contract>(
  options: {
    logRequests?: boolean;
    logResponses?: boolean;
    logEvents?: boolean;
    logErrors?: boolean;
    redactFields?: string[];
    logger?: (message: string, ...args: any[]) => void;
  } = {}
): Middleware<TContract> {
  const {
    logRequests = true,
    logResponses = true,
    logEvents = true,
    logErrors = true,
    redactFields = ['password', 'token', 'secret', 'apiKey', 'authorization'],
    logger = console.log
  } = options;
  
  /**
   * Redacts sensitive fields from an object
   * @param obj The object to redact
   */
  const redact = (obj: any): any => {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    const result = Array.isArray(obj) ? [...obj] : { ...obj };
    
    for (const key in result) {
      if (redactFields.includes(key.toLowerCase())) {
        result[key] = '[REDACTED]';
      } else if (typeof result[key] === 'object') {
        result[key] = redact(result[key]);
      }
    }
    
    return result;
  };
  
  return {
    name: 'logging-middleware',
    priority: 999, // Run last to capture all changes
    
    beforeRequest: logRequests ? (request, context) => {
      logger(`Request >> ${request.type}`, {
        requestId: request.requestId,
        data: redact(request.data),
        context: {
          actorId: context.actorId,
          source: context.source,
          correlationId: context.correlationId
        }
      });
    } : undefined,
    
    afterResponse: logResponses ? (response, request, context) => {
      logger(`Response << ${request.type}`, {
        requestId: request.requestId,
        data: redact(response.data),
        success: response.success,
        error: response.error,
        context: {
          actorId: context.actorId,
          source: context.source,
          correlationId: context.correlationId
        }
      });
    } : undefined,
    
    beforeEvent: logEvents ? (event, context) => {
      logger(`Event >> ${event.type}`, {
        data: redact(event.data),
        context: {
          actorId: context.actorId,
          source: context.source,
          correlationId: context.correlationId
        }
      });
    } : undefined,
    
    onError: logErrors ? (error, request, context) => {
      logger(`Error in ${request?.type || 'unknown'}`, {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        request: request ? {
          type: request.type,
          requestId: request.requestId,
          data: redact(request.data)
        } : undefined,
        context: context ? {
          actorId: context.actorId,
          source: context.source,
          correlationId: context.correlationId
        } : undefined
      });
    } : undefined
  };
}

/**
 * Built-in middleware for performance monitoring
 * @param options Performance monitoring options
 */
export function createPerformanceMiddleware<TContract extends Contract>(
  options: {
    onRequestStart?: (request: IRequestPayload<TContract>, context: IMessageContext) => void;
    onRequestEnd?: (request: IRequestPayload<TContract>, response: IResponsePayload<TContract>, duration: number, context: IMessageContext) => void;
    onError?: (error: Error, request?: IRequestPayload<TContract>, duration?: number, context?: IMessageContext) => void;
  } = {}
): Middleware<TContract> {
  const requestTimers = new Map<string, number>();
  
  return {
    name: 'performance-middleware',
    priority: 0, // Run first
    
    beforeRequest: (request, context) => {
      requestTimers.set(request.requestId || `req-${Date.now()}`, Date.now());
      
      if (options.onRequestStart) {
        options.onRequestStart(request, context);
      }
    },
    
    afterResponse: (response, request, context) => {
      const requestId = request.requestId || `req-${Date.now()}`;
      const startTime = requestTimers.get(requestId);
      
      if (startTime) {
        const duration = Date.now() - startTime;
        requestTimers.delete(requestId);
        
        if (options.onRequestEnd) {
          options.onRequestEnd(request, response, duration, context);
        }
      }
    },
    
    onError: (error, request, context) => {
      if (request) {
        const requestId = request.requestId || `req-${Date.now()}`;
      const startTime = requestTimers.get(requestId);
        
        if (startTime) {
          const duration = Date.now() - startTime;
          requestTimers.delete(requestId);
          
          if (options.onError) {
            options.onError(error, request, duration, context);
          }
        } else if (options.onError) {
          options.onError(error, request, undefined, context);
        }
      } else if (options.onError) {
        options.onError(error);
      }
    }
  };
}

/**
 * Built-in middleware for authentication
 * @param options Authentication options
 */
export function createAuthenticationMiddleware<TContract extends Contract>(
  options: {
    getAuthToken?: (context: IMessageContext) => string | undefined;
    verifyAuthToken?: (token: string, context: IMessageContext) => Promise<boolean> | boolean;
    addAuthToken?: (request: IRequestPayload<TContract>, context: IMessageContext) => Promise<IRequestPayload<TContract>> | IRequestPayload<TContract>;
    excludeRequests?: string[];
    excludeEvents?: string[];
  }
): Middleware<TContract> {
  return {
    name: 'authentication-middleware',
    priority: 10, // Run early but after performance monitoring
    
    beforeRequest: async (request, context) => {
      // Skip excluded requests
      if (options.excludeRequests?.includes(request.type)) {
        return;
      }
      
      if (options.addAuthToken) {
        return await options.addAuthToken(request, context);
      }
    },
    
    beforeEventHandler: async (event, context) => {
      // Skip excluded events
      if (options.excludeEvents?.includes(event.type)) {
        return;
      }
      
      // Verify auth token if provided
      if (options.getAuthToken && options.verifyAuthToken) {
        const token = options.getAuthToken(context);
        
        if (!token) {
          throw new Error('Authentication token is missing');
        }
        
        const isValid = await options.verifyAuthToken(token, context);
        
        if (!isValid) {
          throw new Error('Authentication token is invalid');
        }
      }
    }
  };
}

/**
 * Built-in middleware for request validation using Zod schemas
 * @param requestSchemas Map of request schemas
 */
export function createValidationMiddleware<TContract extends Contract>(
  contractTypeMap: Map<string, any>
): Middleware<TContract> {
  return {
    name: 'validation-middleware',
    priority: 20, // Run after authentication
    
    beforeRequest: (request, context) => {
      const schema = contractTypeMap.get(request.type);
      
      if (schema?.request) {
        try {
          const validated = schema.request.parse(request.data);
          request.data = validated;
        } catch (error) {
          throw new Error(`Validation error for request ${request.type}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    },
    
    beforeResponse: (response, request, context) => {
      const schema = contractTypeMap.get(request.type);
      
      if (schema?.response) {
        try {
          const validated = schema.response.parse(response.data);
          response.data = validated;
        } catch (error) {
          throw new Error(`Validation error for response to ${request.type}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    },
    
    beforeEventHandler: (event, context) => {
      const schema = contractTypeMap.get(event.type);
      
      if (schema?.schema) {
        try {
          const validated = schema.schema.parse(event.data);
          event.data = validated;
        } catch (error) {
          throw new Error(`Validation error for event ${event.type}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  };
}

/**
 * Built-in middleware for telemetry integration
 * @param options Telemetry options
 */
export function createTelemetryMiddleware<TContract extends Contract>(
  options: {
    createSpan: (name: string, fn: (span: any) => Promise<any> | any) => Promise<any> | any;
    addAttributes: (attributes: Record<string, string | number | boolean>) => void;
    recordError: (error: Error) => void;
  }
): Middleware<TContract> {
  return {
    name: 'telemetry-middleware',
    priority: 5, // Run after performance but before other middleware
    
    beforeRequest: (request, context) => {
      options.addAttributes({
        'request.type': request.type,
        'request.id': request.requestId || 'unknown',
        'context.actorId': context.actorId || 'unknown',
        'context.source': context.source || 'unknown',
        'context.correlationId': context.correlationId || 'unknown'
      });
    },
    
    beforeEvent: (event, context) => {
      options.addAttributes({
        'event.type': event.type,
        'context.actorId': context.actorId || 'unknown',
        'context.source': context.source || 'unknown',
        'context.correlationId': context.correlationId || 'unknown'
      });
    },
    
    onError: (error, request, context) => {
      options.recordError(error);
      
      options.addAttributes({
        'error.message': error.message,
        'error.name': error.name
      });
      
      if (request) {
        options.addAttributes({
          'request.type': request.type,
          'request.id': request.requestId || 'unknown'
        });
      }
    }
  };
}