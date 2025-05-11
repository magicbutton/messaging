[**Magic Button Messaging v1.1.1**](../README.md)

***

# Interface: IServerOptions

Server options interface

## Properties

### authorizationProvider?

> `optional` **authorizationProvider**: [`IAuthorizationProvider`](IAuthorizationProvider.md)\<[`IContract`](IContract.md)\<`string`, [`EventSchemas`](../type-aliases/EventSchemas.md)\<`string`\>, [`RequestSchemas`](../type-aliases/RequestSchemas.md)\<`string`\>, `Record`\<`string`, [`IErrorDefinition`](IErrorDefinition.md)\>, `Record`\<`string`, [`IRoleDefinition`](IRoleDefinition.md)\>, `Record`\<`string`, [`IPermissionDefinition`](IPermissionDefinition.md)\>\>\>

***

### authProvider?

> `optional` **authProvider**: [`IAuthProvider`](IAuthProvider.md)

***

### capabilities?

> `optional` **capabilities**: `string`[]

***

### clientTimeout?

> `optional` **clientTimeout**: `number`

***

### heartbeatInterval?

> `optional` **heartbeatInterval**: `number`

***

### maxClients?

> `optional` **maxClients**: `number`

***

### serverId?

> `optional` **serverId**: `string`

***

### version?

> `optional` **version**: `string`
