import { AuthProvider } from "./types";
import { DefaultAuthProvider } from "./auth-provider";
import { AuthProviderFactory, AuthProviderConfig } from "./auth-provider-factory";

/**
 * Default auth provider factory configuration
 */
export interface DefaultAuthProviderConfig extends AuthProviderConfig {
  initialUsers?: Array<{
    id: string;
    username: string;
    password: string;
    roles?: string[];
  }>;
}

/**
 * Factory for creating DefaultAuthProvider instances
 */
export class DefaultAuthProviderFactory implements AuthProviderFactory {
  /**
   * Create a DefaultAuthProvider instance
   * @param config The factory configuration
   */
  createAuthProvider(config: DefaultAuthProviderConfig): AuthProvider {
    return new DefaultAuthProvider(config.initialUsers || []);
  }
}

// Register the factory with the registry
import { AuthProviderRegistry } from "./auth-provider-factory";
AuthProviderRegistry.registerFactory("default", new DefaultAuthProviderFactory());