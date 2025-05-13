[**Magic Button Messaging v1.1.3**](../README.md)

***

# Interface: VersionedSchema\<T\>

Interface for versioned schema

## Type Parameters

### T

`T` *extends* `z.ZodType`

## Properties

### deprecated?

> `optional` **deprecated**: `boolean`

***

### predecessor?

> `optional` **predecessor**: `VersionedSchema`\<`T`\>

***

### schema

> **schema**: `T`

***

### successor?

> `optional` **successor**: `VersionedSchema`\<`T`\>

***

### version

> **version**: [`SchemaVersion`](SchemaVersion.md)
