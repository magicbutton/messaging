import { ITransport, IContract, IClientOptions, IServerOptions, IAuthProvider, IAuthorizationProvider } from "../types";
import { MessagingClient } from "../client";
import { MessagingServer } from "../server";

/**
 * Transport configuration interface for creating transports
 */
export interface ITransportConfig {
  type: string;
  connectionString?: string;
  options?: Record<string, any>;
}

/**
 * Transport factory interface for creating typed transports
 */
export interface ITransportFactory<TContract extends IContract> {
  /**
   * Create a transport instance
   * @param config The transport configuration
   */
  createTransport(config: ITransportConfig): ITransport<TContract>;
}

/**
 * Client configuration interface for creating clients
 */
export interface IClientConfig<TContract extends IContract> {
  transport: ITransport<TContract>;
  options?: IClientOptions;
}

/**
 * Client factory interface for creating messaging clients
 */
export interface IClientFactory<TContract extends IContract> {
  /**
   * Create a client instance
   * @param config The client configuration
   */
  createClient(config: IClientConfig<TContract>): MessagingClient<TContract>;
}

/**
 * Server configuration interface for creating servers
 */
export interface IServerConfig<TContract extends IContract> {
  transport: ITransport<TContract>;
  contract: TContract;
  options?: IServerOptions;
}

/**
 * Server factory interface for creating messaging servers
 */
export interface IServerFactory<TContract extends IContract> {
  /**
   * Create a server instance
   * @param config The server configuration
   */
  createServer(config: IServerConfig<TContract>): MessagingServer<TContract>;
}

/**
 * Auth provider configuration interface for creating auth providers
 */
export interface IAuthProviderConfig {
  type: string;
  options?: Record<string, any>;
}

/**
 * Auth provider factory interface for creating auth providers
 */
export interface IAuthProviderFactory {
  /**
   * Create an auth provider instance
   * @param config The auth provider configuration
   */
  createAuthProvider(config: IAuthProviderConfig): IAuthProvider;
}

/**
 * Authorization provider configuration interface for creating authorization providers
 */
export interface IAuthorizationProviderConfig<TContract extends IContract> {
  type: string;
  contract: TContract;
  options?: Record<string, any>;
}

/**
 * Authorization provider factory interface for creating authorization providers
 */
export interface IAuthorizationProviderFactory<TContract extends IContract> {
  /**
   * Create an authorization provider instance
   * @param config The authorization provider configuration
   */
  createAuthorizationProvider(config: IAuthorizationProviderConfig<TContract>): IAuthorizationProvider<TContract>;
}

// Legacy aliases for backward compatibility
export type TransportConfig = ITransportConfig;
export type TransportFactory<TContract extends IContract> = ITransportFactory<TContract>;
export type ClientConfig<TContract extends IContract> = IClientConfig<TContract>;
export type ClientFactory<TContract extends IContract> = IClientFactory<TContract>;
export type ServerConfig<TContract extends IContract> = IServerConfig<TContract>;
export type ServerFactory<TContract extends IContract> = IServerFactory<TContract>;
export type AuthProviderConfig = IAuthProviderConfig;
export type AuthProviderFactory = IAuthProviderFactory;
export type AuthorizationProviderConfig<TContract extends IContract> = IAuthorizationProviderConfig<TContract>;
export type AuthorizationProviderFactory<TContract extends IContract> = IAuthorizationProviderFactory<TContract>;