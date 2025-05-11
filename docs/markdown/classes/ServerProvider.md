[**Magic Button Messaging v1.1.2**](../README.md)

***

# Class: ServerProvider

Server provider for centralized dependency injection of servers

## Constructors

### Constructor

> **new ServerProvider**(): `ServerProvider`

#### Returns

`ServerProvider`

## Methods

### clearFactories()

> `static` **clearFactories**(): `void`

Clear all registered factories (primarily for testing)

#### Returns

`void`

***

### createServer()

> `static` **createServer**\<`TContract`\>(`type`, `config`): [`MessagingServer`](MessagingServer.md)\<`TContract`\>

Create a server instance with the specified configuration

#### Type Parameters

##### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

#### Parameters

##### type

`string`

The server type identifier

##### config

[`ServerConfig`](../interfaces/ServerConfig.md)\<`TContract`\>

The server configuration

#### Returns

[`MessagingServer`](MessagingServer.md)\<`TContract`\>

A typed server instance

***

### hasFactory()

> `static` **hasFactory**(`type`): `boolean`

Check if a server type is registered

#### Parameters

##### type

`string`

The server type to check

#### Returns

`boolean`

***

### registerFactory()

> `static` **registerFactory**\<`TContract`\>(`type`, `factory`): `void`

Register a server factory

#### Type Parameters

##### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

#### Parameters

##### type

`string`

The server type identifier

##### factory

[`ServerFactory`](../interfaces/ServerFactory.md)\<`TContract`\>

The factory implementation

#### Returns

`void`
