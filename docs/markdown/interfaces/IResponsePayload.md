[**Magic Button Messaging v1.1.3**](../README.md)

***

# Interface: IResponsePayload\<T\>

Response payload structure for server-client responses

## Type Parameters

### T

`T` = `any`

## Properties

### context?

> `optional` **context**: [`IMessageContext`](IMessageContext.md)

***

### data?

> `optional` **data**: `T`

***

### error?

> `optional` **error**: `object`

#### code

> **code**: `string`

#### details?

> `optional` **details**: `any`

#### message

> **message**: `string`

***

### success

> **success**: `boolean`
