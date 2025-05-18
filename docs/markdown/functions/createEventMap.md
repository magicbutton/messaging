[**Magic Button Messaging v1.2.0**](../README.md)

***

# Function: createEventMap()

> **createEventMap**\<`T`\>(`schemas`): `T`

Creates a type-safe event schema map for defining event types

This function helps maintain type safety when defining event schemas.
It simply returns the input object, but with proper TypeScript typing.
It supports both direct schema objects and objects with schema and description fields.

## Type Parameters

### T

`T` *extends* [`EventSchemas`](../type-aliases/EventSchemas.md)

The type of event schemas

## Parameters

### schemas

`T`

Object containing event schemas or objects with schema and description

## Returns

`T`

- The validated event schema map

## Example

```typescript
// Simple format with just schemas
const simpleEvents = createEventMap({
  userCreated: z.object({ userId: z.string(), timestamp: z.number() }),
  userDeleted: z.object({ userId: z.string(), timestamp: z.number() })
});

// Extended format with schema and description
const extendedEvents = createEventMap({
  'user.created': {
    schema: z.object({ userId: z.string(), timestamp: z.number() }),
    description: 'Emitted when a new user is created'
  },
  'user.deleted': {
    schema: z.object({ userId: z.string(), timestamp: z.number() }),
    description: 'Emitted when a user is deleted from the system'
  }
});
```
