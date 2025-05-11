import { 
  ObservabilityProvider, 
  DefaultObservabilityProvider,
  ConsoleLogger,
  NoopMetrics,
  NoopTracer,
  LogLevel
} from "./observability";
import { 
  ObservabilityProviderFactory, 
  ObservabilityConfig,
  LoggerFactory,
  MetricsFactory,
  TracerFactory
} from "./observability-factory";

/**
 * Factory for creating console loggers
 */
export class ConsoleLoggerFactory implements LoggerFactory {
  private defaultLogLevel: LogLevel;
  
  constructor(defaultLogLevel: LogLevel = LogLevel.INFO) {
    this.defaultLogLevel = defaultLogLevel;
  }
  
  createLogger(name: string, options?: Record<string, any>): ConsoleLogger {
    const logLevel = options?.logLevel || this.defaultLogLevel;
    return new ConsoleLogger(name, logLevel);
  }
}

/**
 * Factory for creating noop metrics
 */
export class NoopMetricsFactory implements MetricsFactory {
  createMetrics(options?: Record<string, any>): NoopMetrics {
    return new NoopMetrics();
  }
}

/**
 * Factory for creating noop tracers
 */
export class NoopTracerFactory implements TracerFactory {
  createTracer(name: string, options?: Record<string, any>): NoopTracer {
    return new NoopTracer();
  }
}

/**
 * Factory for creating DefaultObservabilityProvider instances
 */
export class DefaultObservabilityProviderFactory implements ObservabilityProviderFactory {
  private loggerFactory: LoggerFactory;
  private metricsFactory: MetricsFactory;
  private tracerFactory: TracerFactory;
  
  /**
   * Create a new DefaultObservabilityProviderFactory
   * @param loggerFactory Optional custom logger factory
   * @param metricsFactory Optional custom metrics factory
   * @param tracerFactory Optional custom tracer factory
   */
  constructor(
    loggerFactory?: LoggerFactory,
    metricsFactory?: MetricsFactory,
    tracerFactory?: TracerFactory
  ) {
    this.loggerFactory = loggerFactory || new ConsoleLoggerFactory();
    this.metricsFactory = metricsFactory || new NoopMetricsFactory();
    this.tracerFactory = tracerFactory || new NoopTracerFactory();
  }
  
  /**
   * Create a DefaultObservabilityProvider instance
   * @param config The factory configuration
   */
  createObservabilityProvider(config: ObservabilityConfig): ObservabilityProvider {
    const defaultLogLevel = config.options?.defaultLogLevel || LogLevel.INFO;
    const provider = new DefaultObservabilityProvider(defaultLogLevel);
    
    // Configure with any custom implementations
    if (config.options?.customLoggers) {
      for (const [name, options] of Object.entries(config.options.customLoggers)) {
        provider.setLogger(name, this.loggerFactory.createLogger(name, options as Record<string, any>));
      }
    }
    
    // Set metrics if specified
    if (config.options?.metrics) {
      provider.setMetrics(this.metricsFactory.createMetrics(config.options.metricsOptions));
    }
    
    // Configure custom tracers if specified
    if (config.options?.customTracers) {
      for (const [name, options] of Object.entries(config.options.customTracers)) {
        provider.setTracer(name, this.tracerFactory.createTracer(name, options as Record<string, any>));
      }
    }
    
    return provider;
  }
}

// Register the factory with the registry
import { ObservabilityProviderRegistry } from "./observability-factory";
ObservabilityProviderRegistry.registerFactory("default", new DefaultObservabilityProviderFactory());