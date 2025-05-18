[**Magic Button Messaging v1.2.0**](../README.md)

***

# Class: DefaultMiddlewareProvider

Default implementation of middleware provider

## Implements

- [`MiddlewareProvider`](../interfaces/MiddlewareProvider.md)

## Constructors

### Constructor

> **new DefaultMiddlewareProvider**(): `DefaultMiddlewareProvider`

#### Returns

`DefaultMiddlewareProvider`

## Methods

### clear()

> **clear**(): `void`

Clear all registered middleware (primarily for testing)

#### Returns

`void`

***

### getEventMiddleware()

> **getEventMiddleware**(`name`): `null` \| [`EventMiddleware`](../type-aliases/EventMiddleware.md)

Get an event middleware by name

#### Parameters

##### name

`string`

The middleware name

#### Returns

`null` \| [`EventMiddleware`](../type-aliases/EventMiddleware.md)

#### Implementation of

[`MiddlewareProvider`](../interfaces/MiddlewareProvider.md).[`getEventMiddleware`](../interfaces/MiddlewareProvider.md#geteventmiddleware)

***

### getRequestMiddleware()

> **getRequestMiddleware**(`name`): `null` \| [`RequestMiddleware`](../type-aliases/RequestMiddleware.md)

Get a request middleware by name

#### Parameters

##### name

`string`

The middleware name

#### Returns

`null` \| [`RequestMiddleware`](../type-aliases/RequestMiddleware.md)

#### Implementation of

[`MiddlewareProvider`](../interfaces/MiddlewareProvider.md).[`getRequestMiddleware`](../interfaces/MiddlewareProvider.md#getrequestmiddleware)

***

### registerEventMiddleware()

> **registerEventMiddleware**(`name`, `middleware`): `void`

Register a named event middleware

#### Parameters

##### name

`string`

The middleware name

##### middleware

[`EventMiddleware`](../type-aliases/EventMiddleware.md)

The middleware function

#### Returns

`void`

***

### registerRequestMiddleware()

> **registerRequestMiddleware**(`name`, `middleware`): `void`

Register a named request middleware

#### Parameters

##### name

`string`

The middleware name

##### middleware

[`RequestMiddleware`](../type-aliases/RequestMiddleware.md)

The middleware function

#### Returns

`void`
