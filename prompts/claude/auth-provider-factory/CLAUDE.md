# Auth Provider Factory Guide

This guide will help you create an AuthProviderFactory implementation with the @magicbutton.cloud/messaging library.

## Auth Provider Factory Overview

The AuthProviderFactory is responsible for creating authentication providers that handle user authentication in your messaging system. A well-implemented factory allows your application to:

1. Create authenticated contexts for messages
2. Validate auth tokens or credentials 
3. Handle different authentication mechanisms (OAuth, JWT, API keys, etc.)
4. Support custom authentication logic specific to your domain

## Key Interfaces

```typescript
interface AuthProviderFactory {
  create(config: AuthProviderConfig): AuthProvider;
}

interface AuthProvider {
  authenticate(token: string): Promise<AuthResult>;
  validateToken(token: string): Promise<boolean>;
  // Additional methods for your auth provider
}
```

## Implementation Template

Here's a template for implementing a custom AuthProviderFactory:

```typescript
import {
  AuthProviderFactory,
  AuthProviderConfig,
  AuthProvider,
  AuthResult
} from '@magicbutton.cloud/messaging';

// 1. Define your config interface (extends AuthProviderConfig)
interface MyAuthProviderConfig extends AuthProviderConfig {
  // Custom configuration properties
  authServiceUrl: string;
  apiKey: string;
}

// 2. Implement your AuthProvider
class MyAuthProvider implements AuthProvider {
  private authServiceUrl: string;
  private apiKey: string;

  constructor(config: MyAuthProviderConfig) {
    this.authServiceUrl = config.authServiceUrl;
    this.apiKey = config.apiKey;
  }

  async authenticate(token: string): Promise<AuthResult> {
    // Implement authentication logic here
    // Example: Call external auth service, validate JWT token, etc.
    
    try {
      // Authentication logic implementation
      const isValid = await this.validateToken(token);
      
      if (!isValid) {
        return { authenticated: false };
      }
      
      // Parse token or fetch user info
      const userData = /* extract from token or fetch from service */;
      
      return {
        authenticated: true,
        actor: {
          id: userData.id,
          roles: userData.roles || [],
          // Additional actor properties
        }
      };
    } catch (error) {
      return { authenticated: false, error: error.message };
    }
  }

  async validateToken(token: string): Promise<boolean> {
    // Implement token validation logic
    // Example: Verify JWT signature, check expiration, etc.
    
    try {
      // Token validation implementation
      return true;
    } catch (error) {
      return false;
    }
  }
}

// 3. Implement your AuthProviderFactory
export class MyAuthProviderFactory implements AuthProviderFactory {
  create(config: AuthProviderConfig): AuthProvider {
    // Cast to your specific config type
    const myConfig = config as MyAuthProviderConfig;
    
    // Validate config
    if (!myConfig.authServiceUrl) {
      throw new Error('Auth service URL is required');
    }
    
    // Create and return your auth provider
    return new MyAuthProvider(myConfig);
  }
}
```

## Usage Example

Here's how to use your custom AuthProviderFactory:

```typescript
import { Client } from '@magicbutton.cloud/messaging';
import { MyAuthProviderFactory } from './my-auth-provider-factory';

// Create your auth provider factory
const authProviderFactory = new MyAuthProviderFactory();

// Configure the client with your auth provider
const client = Client.create({
  // Other client configuration
  authProviderFactory,
  authProviderConfig: {
    authServiceUrl: 'https://auth.example.com',
    apiKey: 'your-api-key'
  }
});

// Example of connecting with authentication
await client.connect({
  authToken: 'user-jwt-token'
});
```

## Best Practices

1. **Separation of Concerns**: Keep authentication logic separate from your messaging logic
2. **Configuration Validation**: Validate all required configuration parameters in the factory
3. **Error Handling**: Implement comprehensive error handling in your auth provider
4. **Flexibility**: Design your factory to support different authentication mechanisms
5. **Security**: Never expose sensitive auth information in logs or error messages
6. **Testing**: Create tests that verify your auth provider's behavior in different scenarios

## Integration with External Services

Your auth provider can integrate with various external authentication services:

- OAuth providers (Google, GitHub, etc.)
- Custom identity services
- API key management systems
- JWT validation services

For these integrations, ensure your provider implements the appropriate protocols and handles token validation securely.

## Advanced Scenarios

### Handling Multiple Auth Types

If your system needs to support multiple authentication methods, your factory can determine which provider to instantiate based on configuration:

```typescript
export class MultiAuthProviderFactory implements AuthProviderFactory {
  create(config: AuthProviderConfig): AuthProvider {
    // Determine auth type from config
    const authType = (config as any).authType;
    
    switch (authType) {
      case 'jwt':
        return new JwtAuthProvider(config);
      case 'apiKey':
        return new ApiKeyAuthProvider(config);
      case 'oauth':
        return new OAuthProvider(config);
      default:
        throw new Error(`Unsupported auth type: ${authType}`);
    }
  }
}
```

### Caching Authentication Results

For performance optimization, implement caching in your auth provider:

```typescript
class CachedAuthProvider implements AuthProvider {
  private cache = new Map<string, { result: AuthResult, expires: number }>();
  private ttlMs = 5 * 60 * 1000; // 5 minutes
  
  async authenticate(token: string): Promise<AuthResult> {
    // Check cache first
    const cached = this.cache.get(token);
    if (cached && cached.expires > Date.now()) {
      return cached.result;
    }
    
    // Authenticate if not in cache
    const result = await this.performAuthentication(token);
    
    // Cache successful results
    if (result.authenticated) {
      this.cache.set(token, {
        result,
        expires: Date.now() + this.ttlMs
      });
    }
    
    return result;
  }
  
  private async performAuthentication(token: string): Promise<AuthResult> {
    // Actual authentication logic
  }
  
  // Other methods
}
```