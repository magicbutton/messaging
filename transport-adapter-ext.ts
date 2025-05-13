import { Contract } from './types';
import { Transport, BaseTransport } from './transport-adapter';
import { 
  TransportExtensions, 
  BaseTransportExtensions, 
  BrowserExtensions, 
  CliExtensions, 
  ServerExtensions 
} from './transport-extensions';

/**
 * Configuration options for extensible transports
 */
export interface ExtensibleTransportConfig {
  /**
   * Unique name for the connection
   */
  connectionName: string;
  
  /**
   * Context information for the connection
   */
  context: string;
  
  /**
   * Whether to enable reconnection
   */
  reconnect?: boolean;
  
  /**
   * Reconnection configuration
   */
  reconnectOptions?: {
    /**
     * Maximum number of reconnection attempts
     */
    maxRetries?: number;
    
    /**
     * Backoff factor for retry delay (exponential backoff)
     */
    backoffFactor?: number;
    
    /**
     * Initial delay in milliseconds
     */
    initialDelayMs?: number;
    
    /**
     * Maximum delay in milliseconds
     */
    maxDelayMs?: number;
  };
  
  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
  
  /**
   * Whether to enable telemetry
   */
  telemetry?: boolean;
  
  /**
   * Browser-specific extensions
   */
  browserExtensions?: BrowserExtensions;
  
  /**
   * CLI-specific extensions
   */
  cliExtensions?: CliExtensions;
  
  /**
   * Server-specific extensions
   */
  serverExtensions?: ServerExtensions;
}

/**
 * Extensible transport that combines the base Transport interface with extension capabilities
 */
export abstract class ExtensibleTransport<TContract extends Contract> 
  extends BaseTransport<TContract> 
  implements Transport<TContract>, TransportExtensions {
  
  protected extensions = new BaseTransportExtensions();
  protected config: ExtensibleTransportConfig;
  protected reconnectAttempts = 0;
  protected reconnectTimer: NodeJS.Timeout | null = null;
  
  /**
   * Creates a new extensible transport
   * @param config Transport configuration
   */
  constructor(config: ExtensibleTransportConfig) {
    super();
    this.config = {
      ...config,
      reconnectOptions: {
        maxRetries: 5,
        backoffFactor: 1.5,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        ...config.reconnectOptions
      }
    };
    
    // Initialize extensions
    if (config.browserExtensions) {
      Object.entries(config.browserExtensions).forEach(([key, impl]) => {
        this.extensions.browser[key] = impl;
      });
    }
    
    if (config.cliExtensions) {
      Object.entries(config.cliExtensions).forEach(([key, impl]) => {
        this.extensions.cli[key] = impl;
      });
    }
    
    if (config.serverExtensions) {
      Object.entries(config.serverExtensions).forEach(([key, impl]) => {
        this.extensions.server[key] = impl;
      });
    }
  }
  
  /**
   * Gets the list of available extension names
   */
  getExtensionNames(): string[] {
    return this.extensions.getExtensionNames();
  }
  
  /**
   * Checks if a specific extension is supported
   * @param name Extension name
   */
  hasExtension(name: string): boolean {
    return this.extensions.hasExtension(name);
  }
  
  /**
   * Gets an extension by name
   * @param name Extension name
   */
  getExtension<T = unknown>(name: string): T | undefined {
    return this.extensions.getExtension<T>(name);
  }
  
  /**
   * Adds an extension to the transport
   * @param name Extension name
   * @param implementation Extension implementation
   */
  addExtension<T>(name: string, implementation: T): void {
    this.extensions.addExtension(name, implementation);
  }
  
  /**
   * Browser-specific extensions
   */
  get browser(): BrowserExtensions {
    return this.extensions.browser;
  }
  
  /**
   * CLI-specific extensions
   */
  get cli(): CliExtensions {
    return this.extensions.cli;
  }
  
  /**
   * Server-specific extensions
   */
  get server(): ServerExtensions {
    return this.extensions.server;
  }
  
  /**
   * Connects to the transport
   * @param connectionString Connection string
   */
  async connect(connectionString?: string): Promise<void> {
    try {
      // Implement in derived classes
      if (this.config.debug) {
        console.log(`[${this.config.connectionName}] Connecting to ${connectionString || 'default endpoint'}...`);
      }
      
      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0;
      
    } catch (error) {
      if (this.config.debug) {
        console.error(`[${this.config.connectionName}] Connection error:`, error);
      }
      
      // Attempt reconnection if enabled
      if (this.config.reconnect) {
        await this.attemptReconnect(connectionString);
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Disconnects from the transport
   */
  async disconnect(): Promise<void> {
    if (this.config.debug) {
      console.log(`[${this.config.connectionName}] Disconnecting...`);
    }
    
    // Cancel any pending reconnection attempts
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Implement in derived classes
  }
  
  /**
   * Attempts to reconnect to the transport with exponential backoff
   * @param connectionString Connection string
   */
  protected async attemptReconnect(connectionString?: string): Promise<boolean> {
    const options = this.config.reconnectOptions!;
    
    if (this.reconnectAttempts >= options.maxRetries!) {
      if (this.config.debug) {
        console.error(`[${this.config.connectionName}] Maximum reconnect attempts (${options.maxRetries}) reached.`);
      }
      return false;
    }
    
    this.reconnectAttempts++;
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      options.initialDelayMs! * Math.pow(options.backoffFactor!, this.reconnectAttempts - 1),
      options.maxDelayMs!
    );
    
    if (this.config.debug) {
      console.log(`[${this.config.connectionName}] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${options.maxRetries})...`);
    }
    
    // Wait for the calculated delay
    await new Promise<void>((resolve) => {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        resolve();
      }, delay);
    });
    
    try {
      // Attempt to connect again
      await this.connect(connectionString);
      return true;
    } catch (error) {
      // If this attempt fails, it will be caught in the connect method,
      // which will call attemptReconnect again if needed
      return false;
    }
  }
}