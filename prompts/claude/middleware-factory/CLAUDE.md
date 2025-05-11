# Middleware Factory Guide

This guide will help you create a MiddlewareFactory implementation with the @magicbutton.cloud/messaging library.

## Middleware Factory Overview

The MiddlewareFactory is responsible for creating middleware providers that process requests and events in your messaging system. A well-implemented factory allows your application to:

1. Define a consistent pipeline for processing messages
2. Apply cross-cutting concerns like logging, validation, and authentication
3. Customize message handling based on your domain requirements
4. Create reusable middleware components
5. Configure middleware processing order

## Key Interfaces

```typescript
interface MiddlewareFactory {
  create(config: MiddlewareConfig): MiddlewareProvider;
}

interface MiddlewareProvider {
  getRequestMiddleware(): RequestMiddleware[];
  getEventMiddleware(): EventMiddleware[];
}

type RequestMiddleware = (
  payload: RequestPayload,
  context: MessageContext,
  next: () => Promise<ResponsePayload>
) => Promise<ResponsePayload>;

type EventMiddleware = (
  payload: EventPayload,
  context: MessageContext,
  next: () => Promise<void>
) => Promise<void>;
```

## Implementation Template

Here's a template for implementing a custom MiddlewareFactory:

```typescript
import {
  MiddlewareFactory,
  MiddlewareConfig,
  MiddlewareProvider,
  RequestMiddleware,
  EventMiddleware,
  RequestPayload,
  ResponsePayload,
  EventPayload,
  MessageContext,
  createRequestValidationMiddleware,
  createEventValidationMiddleware,
  createRequestLoggingMiddleware,
  createEventLoggingMiddleware,
  createAuthenticationMiddleware
} from '@magicbutton.cloud/messaging';

// 1. Define your config interface (extends MiddlewareConfig)
interface MyMiddlewareConfig extends MiddlewareConfig {
  // Custom configuration properties
  validation?: boolean;
  logging?: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
  authentication?: boolean;
  custom?: {
    metrics?: boolean;
    rateLimit?: {
      enabled: boolean;
      limit: number;
      windowMs: number;
    };
  };
}

// 2. Implement a custom request middleware
const createMetricsMiddleware = (options?: any): RequestMiddleware => {
  return async (payload: RequestPayload, context: MessageContext, next: () => Promise<ResponsePayload>) => {
    const startTime = Date.now();
    const requestType = payload.type;
    
    try {
      // Execute the next middleware in the chain
      const response = await next();
      
      // Record metrics after successful request
      const duration = Date.now() - startTime;
      const { observabilityProvider } = context;
      
      if (observabilityProvider?.metrics) {
        observabilityProvider.metrics.recordMetric('request_duration', duration, {
          type: requestType,
          success: true
        });
        
        observabilityProvider.metrics.incrementCounter('request_count', {
          type: requestType,
          success: true
        });
      }
      
      return response;
    } catch (error) {
      // Record metrics after failed request
      const duration = Date.now() - startTime;
      const { observabilityProvider } = context;
      
      if (observabilityProvider?.metrics) {
        observabilityProvider.metrics.recordMetric('request_duration', duration, {
          type: requestType,
          success: false,
          error: error.name
        });
        
        observabilityProvider.metrics.incrementCounter('request_count', {
          type: requestType,
          success: false,
          error: error.name
        });
      }
      
      // Rethrow the error
      throw error;
    }
  };
};

// 3. Implement a custom event middleware
const createRateLimitMiddleware = (options: { limit: number, windowMs: number }): EventMiddleware => {
  const clients: Record<string, { count: number, resetTime: number }> = {};
  
  return async (payload: EventPayload, context: MessageContext, next: () => Promise<void>) => {
    const clientId = context.actor?.id || 'anonymous';
    const now = Date.now();
    
    // Initialize or reset client tracking
    if (!clients[clientId] || clients[clientId].resetTime <= now) {
      clients[clientId] = {
        count: 0,
        resetTime: now + options.windowMs
      };
    }
    
    // Check rate limit
    if (clients[clientId].count >= options.limit) {
      const { observabilityProvider } = context;
      
      if (observabilityProvider?.logger) {
        observabilityProvider.logger.warn(`Rate limit exceeded for client ${clientId}`);
      }
      
      // Skip processing this event
      return;
    }
    
    // Increment counter
    clients[clientId].count++;
    
    // Process the event
    await next();
  };
};

// 4. Implement your middleware provider
class DefaultMiddlewareProvider implements MiddlewareProvider {
  private readonly requestMiddleware: RequestMiddleware[] = [];
  private readonly eventMiddleware: EventMiddleware[] = [];
  
  constructor(config: MyMiddlewareConfig) {
    // Add authentication middleware if enabled
    if (config.authentication) {
      this.requestMiddleware.push(createAuthenticationMiddleware());
    }
    
    // Add validation middleware if enabled
    if (config.validation !== false) {
      this.requestMiddleware.push(createRequestValidationMiddleware());
      this.eventMiddleware.push(createEventValidationMiddleware());
    }
    
    // Add logging middleware if enabled
    if (config.logging?.enabled) {
      const level = config.logging.level || 'info';
      this.requestMiddleware.push(createRequestLoggingMiddleware({ level }));
      this.eventMiddleware.push(createEventLoggingMiddleware({ level }));
    }
    
    // Add metrics middleware if enabled
    if (config.custom?.metrics) {
      this.requestMiddleware.push(createMetricsMiddleware());
    }
    
    // Add rate limiting middleware if enabled
    if (config.custom?.rateLimit?.enabled) {
      this.eventMiddleware.push(createRateLimitMiddleware({
        limit: config.custom.rateLimit.limit || 100,
        windowMs: config.custom.rateLimit.windowMs || 60000
      }));
    }
  }
  
  getRequestMiddleware(): RequestMiddleware[] {
    return [...this.requestMiddleware];
  }
  
  getEventMiddleware(): EventMiddleware[] {
    return [...this.eventMiddleware];
  }
}

// 5. Implement your middleware factory
export class MyMiddlewareFactory implements MiddlewareFactory {
  create(config: MiddlewareConfig): MiddlewareProvider {
    // Cast to your specific config type
    const myConfig = config as MyMiddlewareConfig;
    
    // Create and return your middleware provider
    return new DefaultMiddlewareProvider(myConfig);
  }
}
```

## Usage Example

Here's how to use your custom MiddlewareFactory:

```typescript
import { Server } from '@magicbutton.cloud/messaging';
import { MyMiddlewareFactory } from './my-middleware-factory';

// Create your middleware factory
const middlewareFactory = new MyMiddlewareFactory();

// Create a server with your middleware factory
const server = Server.create({
  // Other server configuration
  middlewareFactory,
  middlewareConfig: {
    validation: true,
    logging: {
      enabled: true,
      level: 'info'
    },
    authentication: true,
    custom: {
      metrics: true,
      rateLimit: {
        enabled: true,
        limit: 50,
        windowMs: 30000 // 30 seconds
      }
    }
  }
});

// Start the server and begin handling requests and events
await server.start();
```

## Best Practices

1. **Order Matters**: Consider the order of middleware execution carefully
2. **Error Handling**: Implement proper error handling in each middleware
3. **Performance**: Keep middleware functions efficient to minimize latency
4. **Composition**: Design middleware to be composable and reusable
5. **Context Enrichment**: Use middleware to enrich message context
6. **Conditional Execution**: Allow middleware to be conditionally included based on configuration
7. **Tracing**: Integrate with observability provider for tracing middleware execution
8. **Metadata**: Add useful metadata to context in early middleware for later use

## Advanced Scenarios

### Conditional Middleware Factory

A factory that selects middleware based on runtime conditions:

```typescript
class ConditionalMiddlewareFactory implements MiddlewareFactory {
  private readonly environmentName: string;
  
  constructor(environmentName: string) {
    this.environmentName = environmentName;
  }
  
  create(config: MiddlewareConfig): MiddlewareProvider {
    // Select middleware configuration based on environment
    switch (this.environmentName) {
      case 'development':
        return new DevelopmentMiddlewareProvider(config);
      case 'staging':
        return new StagingMiddlewareProvider(config);
      case 'production':
        return new ProductionMiddlewareProvider(config);
      default:
        return new DefaultMiddlewareProvider(config);
    }
  }
}

// Example usage
const middlewareFactory = new ConditionalMiddlewareFactory(process.env.NODE_ENV);
```

### Dynamic Middleware Registration

A provider that allows runtime registration of middleware:

```typescript
class DynamicMiddlewareProvider implements MiddlewareProvider {
  private requestMiddleware: RequestMiddleware[] = [];
  private eventMiddleware: EventMiddleware[] = [];
  
  constructor(config: MiddlewareConfig) {
    // Initialize with base middleware
  }
  
  getRequestMiddleware(): RequestMiddleware[] {
    return [...this.requestMiddleware];
  }
  
  getEventMiddleware(): EventMiddleware[] {
    return [...this.eventMiddleware];
  }
  
  // Methods to add middleware at runtime
  addRequestMiddleware(middleware: RequestMiddleware, position?: 'start' | 'end'): void {
    if (position === 'start') {
      this.requestMiddleware.unshift(middleware);
    } else {
      this.requestMiddleware.push(middleware);
    }
  }
  
  addEventMiddleware(middleware: EventMiddleware, position?: 'start' | 'end'): void {
    if (position === 'start') {
      this.eventMiddleware.unshift(middleware);
    } else {
      this.eventMiddleware.push(middleware);
    }
  }
  
  // Method to remove middleware at runtime
  removeRequestMiddleware(middleware: RequestMiddleware): void {
    this.requestMiddleware = this.requestMiddleware.filter(m => m !== middleware);
  }
  
  removeEventMiddleware(middleware: EventMiddleware): void {
    this.eventMiddleware = this.eventMiddleware.filter(m => m !== middleware);
  }
}
```

### Feature Flag Integration

A factory that integrates with a feature flag system:

```typescript
class FeatureFlagMiddlewareFactory implements MiddlewareFactory {
  private readonly featureFlagService: any;
  private readonly baseFactory: MiddlewareFactory;
  
  constructor(featureFlagService: any, baseFactory: MiddlewareFactory) {
    this.featureFlagService = featureFlagService;
    this.baseFactory = baseFactory;
  }
  
  create(config: MiddlewareConfig): MiddlewareProvider {
    // Get feature flags
    const enableMetrics = this.featureFlagService.isEnabled('middleware.metrics');
    const enableRateLimit = this.featureFlagService.isEnabled('middleware.rateLimit');
    const enableVerboseLogging = this.featureFlagService.isEnabled('middleware.verboseLogging');
    
    // Apply feature flags to configuration
    const enhancedConfig = {
      ...config,
      logging: {
        ...config.logging,
        level: enableVerboseLogging ? 'debug' : (config.logging?.level || 'info')
      },
      custom: {
        ...config.custom,
        metrics: enableMetrics,
        rateLimit: enableRateLimit ? {
          enabled: true,
          limit: 100,
          windowMs: 60000
        } : { enabled: false }
      }
    };
    
    // Use base factory with enhanced config
    return this.baseFactory.create(enhancedConfig);
  }
}
```

### Middleware Composition Helper

A utility for composing middleware chains:

```typescript
// Middleware composition helper
class MiddlewareComposer {
  private requestMiddleware: RequestMiddleware[] = [];
  private eventMiddleware: EventMiddleware[] = [];
  
  addRequestMiddleware(middleware: RequestMiddleware | RequestMiddleware[]): MiddlewareComposer {
    if (Array.isArray(middleware)) {
      this.requestMiddleware.push(...middleware);
    } else {
      this.requestMiddleware.push(middleware);
    }
    return this;
  }
  
  addEventMiddleware(middleware: EventMiddleware | EventMiddleware[]): MiddlewareComposer {
    if (Array.isArray(middleware)) {
      this.eventMiddleware.push(...middleware);
    } else {
      this.eventMiddleware.push(middleware);
    }
    return this;
  }
  
  build(): MiddlewareProvider {
    const requestMiddleware = [...this.requestMiddleware];
    const eventMiddleware = [...this.eventMiddleware];
    
    return {
      getRequestMiddleware: () => requestMiddleware,
      getEventMiddleware: () => eventMiddleware
    };
  }
  
  static create(): MiddlewareComposer {
    return new MiddlewareComposer();
  }
}

// Example usage
const middlewareProvider = MiddlewareComposer.create()
  .addRequestMiddleware([
    createAuthenticationMiddleware(),
    createRequestValidationMiddleware(),
    createRequestLoggingMiddleware({ level: 'info' }),
    createMetricsMiddleware()
  ])
  .addEventMiddleware([
    createEventValidationMiddleware(),
    createEventLoggingMiddleware({ level: 'info' }),
    createRateLimitMiddleware({ limit: 100, windowMs: 60000 })
  ])
  .build();
```