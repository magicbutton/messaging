import { Transport, Contract } from "./types";

/**
 * Transport configuration interface for creating transports
 */
export interface TransportConfig {
  type: string;
  connectionString?: string;
  options?: Record<string, any>;
}

/**
 * Transport factory interface for creating typed transports
 */
export interface TransportFactory<TContract extends Contract> {
  /**
   * Create a transport instance
   * @param config The transport configuration
   */
  createTransport(config: TransportConfig): Transport<TContract>;
}

/**
 * Transport provider for centralized dependency injection of transports
 */
export class TransportProvider {
  private static factories = new Map<string, TransportFactory<any>>();
  
  /**
   * Register a transport factory
   * @param type The transport type identifier
   * @param factory The factory implementation
   */
  static registerFactory<TContract extends Contract>(
    type: string, 
    factory: TransportFactory<TContract>
  ): void {
    this.factories.set(type, factory);
  }
  
  /**
   * Create a transport instance with the specified configuration
   * @param config The transport configuration
   * @returns A typed transport instance
   */
  static createTransport<TContract extends Contract>(
    config: TransportConfig
  ): Transport<TContract> {
    const factory = this.factories.get(config.type);
    if (!factory) {
      throw new Error(`Transport factory not found for type: ${config.type}`);
    }
    return factory.createTransport(config) as Transport<TContract>;
  }
  
  /**
   * Check if a transport type is registered
   * @param type The transport type to check
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