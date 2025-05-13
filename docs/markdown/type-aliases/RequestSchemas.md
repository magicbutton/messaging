[**Magic Button Messaging v1.1.3**](../README.md)

***

# Type Alias: RequestSchemas\<TRoleKey\>

> **RequestSchemas**\<`TRoleKey`\> = `Record`\<`string`, \{ `access?`: [`IAccessSettings`](../interfaces/IAccessSettings.md)\<`TRoleKey`\>; `description?`: `string`; `requestSchema`: `z.ZodType`; `responseSchema`: `z.ZodType`; \} \| \{ `access?`: [`IAccessSettings`](../interfaces/IAccessSettings.md)\<`TRoleKey`\>; `description?`: `string`; `request`: `z.ZodType`; `response`: `z.ZodType`; \}\>

Type definition for request/response schemas used in contracts
Maps request names to their request and response schema definitions,
or to objects with request schema, response schema, and description properties

## Type Parameters

### TRoleKey

`TRoleKey` *extends* `string` = `string`

The type of role keys

## Template

The request schema type

## Template

The response schema type
