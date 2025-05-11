[**Magic Button Messaging v1.1.2**](../README.md)

***

# Interface: TestMessagingOptions

Options for creating a test messaging environment

## Properties

### clientOptions?

> `optional` **clientOptions**: `object`

Client options

#### autoConnect?

> `optional` **autoConnect**: `boolean`

Whether to auto-connect the client (defaults to true)

#### capabilities?

> `optional` **capabilities**: `string`[]

Client capabilities

#### clientId?

> `optional` **clientId**: `string`

Client ID (defaults to "test-client")

#### clientType?

> `optional` **clientType**: `string`

Client type (defaults to "test")

***

### serverOptions?

> `optional` **serverOptions**: `object`

Server options

#### autoStart?

> `optional` **autoStart**: `boolean`

Whether to auto-start the server (defaults to true)

#### capabilities?

> `optional` **capabilities**: `string`[]

Server capabilities

#### connectionString?

> `optional` **connectionString**: `string`

Connection string to use (defaults to "memory://test-messaging")

#### serverId?

> `optional` **serverId**: `string`

Server ID (defaults to "test-server")

***

### transport?

> `optional` **transport**: [`Transport`](../type-aliases/Transport.md)\<`any`\>

Transport to use (defaults to MockTransport)
