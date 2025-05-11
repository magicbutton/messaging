import {
  ConfigurationProvider,
  ConfigurationSource,
  ConfigurationProviderFactory
} from "./configuration";
import { getObservabilityProvider } from "./observability";

/**
 * Memory-based configuration source
 */
export class MemoryConfigurationSource implements ConfigurationSource {
  private name: string;
  private data: Record<string, any>;
  
  /**
   * Create a new memory configuration source
   * @param name Source name
   * @param data Configuration data
   */
  constructor(name: string, data: Record<string, any> = {}) {
    this.name = name;
    this.data = JSON.parse(JSON.stringify(data)); // Deep clone to avoid mutations
  }
  
  /**
   * Load configuration from memory
   */
  async load(): Promise<Record<string, any>> {
    return this.data;
  }
  
  /**
   * Get source name
   */
  getName(): string {
    return this.name;
  }
}

/**
 * Environment variables configuration source
 */
export class EnvironmentConfigurationSource implements ConfigurationSource {
  private name: string;
  private prefix: string;
  
  /**
   * Create a new environment configuration source
   * @param name Source name
   * @param prefix Optional prefix for environment variables
   */
  constructor(name: string, prefix: string = "MSG_") {
    this.name = name;
    this.prefix = prefix;
  }
  
  /**
   * Load configuration from environment variables
   */
  async load(): Promise<Record<string, any>> {
    const config: Record<string, any> = {};
    
    // In a Node.js environment, this would use process.env
    // For browser or other environments, it can be adapted accordingly
    if (typeof process !== "undefined" && process.env) {
      for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith(this.prefix)) {
          // Remove prefix and convert to lowercase
          const configKey = key.substring(this.prefix.length).toLowerCase();
          
          // Handle nested keys with dot notation (e.g., MSG_TRANSPORT_TYPE becomes transport.type)
          const parts = configKey.split("_");
          let current = config;
          
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            
            if (i === parts.length - 1) {
              // Try to parse as JSON if possible
              try {
                current[part] = JSON.parse(value || "");
              } catch {
                current[part] = value;
              }
            } else {
              current[part] = current[part] || {};
              current = current[part];
            }
          }
        }
      }
    }
    
    return config;
  }
  
  /**
   * Get source name
   */
  getName(): string {
    return this.name;
  }
}

/**
 * JSON file configuration source
 */
export class JsonFileConfigurationSource implements ConfigurationSource {
  private name: string;
  private filePath: string;
  private optional: boolean;
  
  /**
   * Create a new JSON file configuration source
   * @param name Source name
   * @param filePath Path to JSON file
   * @param optional Whether file is optional (don't throw if missing)
   */
  constructor(name: string, filePath: string, optional: boolean = false) {
    this.name = name;
    this.filePath = filePath;
    this.optional = optional;
  }
  
  /**
   * Load configuration from JSON file
   */
  async load(): Promise<Record<string, any>> {
    // In a real implementation, this would use fs.readFile
    // For this example, we'll just return an empty object
    console.warn("JsonFileConfigurationSource is a placeholder implementation");
    console.warn("In a real environment, it would read from the file system");
    
    // Return empty configuration to avoid errors
    return {};
  }
  
  /**
   * Get source name
   */
  getName(): string {
    return this.name;
  }
}

/**
 * Default configuration provider implementation
 */
export class DefaultConfigurationProvider implements ConfigurationProvider {
  private config: Record<string, any> = {};
  private logger = getObservabilityProvider().getLogger("configuration");
  
  /**
   * Create a new default configuration provider
   * @param config Initial configuration
   */
  constructor(config: Record<string, any> = {}) {
    this.config = config;
    this.logger.debug("Configuration provider initialized");
  }
  
  /**
   * Get configuration value by key
   * @param key Configuration key path
   * @param defaultValue Default value if key not found
   */
  get<T>(key: string, defaultValue?: T): T {
    // Split key path (e.g., "transport.type")
    const parts = key.split(".");
    let current: any = this.config;
    
    // Navigate through the parts
    for (const part of parts) {
      if (current === undefined || current === null) {
        this.logger.debug(`Configuration key not found: ${key}, using default: ${defaultValue}`);
        return defaultValue as T;
      }
      
      current = current[part];
    }
    
    // Return value or default
    if (current === undefined) {
      this.logger.debug(`Configuration key not found: ${key}, using default: ${defaultValue}`);
      return defaultValue as T;
    }
    
    return current as T;
  }
  
  /**
   * Get all configuration values
   */
  getAll(): Record<string, any> {
    return JSON.parse(JSON.stringify(this.config)); // Return deep copy to prevent mutations
  }
  
  /**
   * Check if configuration key exists
   * @param key Configuration key path
   */
  has(key: string): boolean {
    // Split key path
    const parts = key.split(".");
    let current: any = this.config;
    
    // Navigate through the parts
    for (const part of parts) {
      if (current === undefined || current === null) {
        return false;
      }
      
      current = current[part];
    }
    
    return current !== undefined;
  }
  
  /**
   * Get configuration section
   * @param section Section name
   */
  getSection(section: string): Record<string, any> {
    const value = this.get<Record<string, any>>(section, {});
    return JSON.parse(JSON.stringify(value)); // Return deep copy to prevent mutations
  }
}

/**
 * Default configuration provider factory
 */
export class DefaultConfigurationProviderFactory implements ConfigurationProviderFactory {
  private logger = getObservabilityProvider().getLogger("configuration-factory");
  
  /**
   * Create a configuration provider from multiple sources
   * @param sources Configuration sources to use
   */
  async createProvider(sources: ConfigurationSource[]): Promise<ConfigurationProvider> {
    this.logger.debug(`Creating configuration provider with ${sources.length} sources`);
    
    // Start with empty configuration
    let config: Record<string, any> = {};
    
    // Load and merge configuration from each source
    for (const source of sources) {
      try {
        this.logger.debug(`Loading configuration from source: ${source.getName()}`);
        const sourceConfig = await source.load();
        
        // Deep merge with existing configuration
        config = this.deepMerge(config, sourceConfig);
      } catch (error) {
        this.logger.error(`Error loading configuration from source ${source.getName()}`, 
          error instanceof Error ? error : new Error(String(error)));
      }
    }
    
    // Create provider with merged configuration
    return new DefaultConfigurationProvider(config);
  }
  
  /**
   * Deep merge two objects
   * @param target Target object
   * @param source Source object
   */
  private deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    const result = { ...target };
    
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (this.isObject(source[key]) && this.isObject(target[key])) {
          // Recursively merge nested objects
          result[key] = this.deepMerge(target[key], source[key]);
        } else {
          // Use source value (overrides target)
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }
  
  /**
   * Check if value is an object
   * @param item Value to check
   */
  private isObject(item: any): boolean {
    return (item && typeof item === "object" && !Array.isArray(item));
  }
}

// Register default configuration components
import { ConfigurationRegistry } from "./configuration";

// Register default factory
ConfigurationRegistry.registerFactory("default", new DefaultConfigurationProviderFactory());