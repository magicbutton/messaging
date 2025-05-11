[**Magic Button Messaging v1.1.1**](../README.md)

***

# Type Alias: SchemaType\<T\>

> **SchemaType**\<`T`\> = `T` *extends* `z.ZodType` ? `T` : `T` *extends* `object` ? `T`\[`"schema"`\] : `never`

## Type Parameters

### T

`T`
