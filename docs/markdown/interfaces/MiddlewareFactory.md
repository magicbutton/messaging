[**Magic Button Messaging v1.1.2**](../README.md)

***

# Interface: MiddlewareFactory\<TContract\>

Factory interface for creating middleware managers

This factory creates and configures middleware managers based on
declarative configuration, enabling consistent middleware setup
without exposing implementation details.

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md) = [`Contract`](../type-aliases/Contract.md)

## Methods

### createMiddlewareManager()

> **createMiddlewareManager**(`config`, `contract`, `middlewareProvider?`): [`MiddlewareManager`](../classes/MiddlewareManager.md)

Create a middleware manager with the specified configuration

#### Parameters

##### config

[`MiddlewareConfig`](MiddlewareConfig.md)

The middleware configuration

##### contract

`TContract`

The contract for validation middleware

##### middlewareProvider?

[`MiddlewareProvider`](MiddlewareProvider.md)

Optional provider for custom middleware

#### Returns

[`MiddlewareManager`](../classes/MiddlewareManager.md)

A configured middleware manager
