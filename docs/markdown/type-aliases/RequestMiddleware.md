[**Magic Button Messaging v1.1.1**](../README.md)

***

# Type Alias: RequestMiddleware()\<TReq, TRes\>

> **RequestMiddleware**\<`TReq`, `TRes`\> = (`request`, `next`) => `Promise`\<[`ResponsePayload`](ResponsePayload.md)\<`TRes`\>\>

Middleware function type for requests

## Type Parameters

### TReq

`TReq` = `any`

### TRes

`TRes` = `any`

## Parameters

### request

[`RequestPayload`](RequestPayload.md)\<`TReq`\>

### next

(`request`) => `Promise`\<[`ResponsePayload`](ResponsePayload.md)\<`TRes`\>\>

## Returns

`Promise`\<[`ResponsePayload`](ResponsePayload.md)\<`TRes`\>\>
