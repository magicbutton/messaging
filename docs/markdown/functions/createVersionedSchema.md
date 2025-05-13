[**Magic Button Messaging v1.1.3**](../README.md)

***

# Function: createVersionedSchema()

> **createVersionedSchema**\<`T`\>(`schema`, `version`, `options`): [`VersionedSchema`](../interfaces/VersionedSchema.md)\<`T`\>

Create a versioned schema

## Type Parameters

### T

`T` *extends* `ZodType`\<`any`, `ZodTypeDef`, `any`\>

## Parameters

### schema

`T`

The Zod schema

### version

[`SchemaVersion`](../interfaces/SchemaVersion.md)

The schema version

### options

Additional options

#### deprecated?

`boolean`

## Returns

[`VersionedSchema`](../interfaces/VersionedSchema.md)\<`T`\>

The versioned schema
