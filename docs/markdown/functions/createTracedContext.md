[**Magic Button Messaging v1.1.3**](../README.md)

***

# Function: createTracedContext()

> **createTracedContext**(`context`, `spanName`): [`IMessageContext`](../interfaces/IMessageContext.md)

Create message context with tracing information

## Parameters

### context

`Partial`\<[`IMessageContext`](../interfaces/IMessageContext.md)\> = `{}`

Existing context to extend

### spanName

`string`

Name for the span

## Returns

[`IMessageContext`](../interfaces/IMessageContext.md)

Augmented message context with tracing info
