[**Magic Button Messaging v1.2.0**](../README.md)

***

# Interface: MessagingConfig\<TContract\>

Complete messaging system configuration for factory-based setup

This interface provides a unified configuration structure for all
system components, facilitating consistent configuration across
a distributed system through the factory pattern.

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md) = [`Contract`](../type-aliases/Contract.md)

## Indexable

\[`key`: `string`\]: `any`

Additional custom configuration for extensions

Allows for custom components to be configured through
the same configuration system

## Properties

### authorizationProvider?

> `optional` **authorizationProvider**: [`AuthorizationProviderConfig`](AuthorizationProviderConfig.md)\<`TContract`\>

Authorization provider factory configuration

Controls access control and permissions

***

### authProvider?

> `optional` **authProvider**: [`AuthProviderConfig`](AuthProviderConfig.md)

Authentication provider factory configuration

Controls how authentication is performed

***

### client?

> `optional` **client**: `Omit`\<[`ClientConfig`](ClientConfig.md)\<`TContract`\>, `"transport"`\>

Client factory configuration

Used when creating client instances through ClientFactory
The transport field is omitted as it's provided separately
and linked by the factory system

***

### middleware?

> `optional` **middleware**: [`MiddlewareConfig`](MiddlewareConfig.md)

Middleware factory configuration

Defines middleware components and their configuration

***

### observability?

> `optional` **observability**: [`ObservabilityConfig`](ObservabilityConfig.md)

Observability provider factory configuration

Controls logging, metrics, and tracing behavior

***

### server?

> `optional` **server**: `Omit`\<[`ServerConfig`](ServerConfig.md)\<`TContract`\>, `"transport"`\>

Server factory configuration

Used when creating server instances through ServerFactory
The transport field is omitted as it's provided separately
and linked by the factory system

***

### transport

> **transport**: [`TransportConfig`](TransportConfig.md)

Transport factory configuration

Defines how the messaging transport should be created and configured
