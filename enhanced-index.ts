// Export all the enhanced messaging components

// Core types
export * from './types';
export * from './enhanced-types';

// Enhanced transport system
export * from './transport-extensions';
export { 
  ExtensibleTransport as ExtensibleTransportAdapter,
  ExtensibleTransportConfig
} from './transport-adapter-ext';
export * from './transport-adapter';

// Connection management
export * from './connection-manager';

// Middleware system
export * from './middleware-system';

// Original messaging components
export * from './client';
export * from './server';
export * from './errors';
export * from './utils';
export * from './versioned-schema';

// Factory interfaces
export * from './client-factory';
export * from './server-factory';
export * from './transport-factory';

/**
 * Magic Button Cloud Messaging
 * 
 * Enhanced version with:
 * - Platform-specific transport extensions
 * - Robust connection management with reconnection
 * - Comprehensive middleware system
 * 
 * @example
 * 
 * // Create a client with enhanced features
 * import { Client, ExtensibleTransport, ConnectionManager, createLoggingMiddleware } from '@magicbutton.cloud/messaging';
 * 
 * // 1. Initialize transport with extensions
 * const transport = new ChromeExtensibleTransport({
 *   connectionName: 'client',
 *   context: 'browser',
 *   reconnect: true,
 *   browserExtensions: {
 *     async openSidePanel() {
 *       await chrome.sidePanel.open();
 *     }
 *   }
 * });
 * 
 * // 2. Create connection manager for resilience
 * const connectionManager = new ConnectionManager(transport, {
 *   autoReconnect: true,
 *   heartbeat: true,
 *   debug: true
 * });
 * 
 * // 3. Add middleware for cross-cutting concerns
 * const middleware = [
 *   createLoggingMiddleware(),
 *   createPerformanceMiddleware(),
 *   createAuthenticationMiddleware({
 *     addAuthToken: (request) => ({
 *       ...request,
 *       auth: { token: 'my-auth-token' }
 *     })
 *   })
 * ];
 * 
 * // 4. Configure and use the client
 * const client = Client.create({
 *   transport,
 *   connectionManager,
 *   middleware
 * });
 * 
 * // Connect and use enhanced features
 * await client.connect();
 * 
 * // Use browser-specific extensions
 * if (client.transport.hasExtension('openSidePanel')) {
 *   await client.transport.getExtension('openSidePanel')();
 * }
 */