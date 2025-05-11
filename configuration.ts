import { 
  TransportConfig, 
  ClientConfig, 
  ServerConfig,
  ObservabilityConfig,
  MiddlewareConfig,
  AuthProviderConfig,
  AuthorizationProviderConfig
} from "./index";
import { Contract } from "./types";

/**
 * Configuration provider interface for accessing system settings
 *
 * This interface defines a standardized way to access configuration values
 * regardless of their source (environment variables, files, etc.) and
 * handles hierarchical key structure through dot notation.
 */
export interface ConfigurationProvider {
  /**
   * Get a configuration value by key path
   *
   * Keys can use dot notation to access nested properties.
   * For example: "transport.type" would retrieve the "type" property
   * from the "transport" configuration section.
   *
   * @param key Configuration key path using dot notation
   * @param defaultValue Value to return if the key doesn't exist
   * @returns The configuration value or defaultValue if not found
   */
  get<T>(key: string, defaultValue?: T): T;

  /**
   * Get all configuration values as a single object
   *
   * @returns A deep copy of the entire configuration object
   */
  getAll(): Record<string, any>;

  /**
   * Check if a configuration key exists
   *
   * @param key Configuration key path using dot notation
   * @returns True if the key exists, false otherwise
   */
  has(key: string): boolean;

  /**
   * Get an entire configuration section
   *
   * This is useful for retrieving a subset of the configuration
   * that can be passed to a component factory.
   *
   * @param section Section name to retrieve
   * @returns A deep copy of the section object or an empty object if not found
   */
  getSection(section: string): Record<string, any>;
}

/**
 * Configuration source interface for loading settings
 *
 * The configuration source pattern allows loading configuration
 * from different locations (files, environment, memory) with a
 * consistent interface, enabling flexible configuration strategies.
 */
export interface ConfigurationSource {
  /**
   * Load configuration data from this source
   *
   * @returns Promise resolving to the configuration object
   */
  load(): Promise<Record<string, any>>;

  /**
   * Get the source's name for identification and debugging
   *
   * @returns The source identifier name
   */
  getName(): string;
}

/**
 * Factory interface for creating configuration providers
 *
 * This factory creates providers that can load and merge configuration
 * from multiple sources following priority rules defined by the factory.
 */
export interface ConfigurationProviderFactory {
  /**
   * Create a configuration provider from multiple sources
   *
   * Sources are typically processed in order with later sources
   * overriding values from earlier ones, allowing for layered
   * configuration (defaults, environment-specific, instance-specific).
   *
   * @param sources Configuration sources to load and merge
   * @returns Promise resolving to a configured provider
   */
  createProvider(sources: ConfigurationSource[]): Promise<ConfigurationProvider>;
}

/**
 * Complete messaging system configuration for factory-based setup
 *
 * This interface provides a unified configuration structure for all
 * system components, facilitating consistent configuration across
 * a distributed system through the factory pattern.
 */
export interface MessagingConfig<TContract extends Contract = Contract> {
  /**
   * Transport factory configuration
   *
   * Defines how the messaging transport should be created and configured
   */
  transport: TransportConfig;

  /**
   * Client factory configuration
   *
   * Used when creating client instances through ClientFactory
   * The transport field is omitted as it's provided separately
   * and linked by the factory system
   */
  client?: Omit<ClientConfig<TContract>, "transport">;

  /**
   * Server factory configuration
   *
   * Used when creating server instances through ServerFactory
   * The transport field is omitted as it's provided separately
   * and linked by the factory system
   */
  server?: Omit<ServerConfig<TContract>, "transport">;

  /**
   * Observability provider factory configuration
   *
   * Controls logging, metrics, and tracing behavior
   */
  observability?: ObservabilityConfig;

  /**
   * Middleware factory configuration
   *
   * Defines middleware components and their configuration
   */
  middleware?: MiddlewareConfig;

  /**
   * Authentication provider factory configuration
   *
   * Controls how authentication is performed
   */
  authProvider?: AuthProviderConfig;

  /**
   * Authorization provider factory configuration
   *
   * Controls access control and permissions
   */
  authorizationProvider?: AuthorizationProviderConfig<TContract>;

  /**
   * Additional custom configuration for extensions
   *
   * Allows for custom components to be configured through
   * the same configuration system
   */
  [key: string]: any;
}

/**
 * Registry for configuration providers and factories
 *
 * This registry provides a centralized location for managing
 * configuration sources, providers, and factories, enabling
 * consistent configuration across a distributed system.
 */
export class ConfigurationRegistry {
  private static providers = new Map<string, ConfigurationProvider>();
  private static factories = new Map<string, ConfigurationProviderFactory>();
  private static sources = new Map<string, ConfigurationSource>();
  
  /**
   * Register a configuration provider
   * @param name Provider name
   * @param provider The configuration provider
   */
  static registerProvider(name: string, provider: ConfigurationProvider): void {
    this.providers.set(name, provider);
  }
  
  /**
   * Register a configuration provider factory
   * @param name Factory name
   * @param factory The configuration provider factory
   */
  static registerFactory(name: string, factory: ConfigurationProviderFactory): void {
    this.factories.set(name, factory);
  }
  
  /**
   * Register a configuration source
   * @param source The configuration source
   */
  static registerSource(source: ConfigurationSource): void {
    this.sources.set(source.getName(), source);
  }
  
  /**
   * Get a configuration provider by name
   * @param name Provider name
   */
  static getProvider(name: string): ConfigurationProvider | undefined {
    return this.providers.get(name);
  }
  
  /**
   * Get a configuration source by name
   * @param name Source name
   */
  static getSource(name: string): ConfigurationSource | undefined {
    return this.sources.get(name);
  }
  
  /**
   * Create a configuration provider using registered factory and sources
   * @param factoryName Factory name
   * @param sourceNames Source names to use
   */
  static async createProvider(
    factoryName: string, 
    sourceNames: string[]
  ): Promise<ConfigurationProvider> {
    const factory = this.factories.get(factoryName);
    if (!factory) {
      throw new Error(`Configuration factory not found: ${factoryName}`);
    }
    
    const sources = sourceNames.map(name => {
      const source = this.sources.get(name);
      if (!source) {
        throw new Error(`Configuration source not found: ${name}`);
      }
      return source;
    });
    
    return factory.createProvider(sources);
  }
  
  /**
   * Check if a configuration provider is registered
   * @param name Provider name
   */
  static hasProvider(name: string): boolean {
    return this.providers.has(name);
  }
  
  /**
   * Check if a configuration factory is registered
   * @param name Factory name
   */
  static hasFactory(name: string): boolean {
    return this.factories.has(name);
  }
  
  /**
   * Check if a configuration source is registered
   * @param name Source name
   */
  static hasSource(name: string): boolean {
    return this.sources.has(name);
  }
  
  /**
   * Get all registered provider names
   */
  static getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }
  
  /**
   * Get all registered source names
   */
  static getSourceNames(): string[] {
    return Array.from(this.sources.keys());
  }
  
  /**
   * Clear all registered providers, factories and sources (primarily for testing)
   */
  static clear(): void {
    this.providers.clear();
    this.factories.clear();
    this.sources.clear();
  }
}