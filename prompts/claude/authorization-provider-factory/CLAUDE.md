# Authorization Provider Factory Guide

This guide will help you create an AuthorizationProviderFactory implementation with the @magicbutton.cloud/messaging library.

## Authorization Provider Factory Overview

The AuthorizationProviderFactory is responsible for creating authorization providers that handle permissions and access control in your messaging system. A well-implemented factory allows your application to:

1. Enforce role-based access control
2. Validate permissions for specific operations
3. Implement custom authorization logic specific to your domain
4. Support fine-grained access control policies

## Key Interfaces

```typescript
interface AuthorizationProviderFactory {
  create(config: AuthorizationProviderConfig): AuthorizationProvider;
}

interface AuthorizationProvider {
  authorize(actor: IActor, action: string, resource: string): Promise<boolean>;
  // Additional authorization methods as needed
}

interface IActor {
  id: string;
  roles: string[];
  // Additional actor properties
}
```

## Implementation Template

Here's a template for implementing a custom AuthorizationProviderFactory:

```typescript
import {
  AuthorizationProviderFactory,
  AuthorizationProviderConfig,
  AuthorizationProvider,
  IActor,
  createAccessControl
} from '@magicbutton.cloud/messaging';

// 1. Define your config interface (extends AuthorizationProviderConfig)
interface MyAuthorizationProviderConfig extends AuthorizationProviderConfig {
  // Custom configuration properties
  policiesPath: string;
  strictMode: boolean;
}

// 2. Implement your AuthorizationProvider
class MyAuthorizationProvider implements AuthorizationProvider {
  private accessControl: any; // Use the AccessControl type from the library
  private strictMode: boolean;

  constructor(config: MyAuthorizationProviderConfig) {
    // Initialize access control system
    this.accessControl = createAccessControl({
      // Define your roles and permissions
      roles: {
        admin: {
          permissions: ['*:*:*'] // Admin can do everything
        },
        user: {
          permissions: [
            'read:message:*',   // Can read all messages
            'write:message:own', // Can write own messages
            'read:user:own'      // Can read own user profile
          ]
        },
        guest: {
          permissions: [
            'read:public:*'     // Can only read public resources
          ]
        }
      }
    });
    
    this.strictMode = config.strictMode;
  }

  async authorize(actor: IActor, action: string, resource: string): Promise<boolean> {
    // If no actor or no roles, deny access in strict mode
    if (!actor || !actor.roles || actor.roles.length === 0) {
      return this.strictMode ? false : true;
    }
    
    // Check each role the actor has for the permission
    for (const role of actor.roles) {
      // Skip if role doesn't exist
      if (!this.accessControl.roles[role]) continue;
      
      // Check if the role has the permission for this action and resource
      if (this.hasPermission(role, action, resource)) {
        return true;
      }
    }
    
    // No matching permission found
    return false;
  }
  
  private hasPermission(role: string, action: string, resource: string): boolean {
    const rolePermissions = this.accessControl.roles[role].permissions;
    
    // Check for direct permission match
    if (rolePermissions.includes(`${action}:${resource}`)) {
      return true;
    }
    
    // Check for wildcard permissions
    for (const permission of rolePermissions) {
      // Parse permission parts
      const [permAction, permResource, permQualifier] = permission.split(':');
      
      // Check for action match (exact or wildcard)
      const actionMatch = permAction === '*' || permAction === action;
      if (!actionMatch) continue;
      
      // Check for resource match (exact or wildcard)
      const resourceMatch = permResource === '*' || permResource === resource;
      if (!resourceMatch) continue;
      
      // If we got here, we have a match
      return true;
    }
    
    return false;
  }
}

// 3. Implement your AuthorizationProviderFactory
export class MyAuthorizationProviderFactory implements AuthorizationProviderFactory {
  create(config: AuthorizationProviderConfig): AuthorizationProvider {
    // Cast to your specific config type
    const myConfig = config as MyAuthorizationProviderConfig;
    
    // Validate config if needed
    if (myConfig.policiesPath && !fs.existsSync(myConfig.policiesPath)) {
      throw new Error(`Policies file not found at: ${myConfig.policiesPath}`);
    }
    
    // Create and return your authorization provider
    return new MyAuthorizationProvider(myConfig);
  }
}
```

## Usage Example

Here's how to use your custom AuthorizationProviderFactory:

```typescript
import { Server } from '@magicbutton.cloud/messaging';
import { MyAuthorizationProviderFactory } from './my-authorization-provider-factory';

// Create your authorization provider factory
const authorizationProviderFactory = new MyAuthorizationProviderFactory();

// Configure the server with your authorization provider
const server = Server.create({
  // Other server configuration
  authorizationProviderFactory,
  authorizationProviderConfig: {
    policiesPath: './access-policies.json',
    strictMode: true
  }
});

// Register a request handler with authorization
server.onRequest('getResource', async (payload, context) => {
  // Check if actor is authorized to access this resource
  const isAuthorized = await context.authorizationProvider.authorize(
    context.actor,
    'read',
    'resource'
  );
  
  if (!isAuthorized) {
    throw new Error('Unauthorized access');
  }
  
  // Proceed with handling the request
  return { data: 'Resource data' };
});
```

## Best Practices

1. **Fine-grained Permissions**: Design permission structure that balances security and maintainability
2. **Performance Optimization**: Consider caching authorization results for frequently checked permissions
3. **Clear Error Messages**: Provide informative but safe error messages for failed authorization
4. **Hierarchical Permissions**: Implement support for permission hierarchies and inheritance
5. **Resource-based Authorization**: Support authorization for specific resources and resource types
6. **Logging**: Log authorization decisions for auditing and debugging
7. **Testing**: Thoroughly test authorization logic with various actor roles and permissions

## Advanced Scenarios

### Dynamic Permission Loading

For systems where permissions may change at runtime:

```typescript
class DynamicAuthorizationProvider implements AuthorizationProvider {
  private permissionsStore: any;
  private refreshInterval: NodeJS.Timeout;
  
  constructor(config: any) {
    this.permissionsStore = this.loadPermissions(config.permissionsSource);
    
    // Set up periodic refresh if needed
    if (config.refreshIntervalMs) {
      this.refreshInterval = setInterval(() => {
        this.permissionsStore = this.loadPermissions(config.permissionsSource);
      }, config.refreshIntervalMs);
    }
  }
  
  private loadPermissions(source: string) {
    // Load permissions from database, file, or external service
    // This could be synchronous or asynchronous
    return {
      // Permission data
    };
  }
  
  async authorize(actor: IActor, action: string, resource: string): Promise<boolean> {
    // Implementation using dynamically loaded permissions
  }
  
  // Clean up when no longer needed
  dispose() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}
```

### Attribute-Based Access Control (ABAC)

For more complex authorization logic based on attributes:

```typescript
class AbacAuthorizationProvider implements AuthorizationProvider {
  async authorize(actor: IActor, action: string, resource: string, context?: any): Promise<boolean> {
    // Get policy for this action and resource type
    const policy = this.getPolicy(action, resource);
    if (!policy) return false;
    
    // Evaluate policy conditions
    return this.evaluatePolicy(policy, {
      actor,
      resource,
      context,
      environment: {
        time: new Date(),
        // Other environmental factors
      }
    });
  }
  
  private getPolicy(action: string, resource: string) {
    // Look up appropriate policy
    return {
      // Policy definition with conditions
    };
  }
  
  private evaluatePolicy(policy: any, attributes: any): boolean {
    // Implement policy evaluation logic
    // This could be a rule engine, expression evaluation, etc.
    return true; // or false based on policy evaluation
  }
}
```

### Integration with External Authorization Services

To integrate with external authorization services like OPA (Open Policy Agent):

```typescript
class ExternalAuthorizationProvider implements AuthorizationProvider {
  private serviceUrl: string;
  private httpClient: any;
  
  constructor(config: any) {
    this.serviceUrl = config.serviceUrl;
    this.httpClient = /* HTTP client implementation */;
  }
  
  async authorize(actor: IActor, action: string, resource: string): Promise<boolean> {
    try {
      const response = await this.httpClient.post(`${this.serviceUrl}/v1/data/authz/allow`, {
        input: {
          actor,
          action,
          resource
        }
      });
      
      // Assuming the service returns a result with an "allow" boolean field
      return response.data.result.allow === true;
    } catch (error) {
      console.error('Authorization service error:', error);
      // Decide what to do on error (deny access or use fallback)
      return false;
    }
  }
}
```