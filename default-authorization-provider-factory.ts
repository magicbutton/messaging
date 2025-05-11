import { AuthorizationProvider, Contract } from "./types";
import { DefaultAuthorizationProvider } from "./authorization-provider";
import { 
  AuthorizationProviderFactory, 
  AuthorizationProviderConfig 
} from "./authorization-provider-factory";

/**
 * Factory for creating DefaultAuthorizationProvider instances
 */
export class DefaultAuthorizationProviderFactory<TContract extends Contract> 
  implements AuthorizationProviderFactory<TContract> {
  
  /**
   * Create a DefaultAuthorizationProvider instance
   * @param config The factory configuration
   */
  createAuthorizationProvider(
    config: AuthorizationProviderConfig<TContract>
  ): AuthorizationProvider<TContract> {
    return new DefaultAuthorizationProvider<TContract>(config.contract);
  }
}

// Register the factory with the registry
import { AuthorizationProviderRegistry } from "./authorization-provider-factory";
AuthorizationProviderRegistry.registerFactory(
  "default", 
  new DefaultAuthorizationProviderFactory<any>()
);