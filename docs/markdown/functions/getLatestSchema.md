[**Magic Button Messaging v1.2.0**](../README.md)

***

# Function: getLatestSchema()

> **getLatestSchema**\<`T`\>(`schemas`): `undefined` \| [`VersionedSchema`](../interfaces/VersionedSchema.md)\<`T`\>

Get the latest version of a schema

## Type Parameters

### T

`T` *extends* `ZodType`\<`any`, `ZodTypeDef`, `any`\>

## Parameters

### schemas

[`VersionedSchema`](../interfaces/VersionedSchema.md)\<`T`\>[]

Array of versioned schemas

## Returns

`undefined` \| [`VersionedSchema`](../interfaces/VersionedSchema.md)\<`T`\>

The latest non-deprecated schema
