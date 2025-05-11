[**Magic Button Messaging v1.1.1**](../README.md)

***

# Type Alias: Contract\<TRoleKey, TEvents, TRequests, TErrors, TRoles, TPermissions\>

> **Contract**\<`TRoleKey`, `TEvents`, `TRequests`, `TErrors`, `TRoles`, `TPermissions`\> = [`IContract`](../interfaces/IContract.md)\<`TRoleKey`, `TEvents`, `TRequests`, `TErrors`, `TRoles`, `TPermissions`\>

## Type Parameters

### TRoleKey

`TRoleKey` *extends* `string` = `string`

### TEvents

`TEvents` *extends* [`EventSchemas`](EventSchemas.md)\<`TRoleKey`\> = [`EventSchemas`](EventSchemas.md)\<`TRoleKey`\>

### TRequests

`TRequests` *extends* [`RequestSchemas`](RequestSchemas.md)\<`TRoleKey`\> = [`RequestSchemas`](RequestSchemas.md)\<`TRoleKey`\>

### TErrors

`TErrors` *extends* `Record`\<`string`, [`IErrorDefinition`](../interfaces/IErrorDefinition.md)\> = `Record`\<`string`, [`IErrorDefinition`](../interfaces/IErrorDefinition.md)\>

### TRoles

`TRoles` *extends* `Record`\<`TRoleKey`, [`IRoleDefinition`](../interfaces/IRoleDefinition.md)\> = `Record`\<`TRoleKey`, [`IRoleDefinition`](../interfaces/IRoleDefinition.md)\>

### TPermissions

`TPermissions` *extends* `Record`\<`string`, [`IPermissionDefinition`](../interfaces/IPermissionDefinition.md)\> = `Record`\<`string`, [`IPermissionDefinition`](../interfaces/IPermissionDefinition.md)\>
