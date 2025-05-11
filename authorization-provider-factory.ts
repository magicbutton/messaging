import { AuthorizationProvider, Contract } from "./types";

/**
 * Authorization provider configuration interface for creating authorization providers
 */
export interface AuthorizationProviderConfig<TContract extends Contract> {
  type: string;
  contract: TContract;
  options?: Record<string, any>;
}

/**
 * Authorization provider factory interface for creating authorization providers
 */
export interface AuthorizationProviderFactory<TContract extends Contract> {
  /**
   * Create an authorization provider instance
   * @param config The authorization provider configuration
   */
  createAuthorizationProvider(config: AuthorizationProviderConfig<TContract>): AuthorizationProvider<TContract>;
}

/**
 * Authorization provider registry for centralized dependency injection of authorization providers
 */
export class AuthorizationProviderRegistry {
  private static factories = new Map<string, AuthorizationProviderFactory<any>>();
  
  /**
   * Register an authorization provider factory
   * @param type The authorization provider type identifier
   * @param factory The factory implementation
   */
  static registerFactory<TContract extends Contract>(
    type: string, 
    factory: AuthorizationProviderFactory<TContract>
  ): void {
    this.factories.set(type, factory);
  }
  
  /**
   * Create an authorization provider instance with the specified configuration
   * @param config The authorization provider configuration
   * @returns An authorization provider instance
   */
  static createAuthorizationProvider<TContract extends Contract>(
    config: AuthorizationProviderConfig<TContract>
  ): AuthorizationProvider<TContract> {
    const factory = this.factories.get(config.type);
    if (!factory) {
      throw new Error(`Authorization provider factory not found for type: ${config.type}`);
    }
    return factory.createAuthorizationProvider(config) as AuthorizationProvider<TContract>;
  }
  
  /**
   * Check if an authorization provider type is registered
   * @param type The authorization provider type to check
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