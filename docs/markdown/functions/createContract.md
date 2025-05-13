[**Magic Button Messaging v1.1.3**](../README.md)

***

# Function: createContract()

> **createContract**\<`TEvents`, `TRequests`, `TErrors`\>(`contract`): `object`

Creates a complete contract combining events, requests, and errors

A contract defines the communication protocol between clients and servers,
including all events, requests/responses, and error types.

## Type Parameters

### TEvents

`TEvents` *extends* [`EventSchemas`](../type-aliases/EventSchemas.md)

The type of event schemas

### TRequests

`TRequests` *extends* [`RequestSchemas`](../type-aliases/RequestSchemas.md)

The type of request schemas

### TErrors

`TErrors` *extends* `Record`\<`string`, \{ `code`: `string`; `message`: `string`; `status?`: `number`; \}\>

The type of error definitions

## Parameters

### contract

The contract definition object

#### errors?

`TErrors`

Error definitions for the contract

#### events

`TEvents`

Event schemas for the contract

#### requests

`TRequests`

Request schemas for the contract

## Returns

`object`

- The complete contract with events, requests, and errors

### errors

> **errors**: `TErrors` \| `Record`\<`string`, `never`\>

### events

> **events**: `TEvents`

### requests

> **requests**: `TRequests`

## Example

```typescript
const userContract = createContract({
  events: {
    userCreated: z.object({ id: z.string() }),
    userUpdated: z.object({ id: z.string(), changes: z.record(z.string()) })
  },
  requests: {
    getUser: {
      requestSchema: z.object({ id: z.string() }),
      responseSchema: z.object({ id: z.string(), name: z.string() })
    }
  },
  errors: {
    USER_NOT_FOUND: { code: 'USER_NOT_FOUND', message: 'User not found', status: 404 }
  }
});
```
