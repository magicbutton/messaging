# Configuration Provider Factory Guide

This guide will help you create a ConfigurationProviderFactory implementation with the @magicbutton.cloud/messaging library.

## Configuration Provider Factory Overview

The ConfigurationProviderFactory is responsible for creating configuration providers that manage application settings for your messaging system. A well-implemented factory allows your application to:

1. Load configuration from various sources (files, environment variables, databases, etc.)
2. Provide a unified interface for accessing configuration values
3. Support different configuration contexts (development, staging, production)
4. Handle configuration validation and defaults
5. Implement configuration overrides and layering

## Key Interfaces

```typescript
interface ConfigurationProviderFactory {
  create(config?: any): ConfigurationProvider;
}

interface ConfigurationProvider {
  get<T>(key: string, defaultValue?: T): T;
  getAll(): Record<string, any>;
  has(key: string): boolean;
  // Additional methods depending on your needs
}

interface ConfigurationSource {
  load(): Promise<Record<string, any>>;
  // May have additional methods
}
```

## Implementation Template

Here's a template for implementing a custom ConfigurationProviderFactory:

```typescript
import {
  ConfigurationProviderFactory,
  ConfigurationProvider,
  ConfigurationSource
} from '@magicbutton.cloud/messaging';
import * as fs from 'fs';
import * as path from 'path';

// 1. Define configuration source implementations
class JsonFileConfigurationSource implements ConfigurationSource {
  private readonly filePath: string;
  
  constructor(filePath: string) {
    this.filePath = filePath;
  }
  
  async load(): Promise<Record<string, any>> {
    try {
      const content = await fs.promises.readFile(this.filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error loading configuration from ${this.filePath}:`, error);
      return {};
    }
  }
}

class EnvironmentConfigurationSource implements ConfigurationSource {
  private readonly prefix: string;
  
  constructor(prefix: string = '') {
    this.prefix = prefix;
  }
  
  async load(): Promise<Record<string, any>> {
    const config: Record<string, any> = {};
    
    // Filter environment variables that start with the prefix
    Object.keys(process.env)
      .filter(key => this.prefix ? key.startsWith(this.prefix) : true)
      .forEach(key => {
        const configKey = this.prefix ? key.slice(this.prefix.length) : key;
        config[configKey] = process.env[key];
      });
    
    return config;
  }
}

// 2. Implement the configuration provider
class DefaultConfigurationProvider implements ConfigurationProvider {
  private config: Record<string, any> = {};
  private readonly sources: ConfigurationSource[];
  
  constructor(sources: ConfigurationSource[]) {
    this.sources = sources;
  }
  
  async initialize(): Promise<void> {
    // Load configuration from all sources in order
    for (const source of this.sources) {
      const sourceConfig = await source.load();
      // Merge with existing config, giving priority to later sources
      this.config = { ...this.config, ...sourceConfig };
    }
  }
  
  get<T>(key: string, defaultValue?: T): T {
    const value = this.getNestedValue(this.config, key);
    return value !== undefined ? value as T : defaultValue as T;
  }
  
  getAll(): Record<string, any> {
    return { ...this.config };
  }
  
  has(key: string): boolean {
    return this.getNestedValue(this.config, key) !== undefined;
  }
  
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    return keys.reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
  }
}

// 3. Implement the configuration provider factory
interface ConfigFactoryOptions {
  sources?: ConfigurationSource[];
  configPath?: string;
  envPrefix?: string;
  useEnv?: boolean;
  autoInitialize?: boolean;
}

export class MyConfigurationProviderFactory implements ConfigurationProviderFactory {
  async create(options: ConfigFactoryOptions = {}): Promise<ConfigurationProvider> {
    const sources: ConfigurationSource[] = options.sources || [];
    
    // Add default sources if not provided
    if (sources.length === 0) {
      if (options.configPath) {
        sources.push(new JsonFileConfigurationSource(options.configPath));
      }
      
      if (options.useEnv !== false) {
        sources.push(new EnvironmentConfigurationSource(options.envPrefix));
      }
      
      // Default config file if none specified
      if (!options.configPath && process.env.NODE_ENV) {
        const defaultConfigPath = path.join(process.cwd(), 'config', `${process.env.NODE_ENV}.json`);
        if (fs.existsSync(defaultConfigPath)) {
          sources.push(new JsonFileConfigurationSource(defaultConfigPath));
        }
      }
    }
    
    // Create provider
    const provider = new DefaultConfigurationProvider(sources);
    
    // Initialize if requested
    if (options.autoInitialize !== false) {
      await provider.initialize();
    }
    
    return provider;
  }
}
```

## Usage Example

Here's how to use your custom ConfigurationProviderFactory:

```typescript
import { Client } from '@magicbutton.cloud/messaging';
import { MyConfigurationProviderFactory } from './my-configuration-provider-factory';

// Create your configuration provider factory
const configFactory = new MyConfigurationProviderFactory();

// Create a configuration provider with specific options
const configProvider = await configFactory.create({
  configPath: './config/app-config.json',
  envPrefix: 'MYAPP_',
  useEnv: true,
  autoInitialize: true
});

// Use the configuration to initialize your client
const client = Client.create({
  transportFactory: new WebSocketTransportFactory(),
  transportConfig: {
    url: configProvider.get('messaging.server.url'),
    reconnect: configProvider.get('messaging.client.reconnect', true),
    timeout: configProvider.get('messaging.client.timeout', 5000)
  }
});

// Use the configuration provider directly
const logLevel = configProvider.get('logging.level', 'info');
const retryAttempts = configProvider.get('messaging.retry.attempts', 3);
```

## Best Practices

1. **Multiple Sources**: Support loading configuration from multiple sources with clear precedence
2. **Environment Awareness**: Load different configurations based on the runtime environment
3. **Default Values**: Provide sensible defaults for all configuration options
4. **Type Safety**: Support type-safe configuration access where possible
5. **Validation**: Validate configuration values against expected formats or schemas
6. **Secrets Management**: Handle sensitive configuration values securely
7. **Dynamic Reloading**: Consider supporting dynamic configuration reloading for long-running applications

## Advanced Scenarios

### Schema Validation

Implementing validation for configuration values:

```typescript
import * as Joi from 'joi';

class ValidatedConfigurationProvider implements ConfigurationProvider {
  private readonly baseProvider: ConfigurationProvider;
  private readonly schema: Joi.ObjectSchema;
  
  constructor(baseProvider: ConfigurationProvider, schema: Joi.ObjectSchema) {
    this.baseProvider = baseProvider;
    this.schema = schema;
  }
  
  async validate(): Promise<void> {
    const config = this.baseProvider.getAll();
    const { error, value } = this.schema.validate(config, { abortEarly: false });
    
    if (error) {
      const errorDetails = error.details.map(detail => 
        `${detail.path.join('.')}: ${detail.message}`
      ).join('\n');
      
      throw new Error(`Configuration validation failed:\n${errorDetails}`);
    }
  }
  
  get<T>(key: string, defaultValue?: T): T {
    return this.baseProvider.get(key, defaultValue);
  }
  
  getAll(): Record<string, any> {
    return this.baseProvider.getAll();
  }
  
  has(key: string): boolean {
    return this.baseProvider.has(key);
  }
}

// Factory extension for validated configuration
class ValidatedConfigurationProviderFactory implements ConfigurationProviderFactory {
  private readonly baseFactory: ConfigurationProviderFactory;
  private readonly schema: Joi.ObjectSchema;
  
  constructor(baseFactory: ConfigurationProviderFactory, schema: Joi.ObjectSchema) {
    this.baseFactory = baseFactory;
    this.schema = schema;
  }
  
  async create(config?: any): Promise<ConfigurationProvider> {
    const baseProvider = await this.baseFactory.create(config);
    const validatedProvider = new ValidatedConfigurationProvider(baseProvider, this.schema);
    
    // Validate configuration immediately
    await validatedProvider.validate();
    
    return validatedProvider;
  }
}

// Usage
const configSchema = Joi.object({
  server: Joi.object({
    port: Joi.number().integer().min(1024).max(65535).required(),
    host: Joi.string().hostname().required()
  }).required(),
  database: Joi.object({
    url: Joi.string().uri().required(),
    poolSize: Joi.number().integer().min(1).max(100).default(10)
  }).required(),
  logging: Joi.object({
    level: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
    format: Joi.string().valid('json', 'text').default('json')
  }).default()
});

const validatedConfigFactory = new ValidatedConfigurationProviderFactory(
  new MyConfigurationProviderFactory(), 
  configSchema
);

const configProvider = await validatedConfigFactory.create();
```

### Remote Configuration Source

Supporting configuration from a remote source:

```typescript
class RemoteConfigurationSource implements ConfigurationSource {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly httpClient: any;
  
  constructor(endpoint: string, apiKey: string, httpClient: any) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.httpClient = httpClient;
  }
  
  async load(): Promise<Record<string, any>> {
    try {
      const response = await this.httpClient.get(this.endpoint, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error loading remote configuration from ${this.endpoint}:`, error);
      return {};
    }
  }
}

// Usage
const configFactory = new MyConfigurationProviderFactory();
const configProvider = await configFactory.create({
  sources: [
    new JsonFileConfigurationSource('./config/defaults.json'),
    new RemoteConfigurationSource(
      'https://config.example.com/api/v1/configurations/myapp',
      process.env.CONFIG_API_KEY,
      httpClient
    ),
    new EnvironmentConfigurationSource('MYAPP_')
  ]
});
```

### Configuration Value Transformation

Supporting transformation of configuration values:

```typescript
class TransformingConfigurationProvider implements ConfigurationProvider {
  private readonly baseProvider: ConfigurationProvider;
  private readonly transformers: Record<string, (value: any) => any>;
  
  constructor(baseProvider: ConfigurationProvider, transformers: Record<string, (value: any) => any> = {}) {
    this.baseProvider = baseProvider;
    this.transformers = transformers;
  }
  
  get<T>(key: string, defaultValue?: T): T {
    const value = this.baseProvider.get(key, defaultValue);
    
    // Apply transformer if one exists for this key
    if (this.transformers[key] && value !== undefined) {
      return this.transformers[key](value) as T;
    }
    
    return value;
  }
  
  getAll(): Record<string, any> {
    const config = this.baseProvider.getAll();
    const transformed: Record<string, any> = {};
    
    // Apply transformers to all values
    for (const [key, value] of Object.entries(config)) {
      transformed[key] = this.transformers[key] ? this.transformers[key](value) : value;
    }
    
    return transformed;
  }
  
  has(key: string): boolean {
    return this.baseProvider.has(key);
  }
}

// Example usage
const configProvider = new TransformingConfigurationProvider(
  baseConfigProvider,
  {
    'database.connectionPoolSize': (value) => parseInt(value, 10),
    'server.enableSsl': (value) => value === 'true' || value === '1',
    'logging.level': (value) => value.toLowerCase(),
    'secrets.apiKey': (value) => decrypt(value)
  }
);
```