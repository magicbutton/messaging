[**Magic Button Messaging v1.1.3**](../README.md)

***

# Class: MockTransport\<TEvents, TRequests\>

MockTransport for testing messaging without a real transport
Captures events and requests for inspection in tests

## Type Parameters

### TEvents

`TEvents` *extends* `Record`\<`string`, `any`\> = \{ \}

### TRequests

`TRequests` *extends* `Record`\<`string`, `any`\> = \{ \}

## Implements

- [`Transport`](../type-aliases/Transport.md)\<`any`\>

## Constructors

### Constructor

> **new MockTransport**\<`TEvents`, `TRequests`\>(`options`): `MockTransport`\<`TEvents`, `TRequests`\>

#### Parameters

##### options

[`MockTransportOptions`](../interfaces/MockTransportOptions.md) = `{}`

#### Returns

`MockTransport`\<`TEvents`, `TRequests`\>

## Methods

### clearHistory()

> **clearHistory**(): `void`

Clear all history

#### Returns

`void`

***

### connect()

> **connect**(`connectionString`): `Promise`\<`void`\>

Connect to the mock transport

#### Parameters

##### connectionString

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`Transport.connect`

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Disconnect from the mock transport

#### Returns

`Promise`\<`void`\>

#### Implementation of

`Transport.disconnect`

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

##### payload

`any`

##### context

[`IMessageContext`](../interfaces/IMessageContext.md) = `{}`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`Transport.emit`

***

### getConnectionString()

> **getConnectionString**(): `string`

Get the connection string

#### Returns

`string`

#### Implementation of

`Transport.getConnectionString`

***

### getEventHistory()

> **getEventHistory**\<`T`\>(`eventType?`): `object`[]

Get event history for assertions

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### eventType?

`string`

#### Returns

`object`[]

***

### getRequestHistory()

> **getRequestHistory**\<`TReq`, `TRes`\>(`requestType?`): `object`[]

Get request history for assertions

#### Type Parameters

##### TReq

`TReq` = `any`

##### TRes

`TRes` = `any`

#### Parameters

##### requestType?

`string`

#### Returns

`object`[]

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

##### handler

(`payload`, `context`) => `Promise`\<`any`\>

#### Returns

`void`

#### Implementation of

`Transport.handleRequest`

***

### isConnected()

> **isConnected**(): `boolean`

Check if connected

#### Returns

`boolean`

#### Implementation of

`Transport.isConnected`

***

### login()

> **login**(`credentials`): `Promise`\<`any`\>

Login to the mock transport (always succeeds)

#### Parameters

##### credentials

\{ `password`: `string`; `username`: `string`; \} | \{ `token`: `string`; \}

#### Returns

`Promise`\<`any`\>

#### Implementation of

`Transport.login`

***

### logout()

> **logout**(): `Promise`\<`void`\>

Logout from the mock transport

#### Returns

`Promise`\<`void`\>

#### Implementation of

`Transport.logout`

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

##### handler

(`payload`, `context`) => `void`

#### Returns

`void`

#### Implementation of

`Transport.off`

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

##### handler

(`payload`, `context`) => `void`

##### subscriptionContext?

[`IMessageContext`](../interfaces/IMessageContext.md)

#### Returns

`void`

#### Implementation of

`Transport.on`

***

### onEvent()

> **onEvent**\<`T`\>(`callback`): () => `void`

Register a callback to capture events for testing

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### callback

[`EventCaptureCallback`](../type-aliases/EventCaptureCallback.md)\<`T`\>

#### Returns

> (): `void`

##### Returns

`void`

***

### onRequest()

> **onRequest**\<`TReq`, `TRes`\>(`callback`): () => `void`

Register a callback to capture requests for testing

#### Type Parameters

##### TReq

`TReq` = `any`

##### TRes

`TRes` = `any`

#### Parameters

##### callback

[`RequestCaptureCallback`](../type-aliases/RequestCaptureCallback.md)\<`TReq`, `TRes`\>

#### Returns

> (): `void`

##### Returns

`void`

***

### request()

> **request**\<`R`\>(`requestType`, `payload`, `context`): `Promise`\<`any`\>

Send a request

#### Type Parameters

##### R

`R` *extends* `string`

#### Parameters

##### requestType

`R`

##### payload

`any`

##### context

[`IMessageContext`](../interfaces/IMessageContext.md) = `{}`

#### Returns

`Promise`\<`any`\>

#### Implementation of

`Transport.request`
