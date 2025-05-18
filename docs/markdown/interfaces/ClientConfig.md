[**Magic Button Messaging v1.2.0**](../README.md)

***

# Interface: ClientConfig\<TContract\>

Configuration interface for creating client instances through factory pattern

This defines the input parameters needed by client factories to create
properly configured client instances without exposing implementation details.

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

## Properties

### options?

> `optional` **options**: [`IClientOptions`](IClientOptions.md)

Optional client configuration options

***

### transport

> **transport**: [`Transport`](../type-aliases/Transport.md)\<`TContract`\>

Transport instance to use for client communication
Created by a TransportFactory
