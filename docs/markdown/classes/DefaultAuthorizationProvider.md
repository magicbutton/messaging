[**Magic Button Messaging v1.1.3**](../README.md)

***

# Class: DefaultAuthorizationProvider\<TContract\>

Default implementation of the AuthorizationProvider interface
that uses the contract's role and permission definitions

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

## Implements

- [`AuthorizationProvider`](../type-aliases/AuthorizationProvider.md)\<`TContract`\>

## Constructors

### Constructor

> **new DefaultAuthorizationProvider**\<`TContract`\>(`contract`): `DefaultAuthorizationProvider`\<`TContract`\>

Create a new DefaultAuthorizationProvider

#### Parameters

##### contract

`TContract`

#### Returns

`DefaultAuthorizationProvider`\<`TContract`\>

## Methods

### canAccessRequest()

> **canAccessRequest**(`actor`, `requestType`): `Promise`\<`boolean`\>

Check if an actor has permission to access a request

#### Parameters

##### actor

[`IActor`](../interfaces/IActor.md)

##### requestType

keyof `TContract`\[`"requests"`\] & `string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

`AuthorizationProvider.canAccessRequest`

***

### canEmitEvent()

> **canEmitEvent**(`actor`, `eventType`): `Promise`\<`boolean`\>

Check if an actor has permission to emit an event

#### Parameters

##### actor

[`IActor`](../interfaces/IActor.md)

##### eventType

keyof `TContract`\[`"events"`\] & `string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

`AuthorizationProvider.canEmitEvent`

***

### canSubscribeToEvent()

> **canSubscribeToEvent**(`actor`, `eventType`): `Promise`\<`boolean`\>

Check if an actor has permission to subscribe to an event

#### Parameters

##### actor

[`IActor`](../interfaces/IActor.md)

##### eventType

keyof `TContract`\[`"events"`\] & `string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

`AuthorizationProvider.canSubscribeToEvent`

***

### getPermissions()

> **getPermissions**(`actor`): `Promise`\<`string`[]\>

Get all permissions for an actor

#### Parameters

##### actor

[`IActor`](../interfaces/IActor.md)

#### Returns

`Promise`\<`string`[]\>

#### Implementation of

`AuthorizationProvider.getPermissions`

***

### hasPermission()

> **hasPermission**(`actor`, `permission`): `Promise`\<`boolean`\>

Check if an actor has a specific permission

#### Parameters

##### actor

[`IActor`](../interfaces/IActor.md)

##### permission

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

`AuthorizationProvider.hasPermission`
