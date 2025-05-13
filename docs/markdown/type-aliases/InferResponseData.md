[**Magic Button Messaging v1.1.3**](../README.md)

***

# Type Alias: InferResponseData\<TRequests, TRequest\>

> **InferResponseData**\<`TRequests`, `TRequest`\> = `z.infer`\<[`ResponseSchemaType`](ResponseSchemaType.md)\<`TRequests`\[`TRequest`\]\>\>

Infer response data type from a request schema

## Type Parameters

### TRequests

`TRequests` *extends* [`RequestSchemas`](RequestSchemas.md)

### TRequest

`TRequest` *extends* keyof `TRequests` & `string`
