[**Magic Button Messaging v1.1.1**](../README.md)

***

# Interface: ServerFactory\<TContract\>

Server factory interface for creating messaging servers

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

## Methods

### createServer()

> **createServer**(`config`): [`MessagingServer`](../classes/MessagingServer.md)\<`TContract`\>

Create a server instance

#### Parameters

##### config

[`ServerConfig`](ServerConfig.md)\<`TContract`\>

The server configuration

#### Returns

[`MessagingServer`](../classes/MessagingServer.md)\<`TContract`\>
