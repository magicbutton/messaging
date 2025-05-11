[**Magic Button Messaging v1.1.1**](../README.md)

***

# Interface: MiddlewareProvider

Provider interface for supplying named middleware instances

This provider pattern enables middleware to be registered by name
and retrieved by the factory system, allowing for pluggable
middleware components without tight coupling.

## Methods

### getEventMiddleware()

> **getEventMiddleware**(`name`): `null` \| [`EventMiddleware`](../type-aliases/EventMiddleware.md)

Get a named event middleware instance

#### Parameters

##### name

`string`

The registered middleware name

#### Returns

`null` \| [`EventMiddleware`](../type-aliases/EventMiddleware.md)

The middleware function or null if not found

***

### getRequestMiddleware()

> **getRequestMiddleware**(`name`): `null` \| [`RequestMiddleware`](../type-aliases/RequestMiddleware.md)

Get a named request middleware instance

#### Parameters

##### name

`string`

The registered middleware name

#### Returns

`null` \| [`RequestMiddleware`](../type-aliases/RequestMiddleware.md)

The middleware function or null if not found
