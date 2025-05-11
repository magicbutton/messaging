import {
  EventMiddleware,
  RequestMiddleware,
  MiddlewareManager,
  createEventValidationMiddleware,
  createRequestValidationMiddleware,
  createEventLoggingMiddleware,
  createRequestLoggingMiddleware,
  createAuthenticationMiddleware
} from "./middleware";
import {
  MiddlewareFactory,
  MiddlewareConfig,
  MiddlewareProvider
} from "./middleware-factory";
import { Contract, MessageContext } from "./types";
import { getObservabilityProvider } from "./observability";

/**
 * Default implementation of middleware provider
 */
export class DefaultMiddlewareProvider implements MiddlewareProvider {
  private eventMiddlewares = new Map<string, EventMiddleware>();
  private requestMiddlewares = new Map<string, RequestMiddleware>();
  private logger = getObservabilityProvider().getLogger("middleware-provider");

  /**
   * Register a named event middleware
   * @param name The middleware name
   * @param middleware The middleware function
   */
  registerEventMiddleware(name: string, middleware: EventMiddleware): void {
    this.eventMiddlewares.set(name, middleware);
    this.logger.debug(`Registered event middleware: ${name}`);
  }

  /**
   * Register a named request middleware
   * @param name The middleware name
   * @param middleware The middleware function
   */
  registerRequestMiddleware(name: string, middleware: RequestMiddleware): void {
    this.requestMiddlewares.set(name, middleware);
    this.logger.debug(`Registered request middleware: ${name}`);
  }

  /**
   * Get an event middleware by name
   * @param name The middleware name
   */
  getEventMiddleware(name: string): EventMiddleware | null {
    const middleware = this.eventMiddlewares.get(name);
    if (!middleware) {
      this.logger.warn(`Event middleware not found: ${name}`);
      return null;
    }
    return middleware;
  }

  /**
   * Get a request middleware by name
   * @param name The middleware name
   */
  getRequestMiddleware(name: string): RequestMiddleware | null {
    const middleware = this.requestMiddlewares.get(name);
    if (!middleware) {
      this.logger.warn(`Request middleware not found: ${name}`);
      return null;
    }
    return middleware;
  }

  /**
   * Clear all registered middleware (primarily for testing)
   */
  clear(): void {
    this.eventMiddlewares.clear();
    this.requestMiddlewares.clear();
  }
}

/**
 * Default authentication function that always succeeds
 * (intended to be replaced in actual implementation)
 */
const defaultAuthFn = (context: MessageContext): boolean => {
  return true;
};

/**
 * Default middleware factory implementation
 */
export class DefaultMiddlewareFactory<TContract extends Contract> implements MiddlewareFactory<TContract> {
  /**
   * Create a middleware manager with the specified configuration
   * @param config The middleware configuration
   * @param contract The contract for validation middleware
   * @param middlewareProvider Optional provider for custom middleware
   */
  createMiddlewareManager(
    config: MiddlewareConfig,
    contract: TContract,
    middlewareProvider?: MiddlewareProvider
  ): MiddlewareManager {
    const manager = new MiddlewareManager();
    const logger = getObservabilityProvider().getLogger("middleware-factory");
    
    // Configure middleware based on config
    const options = config.options || {};
    
    // Add validation middleware if requested
    if (options.validation !== false) {
      logger.debug("Adding validation middleware");
      
      // Add event validation middleware
      const eventValidationMiddleware = createEventValidationMiddleware(contract.events);
      manager.useGlobalEventMiddleware(eventValidationMiddleware);
      
      // Add request validation middleware
      const requestValidationMiddleware = createRequestValidationMiddleware(contract.requests);
      manager.useGlobalRequestMiddleware(requestValidationMiddleware);
    }
    
    // Add logging middleware if requested
    if (options.logging !== false) {
      logger.debug("Adding logging middleware");
      
      // Add event logging middleware
      const eventLoggingMiddleware = createEventLoggingMiddleware();
      manager.useGlobalEventMiddleware(eventLoggingMiddleware);
      
      // Add request logging middleware
      const requestLoggingMiddleware = createRequestLoggingMiddleware();
      manager.useGlobalRequestMiddleware(requestLoggingMiddleware);
    }
    
    // Add authentication middleware if requested
    if (options.authentication?.enabled) {
      logger.debug("Adding authentication middleware");
      
      const authFn = options.authentication.authFn || defaultAuthFn;
      const excludedRequests = options.authentication.excludedRequests || [];
      
      const authMiddleware = createAuthenticationMiddleware(authFn, {
        exclude: excludedRequests
      });
      
      manager.useGlobalRequestMiddleware(authMiddleware);
    }
    
    // Add custom middleware if provided
    if (options.custom && middlewareProvider) {
      // Add custom event middleware
      if (options.custom.eventMiddlewares) {
        for (const config of options.custom.eventMiddlewares) {
          const middleware = middlewareProvider.getEventMiddleware(config.name);
          
          if (middleware) {
            if (config.global) {
              // Register as global middleware
              logger.debug(`Adding global event middleware: ${config.name}`);
              manager.useGlobalEventMiddleware(middleware);
            } else if (config.eventTypes) {
              // Register for specific event types
              for (const eventType of config.eventTypes) {
                logger.debug(`Adding event middleware ${config.name} for type: ${eventType}`);
                manager.useEventMiddleware(eventType, middleware);
              }
            }
          }
        }
      }
      
      // Add custom request middleware
      if (options.custom.requestMiddlewares) {
        for (const config of options.custom.requestMiddlewares) {
          const middleware = middlewareProvider.getRequestMiddleware(config.name);
          
          if (middleware) {
            if (config.global) {
              // Register as global middleware
              logger.debug(`Adding global request middleware: ${config.name}`);
              manager.useGlobalRequestMiddleware(middleware);
            } else if (config.requestTypes) {
              // Register for specific request types
              for (const requestType of config.requestTypes) {
                logger.debug(`Adding request middleware ${config.name} for type: ${requestType}`);
                manager.useRequestMiddleware(requestType, middleware);
              }
            }
          }
        }
      }
    }
    
    return manager;
  }
}

// Register the default middleware factory and provider
import { MiddlewareRegistry } from "./middleware-factory";

// Create and register the default middleware provider
const defaultProvider = new DefaultMiddlewareProvider();
MiddlewareRegistry.registerMiddlewareProvider("default", defaultProvider);

// Register the default middleware factory
MiddlewareRegistry.registerFactory("default", new DefaultMiddlewareFactory<any>());