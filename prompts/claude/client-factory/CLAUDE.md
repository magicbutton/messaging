# Client Factory Guide

This guide will help you create a ClientFactory implementation with the @magicbutton.cloud/messaging library.

## Client Factory Overview

The ClientFactory is responsible for creating Client instances that connect to messaging servers. A well-implemented factory allows your application to:

1. Create configured messaging clients
2. Abstract client creation details from application code
3. Apply consistent configuration across all clients
4. Support dependency injection and testing
5. Configure clients with transport, auth providers, and middleware

## Key Interfaces

```typescript
interface ClientFactory {
  create(config: ClientConfig): Client;
}

interface ClientConfig {
  transportFactory: TransportFactory;
  transportConfig: TransportConfig;
  authProviderFactory?: AuthProviderFactory;
  authProviderConfig?: AuthProviderConfig;
  middlewareFactory?: MiddlewareFactory;
  middlewareConfig?: MiddlewareConfig;
  observabilityProviderFactory?: ObservabilityProviderFactory;
  observabilityConfig?: ObservabilityConfig;
  // Additional configuration properties
}
```

## Implementation Template

Here's a template for implementing a custom ClientFactory:

```typescript
import {
  ClientFactory,
  ClientConfig,
  Client,
  TransportFactory,
  AuthProviderFactory,
  MiddlewareFactory,
  ObservabilityProviderFactory
} from '@magicbutton.cloud/messaging';

// 1. Define your config interface (extends ClientConfig)
interface MyClientConfig extends ClientConfig {
  // Custom configuration properties
  appId: string;
  timeout: number;
  retryOptions?: {
    maxRetries: number;
    backoffFactor: number;
  };
}

// 2. Implement your ClientFactory
export class MyClientFactory implements ClientFactory {
  // You can add dependencies to be injected here
  private readonly logger: any;
  
  constructor(logger: any) {
    this.logger = logger;
  }

  create(config: ClientConfig): Client {
    // Cast to your specific config type
    const myConfig = config as MyClientConfig;
    
    // Validate required config properties
    this.validateConfig(myConfig);
    
    // Get factories from config (or use defaults)
    const transportFactory = myConfig.transportFactory;
    const authProviderFactory = myConfig.authProviderFactory;
    const middlewareFactory = myConfig.middlewareFactory;
    const observabilityProviderFactory = myConfig.observabilityProviderFactory;
    
    // Create the transport
    const transport = transportFactory.create(myConfig.transportConfig);
    
    // Create auth provider if factory is provided
    const authProvider = authProviderFactory 
      ? authProviderFactory.create(myConfig.authProviderConfig)
      : undefined;
    
    // Create middleware provider if factory is provided
    const middlewareProvider = middlewareFactory
      ? middlewareFactory.create(myConfig.middlewareConfig)
      : undefined;
    
    // Create observability provider if factory is provided
    const observabilityProvider = observabilityProviderFactory
      ? observabilityProviderFactory.create(myConfig.observabilityConfig)
      : undefined;
    
    // Log client creation
    this.logger.info(`Creating client with appId: ${myConfig.appId}`);
    
    // Create and return the client
    return Client.create({
      transport,
      authProvider,
      middlewareProvider,
      observabilityProvider,
      options: {
        timeout: myConfig.timeout,
        retryOptions: myConfig.retryOptions,
        appId: myConfig.appId
      }
    });
  }
  
  private validateConfig(config: MyClientConfig): void {
    if (!config.transportFactory) {
      throw new Error('Transport factory is required');
    }
    
    if (!config.transportConfig) {
      throw new Error('Transport configuration is required');
    }
    
    if (!config.appId) {
      throw new Error('App ID is required');
    }
    
    if (!config.timeout || config.timeout < 0) {
      throw new Error('Timeout must be a positive number');
    }
  }
}
```

## Usage Example

Here's how to use your custom ClientFactory:

```typescript
import { MyClientFactory } from './my-client-factory';
import { WebSocketTransportFactory } from './websocket-transport-factory';
import { JwtAuthProviderFactory } from './jwt-auth-provider-factory';
import { ConsoleLogger } from './logger';

// Create dependencies
const logger = new ConsoleLogger();

// Create your client factory
const clientFactory = new MyClientFactory(logger);

// Create a client with your factory
const client = clientFactory.create({
  // Transport configuration
  transportFactory: new WebSocketTransportFactory(),
  transportConfig: {
    url: 'wss://messaging.example.com',
    reconnect: true
  },
  
  // Auth provider configuration
  authProviderFactory: new JwtAuthProviderFactory(),
  authProviderConfig: {
    jwksUrl: 'https://auth.example.com/.well-known/jwks.json'
  },
  
  // Custom configuration
  appId: 'my-application',
  timeout: 5000,
  retryOptions: {
    maxRetries: 3,
    backoffFactor: 1.5
  }
});

// Connect and use the client
await client.connect();
const response = await client.request('getUsers', { filter: 'active' });
```

## Best Practices

1. **Configuration Validation**: Validate all required configuration parameters
2. **Dependency Injection**: Design your factory to accept external dependencies
3. **Consistent Logging**: Log client creation and configuration details
4. **Default Options**: Provide sensible defaults for optional parameters
5. **Environment Awareness**: Support different configurations based on environment
6. **Error Handling**: Provide clear error messages for configuration issues
7. **Documentation**: Document the expected configuration parameters

## Advanced Scenarios

### Client Pool Factory

For applications that need to manage multiple clients:

```typescript
class ClientPoolFactory {
  private readonly clientFactory: ClientFactory;
  private clientPool: Map<string, Client> = new Map();
  
  constructor(clientFactory: ClientFactory) {
    this.clientFactory = clientFactory;
  }
  
  getClient(clientId: string, config: ClientConfig): Client {
    // Return existing client if available
    if (this.clientPool.has(clientId)) {
      return this.clientPool.get(clientId);
    }
    
    // Create new client
    const client = this.clientFactory.create(config);
    
    // Add to pool
    this.clientPool.set(clientId, client);
    
    return client;
  }
  
  async disconnect(clientId?: string): Promise<void> {
    if (clientId) {
      // Disconnect specific client
      const client = this.clientPool.get(clientId);
      if (client) {
        await client.disconnect();
        this.clientPool.delete(clientId);
      }
    } else {
      // Disconnect all clients
      const disconnectPromises = Array.from(this.clientPool.values())
        .map(client => client.disconnect());
      
      await Promise.all(disconnectPromises);
      this.clientPool.clear();
    }
  }
}
```

### Environment-Based Factory

A factory that creates clients configured for different environments:

```typescript
class EnvironmentClientFactory implements ClientFactory {
  private readonly environment: 'development' | 'staging' | 'production';
  private readonly baseClientFactory: ClientFactory;
  
  constructor(environment: 'development' | 'staging' | 'production', baseClientFactory: ClientFactory) {
    this.environment = environment;
    this.baseClientFactory = baseClientFactory;
  }
  
  create(baseConfig: ClientConfig): Client {
    // Merge base config with environment-specific config
    const envConfig = this.getEnvironmentConfig();
    const mergedConfig = { ...baseConfig, ...envConfig };
    
    // Create client using base factory
    return this.baseClientFactory.create(mergedConfig);
  }
  
  private getEnvironmentConfig(): Partial<ClientConfig> {
    switch (this.environment) {
      case 'development':
        return {
          transportConfig: {
            url: 'ws://localhost:8080',
            reconnect: true
          },
          // Dev-specific config
        };
        
      case 'staging':
        return {
          transportConfig: {
            url: 'wss://staging.example.com',
            reconnect: true
          },
          // Staging-specific config
        };
        
      case 'production':
        return {
          transportConfig: {
            url: 'wss://production.example.com',
            reconnect: true,
            reconnectOptions: {
              maxRetries: 10,
              backoffFactor: 2
            }
          },
          // Production-specific config
        };
        
      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }
  }
}
```

### Feature Toggle Integration

A factory that integrates with a feature toggle system:

```typescript
class FeatureToggleClientFactory implements ClientFactory {
  private readonly baseClientFactory: ClientFactory;
  private readonly featureToggleService: any;
  
  constructor(baseClientFactory: ClientFactory, featureToggleService: any) {
    this.baseClientFactory = baseClientFactory;
    this.featureToggleService = featureToggleService;
  }
  
  create(config: ClientConfig): Client {
    // Get feature toggles for messaging
    const enableRetry = this.featureToggleService.isEnabled('messaging.retry');
    const enableMetrics = this.featureToggleService.isEnabled('messaging.metrics');
    const useNewTransport = this.featureToggleService.isEnabled('messaging.new-transport');
    
    // Apply feature toggles to configuration
    const enhancedConfig = { ...config };
    
    if (enableRetry) {
      enhancedConfig.retryOptions = {
        maxRetries: 5,
        backoffFactor: 1.5
      };
    }
    
    if (enableMetrics && !enhancedConfig.observabilityProviderFactory) {
      enhancedConfig.observabilityProviderFactory = new DefaultObservabilityProviderFactory();
      enhancedConfig.observabilityConfig = {
        metrics: true,
        tracing: false,
        logging: true
      };
    }
    
    if (useNewTransport && enhancedConfig.transportFactory) {
      enhancedConfig.transportFactory = new NewTransportFactory();
    }
    
    // Create client with feature-toggled config
    return this.baseClientFactory.create(enhancedConfig);
  }
}
```