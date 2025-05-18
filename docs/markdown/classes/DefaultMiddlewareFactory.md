[**Magic Button Messaging v1.2.0**](../README.md)

***

# Class: DefaultMiddlewareFactory\<TContract\>

Default middleware factory implementation

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

## Implements

- [`MiddlewareFactory`](../interfaces/MiddlewareFactory.md)\<`TContract`\>

## Constructors

### Constructor

> **new DefaultMiddlewareFactory**\<`TContract`\>(): `DefaultMiddlewareFactory`\<`TContract`\>

#### Returns

`DefaultMiddlewareFactory`\<`TContract`\>

## Methods

### createMiddlewareManager()

> **createMiddlewareManager**(`config`, `contract`, `middlewareProvider?`): [`MiddlewareManager`](MiddlewareManager.md)

Create a middleware manager with the specified configuration

#### Parameters

##### config

[`MiddlewareConfig`](../interfaces/MiddlewareConfig.md)

The middleware configuration

##### contract

`TContract`

The contract for validation middleware

##### middlewareProvider?

[`MiddlewareProvider`](../interfaces/MiddlewareProvider.md)

Optional provider for custom middleware

#### Returns

[`MiddlewareManager`](MiddlewareManager.md)

#### Implementation of

[`MiddlewareFactory`](../interfaces/MiddlewareFactory.md).[`createMiddlewareManager`](../interfaces/MiddlewareFactory.md#createmiddlewaremanager)
