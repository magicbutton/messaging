[**Magic Button Messaging v1.1.3**](../README.md)

***

# Class: MiddlewareRegistry

Registry for middleware factories and providers

This registry provides a centralized system for middleware factory
registration and lookup, enabling consistent middleware setup across
the application using the factory pattern.

## Constructors

### Constructor

> **new MiddlewareRegistry**(): `MiddlewareRegistry`

#### Returns

`MiddlewareRegistry`

## Methods

### clear()

> `static` **clear**(): `void`

Clear all registered factories and providers

This is primarily useful for testing to ensure a clean state
between test cases or when reconfiguring the system.

#### Returns

`void`

***

### createMiddlewareManager()

> `static` **createMiddlewareManager**\<`TContract`\>(`config`, `contract`): [`MiddlewareManager`](MiddlewareManager.md)

Create a middleware manager using the factory pattern

This method handles factory lookup and middleware manager creation
based on configuration, abstracting the implementation details.

#### Type Parameters

##### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

#### Parameters

##### config

[`MiddlewareConfig`](../interfaces/MiddlewareConfig.md)

The middleware configuration

##### contract

`TContract`

The contract used for validation middleware

#### Returns

[`MiddlewareManager`](MiddlewareManager.md)

A configured middleware manager

#### Throws

Error if the factory type is not registered

***

### getMiddlewareProvider()

> `static` **getMiddlewareProvider**(`type`): `undefined` \| [`MiddlewareProvider`](../interfaces/MiddlewareProvider.md)

Get a middleware provider by type

#### Parameters

##### type

`string`

The provider type identifier

#### Returns

`undefined` \| [`MiddlewareProvider`](../interfaces/MiddlewareProvider.md)

The provider instance or undefined if not found

***

### hasFactory()

> `static` **hasFactory**(`type`): `boolean`

Check if a middleware factory type is registered

#### Parameters

##### type

`string`

The factory type identifier to check

#### Returns

`boolean`

True if registered, false otherwise

***

### hasMiddlewareProvider()

> `static` **hasMiddlewareProvider**(`type`): `boolean`

Check if a middleware provider type is registered

#### Parameters

##### type

`string`

The provider type identifier to check

#### Returns

`boolean`

True if registered, false otherwise

***

### registerFactory()

> `static` **registerFactory**\<`TContract`\>(`type`, `factory`): `void`

Register a middleware factory in the registry

#### Type Parameters

##### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

#### Parameters

##### type

`string`

The middleware factory type identifier

##### factory

[`MiddlewareFactory`](../interfaces/MiddlewareFactory.md)\<`TContract`\>

The factory implementation to register

#### Returns

`void`

***

### registerMiddlewareProvider()

> `static` **registerMiddlewareProvider**(`type`, `provider`): `void`

Register a middleware provider in the registry

Middleware providers supply named middleware instances
that can be referenced in configuration.

#### Parameters

##### type

`string`

The middleware provider type identifier

##### provider

[`MiddlewareProvider`](../interfaces/MiddlewareProvider.md)

The provider implementation to register

#### Returns

`void`
