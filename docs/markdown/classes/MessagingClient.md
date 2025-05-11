[**Magic Button Messaging v1.1.2**](../README.md)

***

# Class: MessagingClient\<TContract\>

Generic messaging client that works with any contract and transport through dependency injection

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

## Constructors

### Constructor

> **new MessagingClient**\<`TContract`\>(`transport`, `options`): `MessagingClient`\<`TContract`\>

Creates a new messaging client instance with dependency injection

#### Parameters

##### transport

[`Transport`](../type-aliases/Transport.md)\<`TContract`\>

The transport implementation to use for communication

##### options

[`IClientOptions`](../interfaces/IClientOptions.md) = `{}`

Configuration options for the client

#### Returns

`MessagingClient`\<`TContract`\>

## Methods

### connect()

> **connect**(`connectionString`): `Promise`\<`void`\>

Connects the client to a messaging server using the provided connection string.

#### Parameters

##### connectionString

`string`

#### Returns

`Promise`\<`void`\>

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Disconnect from the server

#### Returns

`Promise`\<`void`\>

***

### emit()

> **emit**\<`E`\>(`event`, `payload`, `context?`): `Promise`\<`void`\>

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

##### context?

[`IMessageContext`](../interfaces/IMessageContext.md)

Optional message context

#### Returns

`Promise`\<`void`\>

***

### getAuthProvider()

> **getAuthProvider**(): [`IAuthProvider`](../interfaces/IAuthProvider.md)

Get the authentication provider

#### Returns

[`IAuthProvider`](../interfaces/IAuthProvider.md)

***

### getClientId()

> **getClientId**(): `string`

Get the client ID

#### Returns

`string`

***

### getConnectionId()

> **getConnectionId**(): `null` \| `string`

Get the connection ID

#### Returns

`null` \| `string`

***

### getServerId()

> **getServerId**(): `null` \| `string`

Get the server ID

#### Returns

`null` \| `string`

***

### getServerInfo()

> **getServerInfo**(): `Promise`\<`any`\>

Get server information

#### Returns

`Promise`\<`any`\>

***

### getStatus()

> **getStatus**(): [`ClientStatus`](../enumerations/ClientStatus.md)

Get the client status

#### Returns

[`ClientStatus`](../enumerations/ClientStatus.md)

***

### isConnected()

> **isConnected**(): `boolean`

Check if the client is connected

#### Returns

`boolean`

***

### login()

> **login**(`credentials`): `Promise`\<[`IAuthResult`](../interfaces/IAuthResult.md)\>

Login to the server

#### Parameters

##### credentials

The login credentials

\{ `password`: `string`; `username`: `string`; \} | \{ `token`: `string`; \}

#### Returns

`Promise`\<[`IAuthResult`](../interfaces/IAuthResult.md)\>

***

### logout()

> **logout**(): `Promise`\<`void`\>

Logout from the server

#### Returns

`Promise`\<`void`\>

***

### on()

> **on**\<`E`\>(`event`, `handler`, `context?`): `void`

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

##### context?

[`IMessageContext`](../interfaces/IMessageContext.md)

Optional subscription context

#### Returns

`void`

***

### onError()

> **onError**(`listener`): () => `void`

Register an error listener

#### Parameters

##### listener

(`error`) => `void`

The error listener

#### Returns

> (): `void`

##### Returns

`void`

***

### onStatusChange()

> **onStatusChange**(`listener`): () => `void`

Register a status change listener

#### Parameters

##### listener

(`status`) => `void`

The status listener

#### Returns

> (): `void`

##### Returns

`void`

***

### ping()

> **ping**(`payload?`): `Promise`\<\{ `roundTripTime`: `number`; \}\>

Ping the server

#### Parameters

##### payload?

`string`

Optional payload to include in the ping

#### Returns

`Promise`\<\{ `roundTripTime`: `number`; \}\>

***

### request()

> **request**\<`R`\>(`requestType`, `payload`, `context?`): `Promise`\<[`InferResponseData`](../type-aliases/InferResponseData.md)\<`TContract`\[`"requests"`\], `R`\>\>

Send a request to the server

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

##### context?

[`IMessageContext`](../interfaces/IMessageContext.md)

Optional message context

#### Returns

`Promise`\<[`InferResponseData`](../type-aliases/InferResponseData.md)\<`TContract`\[`"requests"`\], `R`\>\>

***

### subscribe()

> **subscribe**(`events`, `filter?`): `Promise`\<`string`\>

Subscribe to events

#### Parameters

##### events

`string`[]

The events to subscribe to

##### filter?

`Record`\<`string`, `unknown`\>

Optional filter for the events

#### Returns

`Promise`\<`string`\>

***

### unsubscribe()

> **unsubscribe**(`subscriptionId`): `Promise`\<`void`\>

Unsubscribe from events

#### Parameters

##### subscriptionId

`string`

The subscription ID to unsubscribe

#### Returns

`Promise`\<`void`\>
