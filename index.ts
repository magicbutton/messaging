// Core types - only export interfaces and types needed directly
export {
  IContract,
  IAccessSettings,
  IActor,
  IAuthorizationProvider,
  IAuthProvider,
  IAuthResult,
  IEventPayload,
  IMessageContext,
  IPermissionDefinition,
  IRequestPayload,
  IResponsePayload,
  IRoleDefinition,
  ITransport,
  IClientOptions,
  IErrorDefinition,
  IServerOptions,
  ErrorSeverity,
  SchemaType,
  RequestSchemaType,
  ResponseSchemaType
} from "./types"

// Note: We export Contract as a type alias in the type exports section below

// Core components
export { MessagingClient } from "./client"
export { MessagingServer } from "./server"
export { BaseTransport } from "./transport-adapter"

// Factory interfaces and providers
export { TransportProvider, TransportFactory, TransportConfig } from "./transport-factory"
export { ClientProvider, ClientFactory, ClientConfig } from "./client-factory"
export { ServerProvider, ServerFactory, ServerConfig } from "./server-factory"
export { AuthProviderRegistry, AuthProviderFactory, AuthProviderConfig } from "./auth-provider-factory"
export {
  AuthorizationProviderRegistry,
  AuthorizationProviderFactory,
  AuthorizationProviderConfig
} from "./authorization-provider-factory"

// Transport implementations
export { InMemoryTransport } from "./in-memory-transport"
export { InMemoryTransportFactory } from "./in-memory-transport-factory"

// Auth provider implementations
export { DefaultAuthProvider } from "./auth-provider"
export { DefaultAuthProviderFactory, DefaultAuthProviderConfig } from "./default-auth-provider-factory"

// Authorization provider implementations
export { DefaultAuthorizationProvider } from "./authorization-provider"
export { DefaultAuthorizationProviderFactory } from "./default-authorization-provider-factory"

// Error handling
export { ErrorRegistry, MessagingError, ErrorType, retry, handleErrors } from "./errors"

// Observability factories
export {
  ObservabilityProviderRegistry,
  ObservabilityProviderFactory,
  ObservabilityConfig,
  LoggerFactory,
  MetricsFactory,
  TracerFactory
} from "./observability-factory"

export {
  DefaultObservabilityProviderFactory,
  ConsoleLoggerFactory,
  NoopMetricsFactory,
  NoopTracerFactory
} from "./default-observability-provider-factory"

// Middleware factories
export {
  MiddlewareFactory,
  MiddlewareConfig,
  MiddlewareProvider,
  MiddlewareRegistry
} from "./middleware-factory"

export {
  DefaultMiddlewareFactory,
  DefaultMiddlewareProvider
} from "./default-middleware-factory"

// Configuration system
export {
  ConfigurationProvider,
  ConfigurationSource,
  ConfigurationProviderFactory,
  ConfigurationRegistry,
  MessagingConfig
} from "./configuration"

export {
  DefaultConfigurationProvider,
  DefaultConfigurationProviderFactory,
  MemoryConfigurationSource,
  EnvironmentConfigurationSource,
  JsonFileConfigurationSource
} from "./default-configuration"

// Core utility functions
export { createContract, createEventMap, createRequestSchemaMap } from "./utils"
export {
  createRole,
  createSystem,
  createAccessControl,
  AccessControl,
  Role,
  System
} from "./access-control"
export {
  createVersionedSchema,
  getLatestSchema,
  getSchemaByVersion,
  VersionedSchema,
  SchemaVersion
} from "./versioned-schema"

// Testing utilities
export {
  TestMessaging,
  MockTransport,
  EventCaptureCallback,
  RequestCaptureCallback,
  MockTransportOptions,
  TestMessagingOptions
} from "./testing"

// Middleware components
export {
  EventMiddleware,
  RequestMiddleware,
  MiddlewareManager,
  createEventValidationMiddleware,
  createRequestValidationMiddleware,
  createEventLoggingMiddleware,
  createRequestLoggingMiddleware,
  createAuthenticationMiddleware
} from "./middleware"

// Observability components
export {
  Logger,
  Metrics,
  Span,
  Tracer,
  ObservabilityProvider,
  LogLevel,
  createTracedContext,
  getObservabilityProvider,
  setObservabilityProvider,
  ConsoleLogger,
  NoopMetrics,
  NoopTracer,
  NoopSpan
} from "./observability"

// Type exports
export type {
  // Message types
  MessageContext,
  EventPayload,
  RequestPayload,
  ResponsePayload,

  // Contract types
  Contract,

  // Auth types
  AuthResult,
  Actor,

  // Schema types
  EventSchemas,
  RequestSchemas,

  // Component interfaces
  Transport,
  AuthProvider,
  AuthorizationProvider,

  // Utility types
  ClientStatus,
  AccessSettings,
  RoleDefinition,
  PermissionDefinition,
  InferEventData,
  InferRequestData,
  InferResponseData
} from "./types"