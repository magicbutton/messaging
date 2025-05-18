[**Magic Button Messaging v1.2.0**](../README.md)

***

# Class: InMemoryTransportFactory\<TContract\>

In-memory transport factory for creating in-memory transports

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

## Implements

- [`TransportFactory`](../interfaces/TransportFactory.md)\<`TContract`\>

## Constructors

### Constructor

> **new InMemoryTransportFactory**\<`TContract`\>(): `InMemoryTransportFactory`\<`TContract`\>

#### Returns

`InMemoryTransportFactory`\<`TContract`\>

## Methods

### createTransport()

> **createTransport**(`config`): [`InMemoryTransport`](InMemoryTransport.md)\<`TContract`\>

Create an in-memory transport instance

#### Parameters

##### config

[`TransportConfig`](../interfaces/TransportConfig.md)

The transport configuration

#### Returns

[`InMemoryTransport`](InMemoryTransport.md)\<`TContract`\>

#### Implementation of

[`TransportFactory`](../interfaces/TransportFactory.md).[`createTransport`](../interfaces/TransportFactory.md#createtransport)
