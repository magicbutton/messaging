import { MessagingClient } from "./client";
import { Transport, Contract, ClientOptions } from "./types";

/**
 * Configuration interface for creating client instances through factory pattern
 *
 * This defines the input parameters needed by client factories to create
 * properly configured client instances without exposing implementation details.
 */
export interface ClientConfig<TContract extends Contract> {
  /**
   * Transport instance to use for client communication
   * Created by a TransportFactory
   */
  transport: Transport<TContract>;

  /**
   * Optional client configuration options
   */
  options?: ClientOptions;
}

/**
 * Factory interface for creating messaging client instances
 *
 * The factory pattern abstracts client creation, allowing different client
 * implementations to be created with consistent interfaces. This enables
 * dependency injection and testability.
 */
export interface ClientFactory<TContract extends Contract> {
  /**
   * Create a new client instance with the provided configuration
   * @param config The client configuration parameters
   * @returns A configured client instance
   */
  createClient(config: ClientConfig<TContract>): MessagingClient<TContract>;
}

/**
 * Default implementation of the ClientFactory interface
 *
 * This factory creates standard MessagingClient instances. Custom factories
 * can extend or replace this to provide specialized client implementations.
 */
export class DefaultClientFactory<TContract extends Contract> implements ClientFactory<TContract> {
  /**
   * Create a standard messaging client instance
   * @param config The client configuration
   * @returns A configured MessagingClient instance
   */
  createClient(config: ClientConfig<TContract>): MessagingClient<TContract> {
    return new MessagingClient<TContract>(config.transport, config.options);
  }
}

/**
 * Registry for client factories providing centralized dependency injection
 *
 * The provider pattern centralizes factory registration and client creation,
 * allowing components to request clients by type without knowing implementation details.
 */
export class ClientProvider {
  private static factories = new Map<string, ClientFactory<any>>();
  
  /**
   * Register a client factory in the provider registry
   * @param type The client type identifier for lookup
   * @param factory The factory implementation to register
   */
  static registerFactory<TContract extends Contract>(
    type: string,
    factory: ClientFactory<TContract>
  ): void {
    this.factories.set(type, factory);
  }

  /**
   * Create a client instance using the appropriate factory
   *
   * This method handles the factory lookup and delegates client creation
   * to the registered factory, ensuring proper dependency injection.
   *
   * @param type The client type identifier to use for factory lookup
   * @param config The client configuration to pass to the factory
   * @returns A configured client instance of the specified type
   * @throws Error if no factory is registered for the specified type
   */
  static createClient<TContract extends Contract>(
    type: string,
    config: ClientConfig<TContract>
  ): MessagingClient<TContract> {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`Client factory not found for type: ${type}`);
    }
    return factory.createClient(config) as MessagingClient<TContract>;
  }

  /**
   * Check if a client factory type is registered
   * @param type The client type to check
   * @returns True if a factory is registered for the type
   */
  static hasFactory(type: string): boolean {
    return this.factories.has(type);
  }

  /**
   * Clear all registered factories from the registry
   *
   * This is primarily useful for testing to ensure a clean state
   * between test cases or when reconfiguring the system.
   */
  static clearFactories(): void {
    this.factories.clear();
  }
}