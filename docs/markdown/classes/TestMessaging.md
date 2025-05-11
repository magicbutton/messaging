[**Magic Button Messaging v1.1.1**](../README.md)

***

# Class: TestMessaging\<TEvents, TRequests\>

Test messaging environment for testing clients and servers

## Type Parameters

### TEvents

`TEvents` *extends* `Record`\<`string`, `any`\> = \{ \}

### TRequests

`TRequests` *extends* `Record`\<`string`, `any`\> = \{ \}

## Constructors

### Constructor

> **new TestMessaging**\<`TEvents`, `TRequests`\>(`options`): `TestMessaging`\<`TEvents`, `TRequests`\>

#### Parameters

##### options

[`TestMessagingOptions`](../interfaces/TestMessagingOptions.md) = `{}`

#### Returns

`TestMessaging`\<`TEvents`, `TRequests`\>

## Properties

### client

> `readonly` **client**: [`MessagingClient`](MessagingClient.md)\<`any`\>

The client instance

***

### connectionString

> `readonly` **connectionString**: `string`

The connection string

***

### server

> `readonly` **server**: [`MessagingServer`](MessagingServer.md)\<`any`\>

The server instance

***

### transport

> `readonly` **transport**: [`Transport`](../type-aliases/Transport.md)\<`any`\>

The mock transport adapter

## Methods

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Clean up the test environment

#### Returns

`Promise`\<`void`\>

***

### getMockTransport()

> **getMockTransport**(): [`MockTransport`](MockTransport.md)\<`TEvents`, `TRequests`\>

Get the mock transport as the correct type

#### Returns

[`MockTransport`](MockTransport.md)\<`TEvents`, `TRequests`\>

***

### handleRequest()

> **handleRequest**\<`R`\>(`type`, `handler`): `void`

Register a request handler on the server with simplified API

#### Type Parameters

##### R

`R` *extends* `string`

#### Parameters

##### type

`R`

##### handler

(`data`, `clientId`) => `any`

#### Returns

`void`

***

### waitForEvent()

> **waitForEvent**\<`T`\>(`eventType`, `count`, `timeoutMs`): `Promise`\<`object`[]\>

Wait for events of a specific type to be emitted

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### eventType

`string`

##### count

`number` = `1`

##### timeoutMs

`number` = `5000`

#### Returns

`Promise`\<`object`[]\>

***

### waitForRequest()

> **waitForRequest**\<`TReq`, `TRes`\>(`requestType`, `count`, `timeoutMs`): `Promise`\<`object`[]\>

Wait for a specific request to be made

#### Type Parameters

##### TReq

`TReq` = `any`

##### TRes

`TRes` = `any`

#### Parameters

##### requestType

`string`

##### count

`number` = `1`

##### timeoutMs

`number` = `5000`

#### Returns

`Promise`\<`object`[]\>
