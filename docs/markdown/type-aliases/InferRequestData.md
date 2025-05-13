[**Magic Button Messaging v1.1.3**](../README.md)

***

# Type Alias: InferRequestData\<TRequests, TRequest\>

> **InferRequestData**\<`TRequests`, `TRequest`\> = `z.infer`\<[`RequestSchemaType`](RequestSchemaType.md)\<`TRequests`\[`TRequest`\]\>\>

Infer request data type from a request schema

## Type Parameters

### TRequests

`TRequests` *extends* [`RequestSchemas`](RequestSchemas.md)

### TRequest

`TRequest` *extends* keyof `TRequests` & `string`
