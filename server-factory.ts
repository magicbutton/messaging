import { MessagingServer } from "./server";
import { Transport, Contract, ServerOptions } from "./types";

/**
 * Server configuration interface for creating servers
 */
export interface ServerConfig<TContract extends Contract> {
  transport: Transport<TContract>;
  contract: TContract;
  options?: ServerOptions;
}

/**
 * Server factory interface for creating messaging servers
 */
export interface ServerFactory<TContract extends Contract> {
  /**
   * Create a server instance
   * @param config The server configuration
   */
  createServer(config: ServerConfig<TContract>): MessagingServer<TContract>;
}

/**
 * Default implementation of the ServerFactory interface
 */
export class DefaultServerFactory<TContract extends Contract> implements ServerFactory<TContract> {
  /**
   * Create a server instance
   * @param config The server configuration
   */
  createServer(config: ServerConfig<TContract>): MessagingServer<TContract> {
    return new MessagingServer<TContract>(config.transport, config.contract, config.options);
  }
}

/**
 * Server provider for centralized dependency injection of servers
 */
export class ServerProvider {
  private static factories = new Map<string, ServerFactory<any>>();
  
  /**
   * Register a server factory
   * @param type The server type identifier
   * @param factory The factory implementation
   */
  static registerFactory<TContract extends Contract>(
    type: string, 
    factory: ServerFactory<TContract>
  ): void {
    this.factories.set(type, factory);
  }
  
  /**
   * Create a server instance with the specified configuration
   * @param type The server type identifier
   * @param config The server configuration
   * @returns A typed server instance
   */
  static createServer<TContract extends Contract>(
    type: string,
    config: ServerConfig<TContract>
  ): MessagingServer<TContract> {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`Server factory not found for type: ${type}`);
    }
    return factory.createServer(config) as MessagingServer<TContract>;
  }
  
  /**
   * Check if a server type is registered
   * @param type The server type to check
   */
  static hasFactory(type: string): boolean {
    return this.factories.has(type);
  }
  
  /**
   * Clear all registered factories (primarily for testing)
   */
  static clearFactories(): void {
    this.factories.clear();
  }
}