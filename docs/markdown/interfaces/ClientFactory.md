[**Magic Button Messaging v1.2.0**](../README.md)

***

# Interface: ClientFactory\<TContract\>

Factory interface for creating messaging client instances

The factory pattern abstracts client creation, allowing different client
implementations to be created with consistent interfaces. This enables
dependency injection and testability.

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

## Methods

### createClient()

> **createClient**(`config`): [`MessagingClient`](../classes/MessagingClient.md)\<`TContract`\>

Create a new client instance with the provided configuration

#### Parameters

##### config

[`ClientConfig`](ClientConfig.md)\<`TContract`\>

The client configuration parameters

#### Returns

[`MessagingClient`](../classes/MessagingClient.md)\<`TContract`\>

A configured client instance
