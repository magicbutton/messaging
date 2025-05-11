[**Magic Button Messaging v1.1.1**](../README.md)

***

# Class: MessagingServer\<TContract\>

Generic messaging server that works with any contract and transport through dependency injection

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

## Constructors

### Constructor

> **new MessagingServer**\<`TContract`\>(`transport`, `contract`, `options`): `MessagingServer`\<`TContract`\>

Creates a new messaging server instance with dependency injection

#### Parameters

##### transport

[`Transport`](../type-aliases/Transport.md)\<`TContract`\>

The transport implementation to use for communication

##### contract

`TContract`

The contract definition to use for authorization

##### options

[`IServerOptions`](../interfaces/IServerOptions.md) = `{}`

Configuration options for the server

#### Returns

`MessagingServer`\<`TContract`\>

## Accessors

### transportAdapter

#### Get Signature

> **get** **transportAdapter**(): [`Transport`](../type-aliases/Transport.md)\<`TContract`\>

Get access to the transport for use by methods in the example

##### Returns

[`Transport`](../type-aliases/Transport.md)\<`TContract`\>

## Methods

### broadcast()

> **broadcast**(`message`, `data?`): `Promise`\<`void`\>

Broadcast a message to all clients

#### Parameters

##### message

`string`

The message to broadcast

##### data?

`any`

Optional data to include

#### Returns

`Promise`\<`void`\>

***

### getAuthorizationProvider()

> **getAuthorizationProvider**(): [`AuthorizationProvider`](../type-aliases/AuthorizationProvider.md)\<`TContract`\>

Get the authorization provider

#### Returns

[`AuthorizationProvider`](../type-aliases/AuthorizationProvider.md)\<`TContract`\>

***

### getAuthProvider()

> **getAuthProvider**(): [`IAuthProvider`](../interfaces/IAuthProvider.md)

Get the authentication provider

#### Returns

[`IAuthProvider`](../interfaces/IAuthProvider.md)

***

### getClient()

> **getClient**(`clientId`): `undefined` \| `ClientConnection`

Get a specific client

#### Parameters

##### clientId

`string`

The client ID to get

#### Returns

`undefined` \| `ClientConnection`

***

### getClientCount()

> **getClientCount**(): `number`

Get the number of connected clients

#### Returns

`number`

***

### getClients()

> **getClients**(): `ClientConnection`[]

Get all connected clients

#### Returns

`ClientConnection`[]

***

### getServerInfo()

> **getServerInfo**(): `object`

Get server information

#### Returns

`object`

##### capabilities

> **capabilities**: `string`[]

##### connectedClients

> **connectedClients**: `number`

##### serverId

> **serverId**: `string`

##### uptime

> **uptime**: `number`

##### version

> **version**: `string`

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

(`payload`, `context`, `clientId`) => `Promise`\<[`InferResponseData`](../type-aliases/InferResponseData.md)\<`TContract`\[`"requests"`\], `R`\>\>

The request handler

#### Returns

`void`

***

### sendToClient()

> **sendToClient**\<`E`\>(`clientId`, `event`, `payload`): `Promise`\<`void`\>

Send a message to a specific client

#### Type Parameters

##### E

`E` *extends* `string`

#### Parameters

##### clientId

`string`

The client ID to send to

##### event

`E`

The event type

##### payload

[`InferEventData`](../type-aliases/InferEventData.md)\<`TContract`\[`"events"`\], `E`\>

The event payload

#### Returns

`Promise`\<`void`\>

***

### start()

> **start**(`connectionString`): `Promise`\<`void`\>

Starts the server with the specified connection string.

#### Parameters

##### connectionString

`string`

#### Returns

`Promise`\<`void`\>

***

### stop()

> **stop**(): `Promise`\<`void`\>

Stop the server

#### Returns

`Promise`\<`void`\>
