[**Magic Button Messaging v1.2.0**](../README.md)

***

# Function: createAuthenticationMiddleware()

> **createAuthenticationMiddleware**(`authCheck`, `options`): [`RequestMiddleware`](../type-aliases/RequestMiddleware.md)

Create an authentication middleware for requests

## Parameters

### authCheck

(`context`) => `boolean` \| `Promise`\<`boolean`\>

Function to check if the request is authenticated

### options

Options for the middleware

#### exclude?

`string`[]

## Returns

[`RequestMiddleware`](../type-aliases/RequestMiddleware.md)

Request middleware function
