[**Magic Button Messaging v1.1.1**](../README.md)

***

# Class: TransportProvider

Transport provider for centralized dependency injection of transports

## Constructors

### Constructor

> **new TransportProvider**(): `TransportProvider`

#### Returns

`TransportProvider`

## Methods

### clearFactories()

> `static` **clearFactories**(): `void`

Clear all registered factories (primarily for testing)

#### Returns

`void`

***

### createTransport()

> `static` **createTransport**\<`TContract`\>(`config`): [`Transport`](../type-aliases/Transport.md)\<`TContract`\>

Create a transport instance with the specified configuration

#### Type Parameters

##### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

#### Parameters

##### config

[`TransportConfig`](../interfaces/TransportConfig.md)

The transport configuration

#### Returns

[`Transport`](../type-aliases/Transport.md)\<`TContract`\>

A typed transport instance

***

### hasFactory()

> `static` **hasFactory**(`type`): `boolean`

Check if a transport type is registered

#### Parameters

##### type

`string`

The transport type to check

#### Returns

`boolean`

***

### registerFactory()

> `static` **registerFactory**\<`TContract`\>(`type`, `factory`): `void`

Register a transport factory

#### Type Parameters

##### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

#### Parameters

##### type

`string`

The transport type identifier

##### factory

[`TransportFactory`](../interfaces/TransportFactory.md)\<`TContract`\>

The factory implementation

#### Returns

`void`
