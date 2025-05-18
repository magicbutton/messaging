[**Magic Button Messaging v1.2.0**](../README.md)

***

# Type Alias: RequestCaptureCallback()\<TReq, TRes\>

> **RequestCaptureCallback**\<`TReq`, `TRes`\> = (`requestType`, `payload`, `response`, `context`) => `void`

Request capture callback function

## Type Parameters

### TReq

`TReq` = `any`

### TRes

`TRes` = `any`

## Parameters

### requestType

`string`

### payload

`TReq`

### response

[`ResponsePayload`](ResponsePayload.md)\<`TRes`\>

### context

[`MessageContext`](MessageContext.md)

## Returns

`void`
