[**Magic Button Messaging v1.2.0**](../README.md)

***

# Function: getSchemaByVersion()

> **getSchemaByVersion**\<`T`\>(`schemas`, `version`): `undefined` \| [`VersionedSchema`](../interfaces/VersionedSchema.md)\<`T`\>

Get a specific version of a schema

## Type Parameters

### T

`T` *extends* `ZodType`\<`any`, `ZodTypeDef`, `any`\>

## Parameters

### schemas

[`VersionedSchema`](../interfaces/VersionedSchema.md)\<`T`\>[]

Array of versioned schemas

### version

[`SchemaVersion`](../interfaces/SchemaVersion.md)

The version to find

## Returns

`undefined` \| [`VersionedSchema`](../interfaces/VersionedSchema.md)\<`T`\>

The matching schema or undefined
