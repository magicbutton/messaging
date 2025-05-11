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
  Contract,
  MessageContext
} from "./types";

/**
 * Configuration for middleware factory system
 *
 * This configuration structure enables declarative middleware setup
 * through the factory pattern, allowing middleware to be configured
 * without direct component references.
 */
export interface MiddlewareConfig {
  /**
   * The middleware factory type to use
   */
  type: string;

  /**
   * Middleware configuration options
   */
  options?: {
    /**
     * Enable/disable schema validation middleware
     * Default: true
     */
    validation?: boolean;

    /**
     * Enable/disable logging middleware
     * Default: true
     */
    logging?: boolean;

    /**
     * Authentication middleware configuration
     */
    authentication?: {
      /**
       * Enable/disable authentication middleware
       */
      enabled: boolean;

      /**
       * Request types excluded from authentication
       */
      excludedRequests?: string[];

      /**
       * Custom authentication function
       */
      authFn?: (context: MessageContext) => boolean | Promise<boolean>;
    };

    /**
     * Custom middleware configuration
     */
    custom?: {
      /**
       * Event middleware configurations
       */
      eventMiddlewares?: Array<{
        /**
         * Middleware name for lookup in the provider
         */
        name: string;

        /**
         * Whether middleware applies to all events
         */
        global?: boolean;

        /**
         * Specific event types this middleware applies to
         * Only used when global is false
         */
        eventTypes?: string[];
      }>;

      /**
       * Request middleware configurations
       */
      requestMiddlewares?: Array<{
        /**
         * Middleware name for lookup in the provider
         */
        name: string;

        /**
         * Whether middleware applies to all requests
         */
        global?: boolean;

        /**
         * Specific request types this middleware applies to
         * Only used when global is false
         */
        requestTypes?: string[];
      }>;
    };

    /**
     * Additional custom configuration options
     */
    [key: string]: any;
  };
}

/**
 * Provider interface for supplying named middleware instances
 *
 * This provider pattern enables middleware to be registered by name
 * and retrieved by the factory system, allowing for pluggable
 * middleware components without tight coupling.
 */
export interface MiddlewareProvider {
  /**
   * Get a named event middleware instance
   *
   * @param name The registered middleware name
   * @returns The middleware function or null if not found
   */
  getEventMiddleware(name: string): EventMiddleware | null;

  /**
   * Get a named request middleware instance
   *
   * @param name The registered middleware name
   * @returns The middleware function or null if not found
   */
  getRequestMiddleware(name: string): RequestMiddleware | null;
}

/**
 * Factory interface for creating middleware managers
 *
 * This factory creates and configures middleware managers based on
 * declarative configuration, enabling consistent middleware setup
 * without exposing implementation details.
 */
export interface MiddlewareFactory<TContract extends Contract = Contract> {
  /**
   * Create a middleware manager with the specified configuration
   *
   * @param config The middleware configuration
   * @param contract The contract for validation middleware
   * @param middlewareProvider Optional provider for custom middleware
   * @returns A configured middleware manager
   */
  createMiddlewareManager(
    config: MiddlewareConfig,
    contract: TContract,
    middlewareProvider?: MiddlewareProvider
  ): MiddlewareManager;
}

/**
 * Registry for middleware factories and providers
 *
 * This registry provides a centralized system for middleware factory
 * registration and lookup, enabling consistent middleware setup across
 * the application using the factory pattern.
 */
export class MiddlewareRegistry {
  private static factories = new Map<string, MiddlewareFactory<any>>();
  private static middlewareProviders = new Map<string, MiddlewareProvider>();

  /**
   * Register a middleware factory in the registry
   *
   * @param type The middleware factory type identifier
   * @param factory The factory implementation to register
   */
  static registerFactory<TContract extends Contract>(
    type: string,
    factory: MiddlewareFactory<TContract>
  ): void {
    this.factories.set(type, factory);
  }

  /**
   * Register a middleware provider in the registry
   *
   * Middleware providers supply named middleware instances
   * that can be referenced in configuration.
   *
   * @param type The middleware provider type identifier
   * @param provider The provider implementation to register
   */
  static registerMiddlewareProvider(
    type: string,
    provider: MiddlewareProvider
  ): void {
    this.middlewareProviders.set(type, provider);
  }

  /**
   * Create a middleware manager using the factory pattern
   *
   * This method handles factory lookup and middleware manager creation
   * based on configuration, abstracting the implementation details.
   *
   * @param config The middleware configuration
   * @param contract The contract used for validation middleware
   * @returns A configured middleware manager
   * @throws Error if the factory type is not registered
   */
  static createMiddlewareManager<TContract extends Contract>(
    config: MiddlewareConfig,
    contract: TContract
  ): MiddlewareManager {
    const factory = this.factories.get(config.type);
    if (!factory) {
      throw new Error(`Middleware factory not found for type: ${config.type}`);
    }

    // Get the appropriate middleware provider based on configuration
    const providerType = config.options?.providerType || "default";
    const provider = this.middlewareProviders.get(providerType);

    // Create and return the middleware manager
    return factory.createMiddlewareManager(config, contract, provider);
  }

  /**
   * Get a middleware provider by type
   *
   * @param type The provider type identifier
   * @returns The provider instance or undefined if not found
   */
  static getMiddlewareProvider(type: string): MiddlewareProvider | undefined {
    return this.middlewareProviders.get(type);
  }

  /**
   * Check if a middleware factory type is registered
   *
   * @param type The factory type identifier to check
   * @returns True if registered, false otherwise
   */
  static hasFactory(type: string): boolean {
    return this.factories.has(type);
  }

  /**
   * Check if a middleware provider type is registered
   *
   * @param type The provider type identifier to check
   * @returns True if registered, false otherwise
   */
  static hasMiddlewareProvider(type: string): boolean {
    return this.middlewareProviders.has(type);
  }

  /**
   * Clear all registered factories and providers
   *
   * This is primarily useful for testing to ensure a clean state
   * between test cases or when reconfiguring the system.
   */
  static clear(): void {
    this.factories.clear();
    this.middlewareProviders.clear();
  }
}