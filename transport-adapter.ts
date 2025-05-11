import type { Transport, Contract, MessageContext, AuthResult } from "./types"

/**
 * Base abstract class for creating custom transport implementations
 *
 * This class provides a foundation for transport implementations in the
 * factory pattern. Custom transports should extend this class and be
 * created through a TransportFactory implementation.
 */
export abstract class BaseTransport<TContract extends Contract> implements Transport<TContract> {
  protected connected = false
  protected connectionString = ""
  
  /**
   * Connect to the transport
   * @param connectionString The connection string to connect to
   */
  abstract connect(connectionString: string): Promise<void>
  
  /**
   * Disconnect from the transport
   */
  abstract disconnect(): Promise<void>
  
  /**
   * Get the current connection string
   */
  getConnectionString(): string {
    return this.connectionString
  }
  
  /**
   * Check if the transport is connected
   */
  isConnected(): boolean {
    return this.connected
  }
  
  /**
   * Emit an event
   * @param event The event type
   * @param payload The event payload
   * @param context Optional message context
   */
  abstract emit<E extends keyof TContract["events"] & string>(
    event: E, 
    payload: any, 
    context?: MessageContext
  ): Promise<void>
  
  /**
   * Register an event handler
   * @param event The event type
   * @param handler The event handler
   * @param subscriptionContext Optional subscription context
   */
  abstract on<E extends keyof TContract["events"] & string>(
    event: E,
    handler: (payload: any, context: MessageContext) => void,
    subscriptionContext?: MessageContext
  ): void
  
  /**
   * Unregister an event handler
   * @param event The event type
   * @param handler The event handler
   */
  abstract off<E extends keyof TContract["events"] & string>(
    event: E, 
    handler: (payload: any, context: MessageContext) => void
  ): void
  
  /**
   * Send a request to the server
   * @param requestType The request type
   * @param payload The request payload
   * @param context Optional message context
   */
  abstract request<R extends keyof TContract["requests"] & string>(
    requestType: R, 
    payload: any, 
    context?: MessageContext
  ): Promise<any>
  
  /**
   * Register a request handler
   * @param requestType The request type
   * @param handler The request handler
   */
  abstract handleRequest<R extends keyof TContract["requests"] & string>(
    requestType: R,
    handler: (payload: any, context: MessageContext) => Promise<any>
  ): void
  
  /**
   * Login to the server
   * @param credentials The login credentials
   */
  abstract login(credentials: { username: string; password: string } | { token: string }): Promise<AuthResult>
  
  /**
   * Logout from the server
   */
  abstract logout(): Promise<void>
}