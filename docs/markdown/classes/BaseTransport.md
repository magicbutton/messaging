[**Magic Button Messaging v1.1.2**](../README.md)

***

# Class: `abstract` BaseTransport\<TContract\>

Base abstract class for creating custom transport implementations

This class provides a foundation for transport implementations in the
factory pattern. Custom transports should extend this class and be
created through a TransportFactory implementation.

## Extended by

- [`InMemoryTransport`](InMemoryTransport.md)

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

## Implements

- [`Transport`](../type-aliases/Transport.md)\<`TContract`\>

## Constructors

### Constructor

> **new BaseTransport**\<`TContract`\>(): `BaseTransport`\<`TContract`\>

#### Returns

`BaseTransport`\<`TContract`\>

## Properties

### connected

> `protected` **connected**: `boolean` = `false`

***

### connectionString

> `protected` **connectionString**: `string` = `""`

## Methods

### connect()

> `abstract` **connect**(`connectionString`): `Promise`\<`void`\>

Connect to the transport

#### Parameters

##### connectionString

`string`

The connection string to connect to

#### Returns

`Promise`\<`void`\>

#### Implementation of

`Transport.connect`

***

### disconnect()

> `abstract` **disconnect**(): `Promise`\<`void`\>

Disconnect from the transport

#### Returns

`Promise`\<`void`\>

#### Implementation of

`Transport.disconnect`

***

### emit()

> `abstract` **emit**\<`E`\>(`event`, `payload`, `context?`): `Promise`\<`void`\>

Emit an event

#### Type Parameters

##### E

`E` *extends* `string`

#### Parameters

##### event

`E`

The event type

##### payload

`any`

The event payload

##### context?

[`IMessageContext`](../interfaces/IMessageContext.md)

Optional message context

#### Returns

`Promise`\<`void`\>

#### Implementation of

`Transport.emit`

***

### getConnectionString()

> **getConnectionString**(): `string`

Get the current connection string

#### Returns

`string`

#### Implementation of

`Transport.getConnectionString`

***

### handleRequest()

> `abstract` **handleRequest**\<`R`\>(`requestType`, `handler`): `void`

Register a request handler

#### Type Parameters

##### R

`R` *extends* `string`

#### Parameters

##### requestType

`R`

The request type

##### handler

(`payload`, `context`) => `Promise`\<`any`\>

The request handler

#### Returns

`void`

#### Implementation of

`Transport.handleRequest`

***

### isConnected()

> **isConnected**(): `boolean`

Check if the transport is connected

#### Returns

`boolean`

#### Implementation of

`Transport.isConnected`

***

### login()

> `abstract` **login**(`credentials`): `Promise`\<[`IAuthResult`](../interfaces/IAuthResult.md)\>

Login to the server

#### Parameters

##### credentials

The login credentials

\{ `password`: `string`; `username`: `string`; \} | \{ `token`: `string`; \}

#### Returns

`Promise`\<[`IAuthResult`](../interfaces/IAuthResult.md)\>

#### Implementation of

`Transport.login`

***

### logout()

> `abstract` **logout**(): `Promise`\<`void`\>

Logout from the server

#### Returns

`Promise`\<`void`\>

#### Implementation of

`Transport.logout`

***

### off()

> `abstract` **off**\<`E`\>(`event`, `handler`): `void`

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

#### Implementation of

`Transport.off`

***

### on()

> `abstract` **on**\<`E`\>(`event`, `handler`, `subscriptionContext?`): `void`

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

Optional subscription context

#### Returns

`void`

#### Implementation of

`Transport.on`

***

### request()

> `abstract` **request**\<`R`\>(`requestType`, `payload`, `context?`): `Promise`\<`any`\>

Send a request to the server

#### Type Parameters

##### R

`R` *extends* `string`

#### Parameters

##### requestType

`R`

The request type

##### payload

`any`

The request payload

##### context?

[`IMessageContext`](../interfaces/IMessageContext.md)

Optional message context

#### Returns

`Promise`\<`any`\>

#### Implementation of

`Transport.request`
