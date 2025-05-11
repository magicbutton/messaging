[**Magic Button Messaging v1.1.2**](../README.md)

***

# Function: retry()

> **retry**\<`T`\>(`fn`, `options`): `Promise`\<`T`\>

Retry function that handles retryable errors

## Type Parameters

### T

`T`

## Parameters

### fn

() => `Promise`\<`T`\>

The function to retry

### options

Retry options

#### maxRetries?

`number`

#### onRetry?

(`error`, `attempt`) => `void`

#### retryDelay?

`number`

#### retryMultiplier?

`number`

#### shouldRetry?

(`error`) => `boolean`

## Returns

`Promise`\<`T`\>
