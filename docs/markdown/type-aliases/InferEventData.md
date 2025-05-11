[**Magic Button Messaging v1.1.2**](../README.md)

***

# Type Alias: InferEventData\<TEvents, TEvent\>

> **InferEventData**\<`TEvents`, `TEvent`\> = `z.infer`\<[`SchemaType`](SchemaType.md)\<`TEvents`\[`TEvent`\]\>\>

Infer event data type from an event schema

## Type Parameters

### TEvents

`TEvents` *extends* [`EventSchemas`](EventSchemas.md)

### TEvent

`TEvent` *extends* keyof `TEvents` & `string`
