[**Magic Button Messaging v1.1.1**](../README.md)

***

# Class: InMemoryTransport\<TContract\>

In-memory transport adapter for testing

## Extends

- [`BaseTransport`](BaseTransport.md)\<`TContract`\>

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

## Constructors

### Constructor

> **new InMemoryTransport**\<`TContract`\>(): `InMemoryTransport`\<`TContract`\>

#### Returns

`InMemoryTransport`\<`TContract`\>

#### Overrides

[`BaseTransport`](BaseTransport.md).[`constructor`](BaseTransport.md#constructor)

## Properties

### connected

> `protected` **connected**: `boolean` = `false`

#### Inherited from

[`BaseTransport`](BaseTransport.md).[`connected`](BaseTransport.md#connected)

***

### connectionString

> `protected` **connectionString**: `string` = `""`

#### Inherited from

[`BaseTransport`](BaseTransport.md).[`connectionString`](BaseTransport.md#connectionstring)

## Methods

### connect()

> **connect**(`connectionString`): `Promise`\<`void`\>

Connect to the transport

#### Parameters

##### connectionString

`string`

The connection string

#### Returns

`Promise`\<`void`\>

#### Overrides

[`BaseTransport`](BaseTransport.md).[`connect`](BaseTransport.md#connect)

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Disconnect from the transport

#### Returns

`Promise`\<`void`\>

#### Overrides

[`BaseTransport`](BaseTransport.md).[`disconnect`](BaseTransport.md#disconnect)

***

### emit()

> **emit**\<`E`\>(`event`, `payload`, `context`): `Promise`\<`void`\>

Emit an event

#### Type Parameters

##### E

`E` *extends* `string`

#### Parameters

##### event

`E`

The event type

##### payload

[`InferEventData`](../type-aliases/InferEventData.md)\<`TContract`\[`"events"`\], `E`\>

The event payload

##### context

[`IMessageContext`](../interfaces/IMessageContext.md) = `{}`

The message context

#### Returns

`Promise`\<`void`\>

#### Overrides

[`BaseTransport`](BaseTransport.md).[`emit`](BaseTransport.md#emit)

***

### getConnectionString()

> **getConnectionString**(): `string`

Get the current connection string

#### Returns

`string`

#### Inherited from

[`BaseTransport`](BaseTransport.md).[`getConnectionString`](BaseTransport.md#getconnectionstring)

***

### handleRequest()

> **handleRequest**\<`R`\>(`requestType`, `handler`): `void`

Register a request handler

#### Type Parameters

##### R

`R` *extends* `string`

#### Parameters

##### requestType

`R`

The request type

##### handler

(`payload`, `context`) => `Promise`\<[`InferResponseData`](../type-aliases/InferResponseData.md)\<`TContract`\[`"requests"`\], `R`\>\>

The request handler

#### Returns

`void`

#### Overrides

[`BaseTransport`](BaseTransport.md).[`handleRequest`](BaseTransport.md#handlerequest)

***

### isConnected()

> **isConnected**(): `boolean`

Check if the transport is connected

#### Returns

`boolean`

#### Inherited from

[`BaseTransport`](BaseTransport.md).[`isConnected`](BaseTransport.md#isconnected)

***

### login()

> **login**(`credentials`): `Promise`\<[`IAuthResult`](../interfaces/IAuthResult.md)\>

Login to the transport

#### Parameters

##### credentials

The login credentials

\{ `password`: `string`; `username`: `string`; \} | \{ `token`: `string`; \}

#### Returns

`Promise`\<[`IAuthResult`](../interfaces/IAuthResult.md)\>

#### Overrides

[`BaseTransport`](BaseTransport.md).[`login`](BaseTransport.md#login)

***

### logout()

> **logout**(): `Promise`\<`void`\>

Logout from the transport

#### Returns

`Promise`\<`void`\>

#### Overrides

[`BaseTransport`](BaseTransport.md).[`logout`](BaseTransport.md#logout)

***

### off()

> **off**\<`E`\>(`event`, `handler`): `void`

Unregister an event handler

#### Type Parameters

##### E

`E` *extends* `string`

#### Parameters

##### event

`E`

The event type

##### handler

(`payload`, `context`) => `void`

The event handler

#### Returns

`void`

#### Overrides

[`BaseTransport`](BaseTransport.md).[`off`](BaseTransport.md#off)

***

### on()

> **on**\<`E`\>(`event`, `handler`, `subscriptionContext?`): `void`

Register an event handler

#### Type Parameters

##### E

`E` *extends* `string`

#### Parameters

##### event

`E`

The event type

##### handler

(`payload`, `context`) => `void`

The event handler

##### subscriptionContext?

[`IMessageContext`](../interfaces/IMessageContext.md)

#### Returns

`void`

#### Overrides

[`BaseTransport`](BaseTransport.md).[`on`](BaseTransport.md#on)

***

### request()

> **request**\<`R`\>(`requestType`, `payload`, `context`): `Promise`\<[`InferResponseData`](../type-aliases/InferResponseData.md)\<`TContract`\[`"requests"`\], `R`\>\>

Send a request

#### Type Parameters

##### R

`R` *extends* `string`

#### Parameters

##### requestType

`R`

The request type

##### payload

[`InferRequestData`](../type-aliases/InferRequestData.md)\<`TContract`\[`"requests"`\], `R`\>

The request payload

##### context

[`IMessageContext`](../interfaces/IMessageContext.md) = `{}`

The message context

#### Returns

`Promise`\<[`InferResponseData`](../type-aliases/InferResponseData.md)\<`TContract`\[`"requests"`\], `R`\>\>

#### Overrides

[`BaseTransport`](BaseTransport.md).[`request`](BaseTransport.md#request)
