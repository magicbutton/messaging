[**Magic Button Messaging v1.2.0**](../README.md)

***

# Function: createRequestSchemaMap()

> **createRequestSchemaMap**\<`T`\>(`schemas`): `T`

Creates a type-safe request schema map for defining request/response pairs

This function helps maintain type safety when defining request schemas.
It simply returns the input object, but with proper TypeScript typing.
It supports both the traditional format with requestSchema/responseSchema
and the alternative format with request/response.

## Type Parameters

### T

`T` *extends* [`RequestSchemas`](../type-aliases/RequestSchemas.md)

The type of request schemas

## Parameters

### schemas

`T`

Object containing request schemas

## Returns

`T`

- The validated request schema map

## Example

```typescript
// Traditional format
const traditionalSchemas = createRequestSchemaMap({
  getUser: {
    requestSchema: z.object({ userId: z.string() }),
    responseSchema: z.object({ name: z.string(), email: z.string() })
  }
});

// Alternative format with description
const alternativeSchemas = createRequestSchemaMap({
  "user.get": {
    request: z.object({ userId: z.string() }),
    response: z.object({ name: z.string(), email: z.string() }),
    description: "Get user by ID"
  }
});
```
