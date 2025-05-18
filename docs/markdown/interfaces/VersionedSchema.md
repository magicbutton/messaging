[**Magic Button Messaging v1.2.0**](../README.md)

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
