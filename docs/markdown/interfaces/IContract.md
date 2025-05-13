[**Magic Button Messaging v1.1.3**](../README.md)

***

# Interface: IContract\<TRoleKey, TEvents, TRequests, TErrors, TRoles, TPermissions\>

Definition for a messaging contract

## Type Parameters

### TRoleKey

`TRoleKey` *extends* `string` = `string`

### TEvents

`TEvents` *extends* [`EventSchemas`](../type-aliases/EventSchemas.md)\<`TRoleKey`\> = [`EventSchemas`](../type-aliases/EventSchemas.md)\<`TRoleKey`\>

### TRequests

`TRequests` *extends* [`RequestSchemas`](../type-aliases/RequestSchemas.md)\<`TRoleKey`\> = [`RequestSchemas`](../type-aliases/RequestSchemas.md)\<`TRoleKey`\>

### TErrors

`TErrors` *extends* `Record`\<`string`, [`IErrorDefinition`](IErrorDefinition.md)\> = `Record`\<`string`, [`IErrorDefinition`](IErrorDefinition.md)\>

### TRoles

`TRoles` *extends* `Record`\<`TRoleKey`, [`IRoleDefinition`](IRoleDefinition.md)\> = `Record`\<`TRoleKey`, [`IRoleDefinition`](IRoleDefinition.md)\>

### TPermissions

`TPermissions` *extends* `Record`\<`string`, [`IPermissionDefinition`](IPermissionDefinition.md)\> = `Record`\<`string`, [`IPermissionDefinition`](IPermissionDefinition.md)\>

## Properties

### errors

> **errors**: `TErrors`

***

### events

> **events**: `TEvents`

***

### name

> **name**: `string`

***

### permissions?

> `optional` **permissions**: `TPermissions`

***

### requests

> **requests**: `TRequests`

***

### roles?

> `optional` **roles**: `TRoles`

***

### version

> **version**: `string`
