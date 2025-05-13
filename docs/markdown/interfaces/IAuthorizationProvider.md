[**Magic Button Messaging v1.1.3**](../README.md)

***

# Interface: IAuthorizationProvider\<TContract\>

Authorization provider interface for pluggable permission systems

## Type Parameters

### TContract

`TContract` *extends* [`IContract`](IContract.md) = [`IContract`](IContract.md)

## Methods

### canAccessRequest()

> **canAccessRequest**(`actor`, `requestType`): `Promise`\<`boolean`\>

Check if an actor has permission to access a request

#### Parameters

##### actor

[`IActor`](IActor.md)

##### requestType

keyof `TContract`\[`"requests"`\] & `string`

#### Returns

`Promise`\<`boolean`\>

***

### canEmitEvent()

> **canEmitEvent**(`actor`, `eventType`): `Promise`\<`boolean`\>

Check if an actor has permission to emit an event

#### Parameters

##### actor

[`IActor`](IActor.md)

##### eventType

keyof `TContract`\[`"events"`\] & `string`

#### Returns

`Promise`\<`boolean`\>

***

### canSubscribeToEvent()

> **canSubscribeToEvent**(`actor`, `eventType`): `Promise`\<`boolean`\>

Check if an actor has permission to listen to an event

#### Parameters

##### actor

[`IActor`](IActor.md)

##### eventType

keyof `TContract`\[`"events"`\] & `string`

#### Returns

`Promise`\<`boolean`\>

***

### getPermissions()

> **getPermissions**(`actor`): `Promise`\<`string`[]\>

Get all permissions for an actor

#### Parameters

##### actor

[`IActor`](IActor.md)

#### Returns

`Promise`\<`string`[]\>

***

### hasPermission()

> **hasPermission**(`actor`, `permission`): `Promise`\<`boolean`\>

Check if an actor has a specific permission

#### Parameters

##### actor

[`IActor`](IActor.md)

##### permission

`string`

#### Returns

`Promise`\<`boolean`\>
