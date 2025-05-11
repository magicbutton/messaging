# Observability Provider Factory Guide

This guide will help you create an ObservabilityProviderFactory implementation with the @magicbutton.cloud/messaging library.

## Observability Provider Factory Overview

The ObservabilityProviderFactory is responsible for creating observability providers that handle logging, metrics, and tracing in your messaging system. A well-implemented factory allows your application to:

1. Collect and analyze logs from various components
2. Monitor system performance with metrics
3. Trace requests across distributed systems
4. Debug issues in development and production
5. Integrate with external observability tools and platforms

## Key Interfaces

```typescript
interface ObservabilityProviderFactory {
  create(config: ObservabilityConfig): ObservabilityProvider;
}

interface ObservabilityProvider {
  logger: Logger;
  metrics?: Metrics;
  tracer?: Tracer;
}

interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error, ...args: any[]): void;
}

interface Metrics {
  incrementCounter(name: string, tags?: Record<string, string>): void;
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
  startTimer(name: string, tags?: Record<string, string>): () => void;
}

interface Tracer {
  startSpan(name: string, options?: any): Span;
  getCurrentSpan(): Span | undefined;
}

interface Span {
  setTag(key: string, value: string | number | boolean): void;
  log(event: string, payload?: any): void;
  finish(): void;
}
```

## Implementation Template

Here's a template for implementing a custom ObservabilityProviderFactory:

```typescript
import {
  ObservabilityProviderFactory,
  ObservabilityConfig,
  ObservabilityProvider,
  Logger,
  Metrics,
  Tracer,
  Span
} from '@magicbutton.cloud/messaging';

// 1. Define your config interface (extends ObservabilityConfig)
interface MyObservabilityConfig extends ObservabilityConfig {
  // Custom configuration properties
  logging?: {
    level: 'debug' | 'info' | 'warn' | 'error';
    destination: 'console' | 'file' | 'remote';
    filePath?: string;
    remoteUrl?: string;
  };
  metrics?: {
    enabled: boolean;
    prefix?: string;
    flushIntervalMs?: number;
    statsdHost?: string;
    statsdPort?: number;
  };
  tracing?: {
    enabled: boolean;
    serviceName: string;
    samplingRate?: number;
    exporterUrl?: string;
  };
}

// 2. Implement Logger interface
class ConsoleLogger implements Logger {
  private level: 'debug' | 'info' | 'warn' | 'error';
  
  constructor(level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.level = level;
  }
  
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.level];
  }
  
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
  
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }
  
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }
  
  error(message: string, error?: Error, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  }
}

// 3. Implement Metrics interface
class StatsdMetrics implements Metrics {
  private prefix: string;
  private client: any; // Statsd client instance
  
  constructor(options: { prefix?: string, host?: string, port?: number }) {
    this.prefix = options.prefix || '';
    
    // Initialize statsd client (example implementation)
    this.client = {
      increment: (name: string, tags: Record<string, string>) => {
        // Implementation would use a real statsd client
        console.log(`Increment counter: ${this.prefixMetric(name)}`, tags);
      },
      gauge: (name: string, value: number, tags: Record<string, string>) => {
        // Implementation would use a real statsd client
        console.log(`Record metric: ${this.prefixMetric(name)} = ${value}`, tags);
      },
      timing: (name: string, value: number, tags: Record<string, string>) => {
        // Implementation would use a real statsd client
        console.log(`Record timing: ${this.prefixMetric(name)} = ${value}ms`, tags);
      }
    };
  }
  
  private prefixMetric(name: string): string {
    return this.prefix ? `${this.prefix}.${name}` : name;
  }
  
  incrementCounter(name: string, tags?: Record<string, string>): void {
    this.client.increment(name, tags || {});
  }
  
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.client.gauge(name, value, tags || {});
  }
  
  startTimer(name: string, tags?: Record<string, string>): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.client.timing(name, duration, tags || {});
    };
  }
}

// 4. Implement Span interface
class SimpleSpan implements Span {
  private name: string;
  private startTime: number;
  private tags: Record<string, string | number | boolean> = {};
  private events: Array<{ time: number, name: string, payload?: any }> = [];
  private isFinished = false;
  
  constructor(name: string) {
    this.name = name;
    this.startTime = Date.now();
  }
  
  setTag(key: string, value: string | number | boolean): void {
    if (!this.isFinished) {
      this.tags[key] = value;
    }
  }
  
  log(event: string, payload?: any): void {
    if (!this.isFinished) {
      this.events.push({
        time: Date.now(),
        name: event,
        payload
      });
    }
  }
  
  finish(): void {
    if (!this.isFinished) {
      this.isFinished = true;
      const duration = Date.now() - this.startTime;
      console.log(`[TRACE] Span "${this.name}" finished after ${duration}ms`, {
        tags: this.tags,
        events: this.events
      });
    }
  }
}

// 5. Implement Tracer interface
class SimpleTracer implements Tracer {
  private currentSpan?: Span;
  private serviceName: string;
  
  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }
  
  startSpan(name: string, options?: any): Span {
    const span = new SimpleSpan(`${this.serviceName}.${name}`);
    this.currentSpan = span;
    return span;
  }
  
  getCurrentSpan(): Span | undefined {
    return this.currentSpan;
  }
}

// 6. Implement ObservabilityProvider
class MyObservabilityProvider implements ObservabilityProvider {
  readonly logger: Logger;
  readonly metrics?: Metrics;
  readonly tracer?: Tracer;
  
  constructor(config: MyObservabilityConfig) {
    // Create logger
    this.logger = new ConsoleLogger(config.logging?.level || 'info');
    
    // Create metrics if enabled
    if (config.metrics?.enabled) {
      this.metrics = new StatsdMetrics({
        prefix: config.metrics.prefix,
        host: config.metrics.statsdHost,
        port: config.metrics.statsdPort
      });
    }
    
    // Create tracer if enabled
    if (config.tracing?.enabled) {
      this.tracer = new SimpleTracer(config.tracing.serviceName);
    }
  }
}

// 7. Implement ObservabilityProviderFactory
export class MyObservabilityProviderFactory implements ObservabilityProviderFactory {
  create(config: ObservabilityConfig): ObservabilityProvider {
    // Cast to your specific config type
    const myConfig = config as MyObservabilityConfig;
    
    // Validate config
    this.validateConfig(myConfig);
    
    // Create and return observability provider
    return new MyObservabilityProvider(myConfig);
  }
  
  private validateConfig(config: MyObservabilityConfig): void {
    // Validate logging config
    if (config.logging?.destination === 'file' && !config.logging.filePath) {
      throw new Error('File path is required when logging destination is "file"');
    }
    
    if (config.logging?.destination === 'remote' && !config.logging.remoteUrl) {
      throw new Error('Remote URL is required when logging destination is "remote"');
    }
    
    // Validate metrics config
    if (config.metrics?.enabled) {
      if (config.metrics.destination === 'statsd' && (!config.metrics.statsdHost || !config.metrics.statsdPort)) {
        throw new Error('StatsD host and port are required when metrics are enabled with StatsD');
      }
    }
    
    // Validate tracing config
    if (config.tracing?.enabled && !config.tracing.serviceName) {
      throw new Error('Service name is required when tracing is enabled');
    }
  }
}
```

## Usage Example

Here's how to use your custom ObservabilityProviderFactory:

```typescript
import { Client } from '@magicbutton.cloud/messaging';
import { MyObservabilityProviderFactory } from './my-observability-provider-factory';

// Create your observability provider factory
const observabilityProviderFactory = new MyObservabilityProviderFactory();

// Create a client with your observability provider
const client = Client.create({
  // Other client configuration
  observabilityProviderFactory,
  observabilityConfig: {
    logging: {
      level: 'info',
      destination: 'console'
    },
    metrics: {
      enabled: true,
      prefix: 'myapp',
      flushIntervalMs: 10000,
      statsdHost: 'localhost',
      statsdPort: 8125
    },
    tracing: {
      enabled: true,
      serviceName: 'messaging-client',
      samplingRate: 0.1,
      exporterUrl: 'http://localhost:9411/api/v2/spans'
    }
  }
});

// The client will use your observability provider for logging, metrics, and tracing
await client.connect();

// You can also access the observability provider from the global registry
import { getObservabilityProvider } from '@magicbutton.cloud/messaging';
const observabilityProvider = getObservabilityProvider();

// Use the logger
observabilityProvider.logger.info('Connected to server');

// Use metrics if available
if (observabilityProvider.metrics) {
  observabilityProvider.metrics.incrementCounter('connections');
}

// Use tracing if available
if (observabilityProvider.tracer) {
  const span = observabilityProvider.tracer.startSpan('operation');
  // ... perform operation ...
  span.finish();
}
```

## Best Practices

1. **Consistent Logging Levels**: Use appropriate log levels for different types of messages
2. **Structured Logging**: Include structured data with log messages for easier analysis
3. **Meaningful Metrics**: Define metrics that provide actionable insights about your system
4. **Distributed Tracing**: Implement proper context propagation for distributed tracing
5. **Resource Management**: Ensure resources like metrics clients are properly initialized and closed
6. **Performance Impact**: Be mindful of the performance impact of your observability implementation
7. **Configuration Options**: Provide flexible configuration options for different environments
8. **Error Handling**: Handle errors in observability components gracefully

## Advanced Scenarios

### Integration with Popular Observability Platforms

Integrating with platforms like Datadog, New Relic, or Prometheus:

```typescript
class DatadogObservabilityProvider implements ObservabilityProvider {
  readonly logger: Logger;
  readonly metrics: Metrics;
  readonly tracer: Tracer;
  
  constructor(config: any) {
    // Initialize Datadog tracer
    const tracer = require('dd-trace').init({
      service: config.serviceName,
      environment: config.environment,
      logInjection: true
    });
    
    // Create logger with Datadog integration
    this.logger = new DatadogLogger(config.logLevel);
    
    // Create metrics with Datadog integration
    this.metrics = new DatadogMetrics({
      prefix: config.metricsPrefix
    });
    
    // Create tracer wrapper
    this.tracer = new DatadogTracerWrapper(tracer);
  }
}

// Factory for Datadog integration
class DatadogObservabilityProviderFactory implements ObservabilityProviderFactory {
  create(config: ObservabilityConfig): ObservabilityProvider {
    return new DatadogObservabilityProvider(config);
  }
}
```

### Environment-aware Factory

A factory that creates different providers based on the environment:

```typescript
class EnvironmentObservabilityProviderFactory implements ObservabilityProviderFactory {
  private readonly environment: 'development' | 'staging' | 'production';
  
  constructor(environment: 'development' | 'staging' | 'production') {
    this.environment = environment;
  }
  
  create(config: ObservabilityConfig): ObservabilityProvider {
    switch (this.environment) {
      case 'development':
        return new DevObservabilityProvider(config);
      
      case 'staging':
        return new StagingObservabilityProvider(config);
      
      case 'production':
        return new ProductionObservabilityProvider(config);
      
      default:
        return new DevObservabilityProvider(config);
    }
  }
}

// Example usage
const observabilityFactory = new EnvironmentObservabilityProviderFactory(process.env.NODE_ENV as any);
```

### Composite Provider for Multiple Systems

A provider that combines multiple observability systems:

```typescript
class CompositeObservabilityProvider implements ObservabilityProvider {
  readonly logger: Logger;
  readonly metrics?: Metrics;
  readonly tracer?: Tracer;
  
  constructor(providers: ObservabilityProvider[]) {
    // Create composite logger that logs to all underlying loggers
    this.logger = new CompositeLogger(providers.map(p => p.logger));
    
    // Create composite metrics if any provider has metrics
    const metricsProviders = providers.filter(p => p.metrics).map(p => p.metrics!);
    if (metricsProviders.length > 0) {
      this.metrics = new CompositeMetrics(metricsProviders);
    }
    
    // Create composite tracer if any provider has tracing
    const tracerProviders = providers.filter(p => p.tracer).map(p => p.tracer!);
    if (tracerProviders.length > 0) {
      this.tracer = new CompositeTracer(tracerProviders);
    }
  }
}

// Composite logger implementation
class CompositeLogger implements Logger {
  private readonly loggers: Logger[];
  
  constructor(loggers: Logger[]) {
    this.loggers = loggers;
  }
  
  debug(message: string, ...args: any[]): void {
    this.loggers.forEach(logger => logger.debug(message, ...args));
  }
  
  info(message: string, ...args: any[]): void {
    this.loggers.forEach(logger => logger.info(message, ...args));
  }
  
  warn(message: string, ...args: any[]): void {
    this.loggers.forEach(logger => logger.warn(message, ...args));
  }
  
  error(message: string, error?: Error, ...args: any[]): void {
    this.loggers.forEach(logger => logger.error(message, error, ...args));
  }
}

// Similar composite implementations for Metrics and Tracer...

// Factory for composite providers
class CompositeObservabilityProviderFactory implements ObservabilityProviderFactory {
  private readonly factories: ObservabilityProviderFactory[];
  
  constructor(factories: ObservabilityProviderFactory[]) {
    this.factories = factories;
  }
  
  create(config: ObservabilityConfig): ObservabilityProvider {
    // Create providers from all factories
    const providers = this.factories.map(factory => factory.create(config));
    
    // Create composite provider
    return new CompositeObservabilityProvider(providers);
  }
}
```

### Dynamic Log Level Adjustment

A provider that allows dynamic log level changes:

```typescript
class DynamicLogger implements Logger {
  private level: 'debug' | 'info' | 'warn' | 'error';
  private readonly baseLogger: Logger;
  
  constructor(baseLogger: Logger, initialLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.baseLogger = baseLogger;
    this.level = initialLevel;
  }
  
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.level = level;
  }
  
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.level];
  }
  
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      this.baseLogger.debug(message, ...args);
    }
  }
  
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      this.baseLogger.info(message, ...args);
    }
  }
  
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      this.baseLogger.warn(message, ...args);
    }
  }
  
  error(message: string, error?: Error, ...args: any[]): void {
    if (this.shouldLog('error')) {
      this.baseLogger.error(message, error, ...args);
    }
  }
}

// Provider with dynamic logger
class DynamicObservabilityProvider implements ObservabilityProvider {
  readonly logger: DynamicLogger;
  readonly metrics?: Metrics;
  readonly tracer?: Tracer;
  
  constructor(baseProvider: ObservabilityProvider, initialLogLevel: 'debug' | 'info' | 'warn' | 'error') {
    this.logger = new DynamicLogger(baseProvider.logger, initialLogLevel);
    this.metrics = baseProvider.metrics;
    this.tracer = baseProvider.tracer;
  }
  
  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logger.setLevel(level);
  }
}
```