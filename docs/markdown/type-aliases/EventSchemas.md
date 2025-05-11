[**Magic Button Messaging v1.1.1**](../README.md)

***

# Type Alias: EventSchemas\<TRoleKey\>

> **EventSchemas**\<`TRoleKey`\> = `Record`\<`string`, `z.ZodType` \| \{ `access?`: [`IAccessSettings`](../interfaces/IAccessSettings.md)\<`TRoleKey`\>; `description?`: `string`; `schema`: `z.ZodType`; \}\>

Type definition for event schemas used in contracts
Maps event names to their Zod schema definitions,
or to objects with schema and description properties

## Type Parameters

### TRoleKey

`TRoleKey` *extends* `string` = `string`

The type of role keys

## Template

The Zod schema type
