import { 
  ObservabilityProvider, 
  Logger,
  Metrics,
  Tracer,
  LogLevel
} from "./observability";

/**
 * Configuration interface for creating observability components
 */
export interface ObservabilityConfig {
  type: string;
  options?: {
    defaultLogLevel?: LogLevel;
    loggerOptions?: Record<string, any>;
    metricsOptions?: Record<string, any>;
    tracerOptions?: Record<string, any>;
    [key: string]: any;
  };
}

/**
 * Logger factory interface for creating logger instances
 */
export interface LoggerFactory {
  /**
   * Create a logger instance
   * @param name The logger name
   * @param options Optional logger configuration
   */
  createLogger(name: string, options?: Record<string, any>): Logger;
}

/**
 * Metrics factory interface for creating metrics instances
 */
export interface MetricsFactory {
  /**
   * Create a metrics instance
   * @param options Optional metrics configuration
   */
  createMetrics(options?: Record<string, any>): Metrics;
}

/**
 * Tracer factory interface for creating tracer instances
 */
export interface TracerFactory {
  /**
   * Create a tracer instance
   * @param name The tracer name
   * @param options Optional tracer configuration
   */
  createTracer(name: string, options?: Record<string, any>): Tracer;
}

/**
 * Observability provider factory interface
 */
export interface ObservabilityProviderFactory {
  /**
   * Create an observability provider instance
   * @param config The observability configuration
   */
  createObservabilityProvider(config: ObservabilityConfig): ObservabilityProvider;
}

/**
 * Registry for observability provider factories
 */
export class ObservabilityProviderRegistry {
  private static factories = new Map<string, ObservabilityProviderFactory>();
  
  /**
   * Register an observability provider factory
   * @param type The provider type identifier
   * @param factory The factory implementation
   */
  static registerFactory(
    type: string, 
    factory: ObservabilityProviderFactory
  ): void {
    this.factories.set(type, factory);
  }
  
  /**
   * Create an observability provider instance with the specified configuration
   * @param config The observability provider configuration
   */
  static createObservabilityProvider(
    config: ObservabilityConfig
  ): ObservabilityProvider {
    const factory = this.factories.get(config.type);
    if (!factory) {
      throw new Error(`Observability provider factory not found for type: ${config.type}`);
    }
    return factory.createObservabilityProvider(config);
  }
  
  /**
   * Check if an observability provider type is registered
   * @param type The provider type to check
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