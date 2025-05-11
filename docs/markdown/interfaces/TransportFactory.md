[**Magic Button Messaging v1.1.1**](../README.md)

***

# Interface: TransportFactory\<TContract\>

Transport factory interface for creating typed transports

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

## Methods

### createTransport()

> **createTransport**(`config`): [`Transport`](../type-aliases/Transport.md)\<`TContract`\>

Create a transport instance

#### Parameters

##### config

[`TransportConfig`](TransportConfig.md)

The transport configuration

#### Returns

[`Transport`](../type-aliases/Transport.md)\<`TContract`\>
