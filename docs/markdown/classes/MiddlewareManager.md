[**Magic Button Messaging v1.2.0**](../README.md)

***

# Class: MiddlewareManager

Middleware manager for handling multiple middleware functions

## Constructors

### Constructor

> **new MiddlewareManager**(): `MiddlewareManager`

#### Returns

`MiddlewareManager`

## Methods

### processEvent()

> **processEvent**\<`T`\>(`event`): `Promise`\<`void`\>

Process an event through the middleware chain

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### event

[`EventPayload`](../type-aliases/EventPayload.md)\<`T`\>

Event payload

#### Returns

`Promise`\<`void`\>

Promise resolved when processing is complete

***

### processRequest()

> **processRequest**\<`TReq`, `TRes`\>(`request`): `Promise`\<[`ResponsePayload`](../type-aliases/ResponsePayload.md)\<`TRes`\>\>

Process a request through the middleware chain

#### Type Parameters

##### TReq

`TReq` = `any`

##### TRes

`TRes` = `any`

#### Parameters

##### request

[`RequestPayload`](../type-aliases/RequestPayload.md)\<`TReq`\>

Request payload

#### Returns

`Promise`\<[`ResponsePayload`](../type-aliases/ResponsePayload.md)\<`TRes`\>\>

Promise with response payload

***

### useEventMiddleware()

> **useEventMiddleware**\<`T`\>(`eventType`, `middleware`): `this`

Add middleware for a specific event type

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### eventType

`string`

Event type

##### middleware

[`EventMiddleware`](../type-aliases/EventMiddleware.md)\<`T`\>

Middleware function

#### Returns

`this`

MiddlewareManager instance for chaining

***

### useGlobalEventMiddleware()

> **useGlobalEventMiddleware**\<`T`\>(`middleware`): `this`

Add global middleware for all events

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### middleware

[`EventMiddleware`](../type-aliases/EventMiddleware.md)\<`T`\>

Middleware function

#### Returns

`this`

MiddlewareManager instance for chaining

***

### useGlobalRequestMiddleware()

> **useGlobalRequestMiddleware**\<`TReq`, `TRes`\>(`middleware`): `this`

Add global middleware for all requests

#### Type Parameters

##### TReq

`TReq` = `any`

##### TRes

`TRes` = `any`

#### Parameters

##### middleware

[`RequestMiddleware`](../type-aliases/RequestMiddleware.md)\<`TReq`, `TRes`\>

Middleware function

#### Returns

`this`

MiddlewareManager instance for chaining

***

### useRequestMiddleware()

> **useRequestMiddleware**\<`TReq`, `TRes`\>(`requestType`, `middleware`): `this`

Add middleware for a specific request type

#### Type Parameters

##### TReq

`TReq` = `any`

##### TRes

`TRes` = `any`

#### Parameters

##### requestType

`string`

Request type

##### middleware

[`RequestMiddleware`](../type-aliases/RequestMiddleware.md)\<`TReq`, `TRes`\>

Middleware function

#### Returns

`this`

MiddlewareManager instance for chaining
