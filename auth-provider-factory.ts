import { AuthProvider } from "./types";

/**
 * Auth provider configuration interface for creating auth providers
 */
export interface AuthProviderConfig {
  type: string;
  options?: Record<string, any>;
}

/**
 * Auth provider factory interface for creating auth providers
 */
export interface AuthProviderFactory {
  /**
   * Create an auth provider instance
   * @param config The auth provider configuration
   */
  createAuthProvider(config: AuthProviderConfig): AuthProvider;
}

/**
 * Auth provider registry for centralized dependency injection of auth providers
 */
export class AuthProviderRegistry {
  private static factories = new Map<string, AuthProviderFactory>();
  
  /**
   * Register an auth provider factory
   * @param type The auth provider type identifier
   * @param factory The factory implementation
   */
  static registerFactory(
    type: string, 
    factory: AuthProviderFactory
  ): void {
    this.factories.set(type, factory);
  }
  
  /**
   * Create an auth provider instance with the specified configuration
   * @param config The auth provider configuration
   * @returns An auth provider instance
   */
  static createAuthProvider(
    config: AuthProviderConfig
  ): AuthProvider {
    const factory = this.factories.get(config.type);
    if (!factory) {
      throw new Error(`Auth provider factory not found for type: ${config.type}`);
    }
    return factory.createAuthProvider(config);
  }
  
  /**
   * Check if an auth provider type is registered
   * @param type The auth provider type to check
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