import { EventEmitter } from 'events';
import { Contract } from './types';
import { Transport } from './transport-adapter';
import { ExtensibleTransport as ExtensibleTransportAdapter } from './transport-adapter-ext';

/**
 * Connection states for the connection manager
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTING = 'disconnecting',
  ERROR = 'error'
}

/**
 * ConnectionManager events
 */
export enum ConnectionEvent {
  STATE_CHANGED = 'stateChanged',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  RECONNECTED = 'reconnected',
  RECONNECT_FAILED = 'reconnectFailed',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat'
}

/**
 * Configuration for the ConnectionManager
 */
export interface ConnectionManagerConfig {
  /**
   * Whether to automatically reconnect on connection loss
   */
  autoReconnect?: boolean;
  
  /**
   * Maximum number of reconnection attempts
   */
  maxReconnectAttempts?: number;
  
  /**
   * Initial delay in milliseconds between reconnection attempts
   */
  initialReconnectDelayMs?: number;
  
  /**
   * Maximum delay in milliseconds between reconnection attempts
   */
  maxReconnectDelayMs?: number;
  
  /**
   * Factor by which to increase delay between reconnection attempts
   */
  reconnectBackoffFactor?: number;
  
  /**
   * Whether to reset reconnect attempts counter after a successful connection
   */
  resetReconnectAttemptsOnSuccess?: boolean;
  
  /**
   * Whether to send periodic heartbeats
   */
  heartbeat?: boolean;
  
  /**
   * Interval in milliseconds between heartbeats
   */
  heartbeatIntervalMs?: number;
  
  /**
   * Timeout in milliseconds to wait for heartbeat responses
   */
  heartbeatTimeoutMs?: number;
  
  /**
   * Number of missed heartbeats before considering the connection lost
   */
  missedHeartbeatsThreshold?: number;
  
  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<ConnectionManagerConfig> = {
  autoReconnect: true,
  maxReconnectAttempts: 10,
  initialReconnectDelayMs: 1000,
  maxReconnectDelayMs: 30000,
  reconnectBackoffFactor: 1.5,
  resetReconnectAttemptsOnSuccess: true,
  heartbeat: true,
  heartbeatIntervalMs: 30000,
  heartbeatTimeoutMs: 10000,
  missedHeartbeatsThreshold: 3,
  debug: false
};

/**
 * ConnectionManager handles the connection lifecycle including automatic reconnection,
 * heartbeat monitoring, and connection state management
 */
export class ConnectionManager<TContract extends Contract> extends EventEmitter {
  /**
   * The transport being managed
   */
  private transport: Transport<TContract>;
  
  /**
   * Current connection state
   */
  private _state: ConnectionState = ConnectionState.DISCONNECTED;
  
  /**
   * Configuration
   */
  private config: Required<ConnectionManagerConfig>;
  
  /**
   * Connection string used for the current/last connection
   */
  private connectionString?: string;
  
  /**
   * Number of reconnection attempts made
   */
  private reconnectAttempts = 0;
  
  /**
   * Timer for reconnection attempts
   */
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  /**
   * Timer for heartbeat
   */
  private heartbeatTimer: NodeJS.Timeout | null = null;
  
  /**
   * Number of consecutive missed heartbeats
   */
  private missedHeartbeats = 0;
  
  /**
   * Last heartbeat timestamp
   */
  private lastHeartbeat = 0;
  
  /**
   * Creates a new ConnectionManager
   * @param transport The transport to manage
   * @param config Configuration options
   */
  constructor(transport: Transport<TContract>, config: ConnectionManagerConfig = {}) {
    super();
    this.transport = transport;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.heartbeat) {
      this.setupHeartbeat();
    }
  }
  
  /**
   * Gets the current connection state
   */
  get state(): ConnectionState {
    return this._state;
  }
  
  /**
   * Gets whether the connection is currently active
   */
  get isConnected(): boolean {
    return this._state === ConnectionState.CONNECTED;
  }
  
  /**
   * Sets the connection state and emits events
   * @param state The new state
   * @param error Optional error information
   */
  private setState(state: ConnectionState, error?: Error): void {
    const previousState = this._state;
    this._state = state;
    
    this.emit(ConnectionEvent.STATE_CHANGED, { 
      previousState, 
      currentState: state,
      error
    });
    
    // Emit specific events based on the new state
    switch (state) {
      case ConnectionState.CONNECTED:
        this.emit(ConnectionEvent.CONNECTED);
        break;
      case ConnectionState.DISCONNECTED:
        this.emit(ConnectionEvent.DISCONNECTED);
        break;
      case ConnectionState.RECONNECTING:
        this.emit(ConnectionEvent.RECONNECTING, { attempt: this.reconnectAttempts });
        break;
      case ConnectionState.ERROR:
        this.emit(ConnectionEvent.ERROR, error);
        break;
    }
    
    if (this.config.debug) {
      console.log(`[ConnectionManager] State changed: ${previousState} -> ${state}${error ? ` (Error: ${error.message})` : ''}`);
    }
  }
  
  /**
   * Connects to the transport
   * @param connectionString Optional connection string
   */
  async connect(connectionString?: string): Promise<void> {
    if (this._state === ConnectionState.CONNECTED || 
        this._state === ConnectionState.CONNECTING) {
      if (this.config.debug) {
        console.log(`[ConnectionManager] Already ${this._state}, ignoring connect request`);
      }
      return;
    }
    
    try {
      this.setState(ConnectionState.CONNECTING);
      this.connectionString = connectionString;
      
      // Use a default connection string if none provided
      const connectString = connectionString || 'default';
      await this.transport.connect(connectString);
      
      this.setState(ConnectionState.CONNECTED);
      
      // Reset reconnect attempts counter on successful connection
      if (this.config.resetReconnectAttemptsOnSuccess) {
        this.reconnectAttempts = 0;
      }
      
      // Initialize heartbeat monitoring
      this.resetHeartbeatMonitoring();
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.setState(ConnectionState.ERROR, error);
      
      if (this.config.debug) {
        console.error('[ConnectionManager] Connection error:', error);
      }
      
      // Attempt to reconnect if auto-reconnect is enabled
      if (this.config.autoReconnect) {
        this.scheduleReconnect();
      } else {
        this.setState(ConnectionState.DISCONNECTED);
        throw error;
      }
    }
  }
  
  /**
   * Disconnects from the transport
   */
  async disconnect(): Promise<void> {
    // Clear any pending timers
    this.clearTimers();
    
    if (this._state === ConnectionState.DISCONNECTED || 
        this._state === ConnectionState.DISCONNECTING) {
      if (this.config.debug) {
        console.log(`[ConnectionManager] Already ${this._state}, ignoring disconnect request`);
      }
      return;
    }
    
    try {
      this.setState(ConnectionState.DISCONNECTING);
      await this.transport.disconnect();
      this.setState(ConnectionState.DISCONNECTED);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      if (this.config.debug) {
        console.error('[ConnectionManager] Disconnect error:', error);
      }
      
      this.setState(ConnectionState.ERROR, error);
      
      // Even if there's an error, we're still disconnected
      this.setState(ConnectionState.DISCONNECTED);
      throw error;
    }
  }
  
  /**
   * Schedules a reconnection attempt
   */
  private scheduleReconnect(): void {
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Check if we've exceeded the maximum number of reconnect attempts
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      if (this.config.debug) {
        console.log(`[ConnectionManager] Maximum reconnect attempts (${this.config.maxReconnectAttempts}) reached, giving up`);
      }
      
      this.emit(ConnectionEvent.RECONNECT_FAILED, { 
        attempts: this.reconnectAttempts,
        maxAttempts: this.config.maxReconnectAttempts
      });
      
      this.setState(ConnectionState.DISCONNECTED);
      return;
    }
    
    // Increment the reconnect attempts counter
    this.reconnectAttempts++;
    
    // Calculate the delay with exponential backoff
    const delay = Math.min(
      this.config.initialReconnectDelayMs * Math.pow(this.config.reconnectBackoffFactor, this.reconnectAttempts - 1),
      this.config.maxReconnectDelayMs
    );
    
    if (this.config.debug) {
      console.log(`[ConnectionManager] Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    }
    
    this.setState(ConnectionState.RECONNECTING);
    
    // Set a timer for the reconnect attempt
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      
      try {
        if (this.config.debug) {
          console.log(`[ConnectionManager] Attempting reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
        }
        
        await this.transport.connect(this.connectionString || 'default');
        
        this.setState(ConnectionState.CONNECTED);
        
        // Emit reconnected event
        this.emit(ConnectionEvent.RECONNECTED, { attempts: this.reconnectAttempts });
        
        // Reset the reconnect attempts counter on successful reconnection
        if (this.config.resetReconnectAttemptsOnSuccess) {
          this.reconnectAttempts = 0;
        }
        
        // Reset heartbeat monitoring
        this.resetHeartbeatMonitoring();
        
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        
        if (this.config.debug) {
          console.error(`[ConnectionManager] Reconnect attempt ${this.reconnectAttempts} failed:`, error);
        }
        
        // Schedule another reconnect attempt
        this.scheduleReconnect();
      }
    }, delay);
  }
  
  /**
   * Sets up the heartbeat monitoring system
   */
  private setupHeartbeat(): void {
    // Check if transport has a broadcast method (for server transports)
    const hasServerCapabilities = 'broadcast' in this.transport;
    
    if (this.config.heartbeat && hasServerCapabilities) {
      // Set up heartbeat sending (only for server transports)
      const sendHeartbeat = () => {
        if (this._state === ConnectionState.CONNECTED && hasServerCapabilities) {
          const timestamp = Date.now();
          // Cast to any to access the broadcast method
          const serverTransport = this.transport as any;
          serverTransport.broadcast('heartbeat', { timestamp });
          
          if (this.config.debug) {
            console.log(`[ConnectionManager] Sent heartbeat at ${new Date(timestamp).toISOString()}`);
          }
        }
      };
      
      this.heartbeatTimer = setInterval(sendHeartbeat, this.config.heartbeatIntervalMs);
    } else if (this.config.heartbeat && 'on' in this.transport) {
      // Set up heartbeat receiving (for client transports)
      (this.transport as any).on('heartbeat', (data: any) => {
        const timestamp = data?.timestamp || Date.now();
        this.lastHeartbeat = timestamp;
        this.missedHeartbeats = 0;
        
        if (this.config.debug) {
          console.log(`[ConnectionManager] Received heartbeat at ${new Date(timestamp).toISOString()}`);
        }
        
        this.emit(ConnectionEvent.HEARTBEAT, { timestamp });
      });
      
      // Set up heartbeat checking
      const checkHeartbeat = () => {
        if (this._state === ConnectionState.CONNECTED) {
          const now = Date.now();
          const timeSinceLastHeartbeat = now - this.lastHeartbeat;
          
          if (this.lastHeartbeat > 0 && timeSinceLastHeartbeat > this.config.heartbeatTimeoutMs) {
            this.missedHeartbeats++;
            
            if (this.config.debug) {
              console.log(`[ConnectionManager] Missed heartbeat (${this.missedHeartbeats}/${this.config.missedHeartbeatsThreshold})`);
            }
            
            if (this.missedHeartbeats >= this.config.missedHeartbeatsThreshold) {
              if (this.config.debug) {
                console.log(`[ConnectionManager] Heartbeat threshold exceeded, reconnecting`);
              }
              
              // Consider the connection lost
              this.setState(ConnectionState.ERROR, new Error('Heartbeat timeout'));
              
              // Attempt to reconnect
              if (this.config.autoReconnect) {
                this.scheduleReconnect();
              } else {
                this.setState(ConnectionState.DISCONNECTED);
              }
            }
          }
        }
      };
      
      this.heartbeatTimer = setInterval(checkHeartbeat, this.config.heartbeatIntervalMs / 2);
    }
  }
  
  /**
   * Resets the heartbeat monitoring system
   */
  private resetHeartbeatMonitoring(): void {
    this.lastHeartbeat = Date.now();
    this.missedHeartbeats = 0;
  }
  
  /**
   * Clears all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  /**
   * Cleans up resources
   */
  dispose(): void {
    this.clearTimers();
    this.removeAllListeners();
    
    // If connected, disconnect
    if (this._state === ConnectionState.CONNECTED) {
      this.disconnect().catch(() => {});
    }
  }
}