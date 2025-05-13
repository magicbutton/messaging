[**Magic Button Messaging v1.1.3**](../README.md)

***

# Interface: AccessControl

Access control interface

## Methods

### getPermissions()

> **getPermissions**(`actor`): `string`[]

Get all permissions for an actor

#### Parameters

##### actor

[`IActor`](IActor.md)

The actor

#### Returns

`string`[]

The permissions

***

### getRoles()

> **getRoles**(`actor`): `string`[]

Get all roles for an actor

#### Parameters

##### actor

[`IActor`](IActor.md)

The actor

#### Returns

`string`[]

The roles

***

### hasPermission()

> **hasPermission**(`actor`, `permission`): `boolean`

Check if an actor has a permission

#### Parameters

##### actor

[`IActor`](IActor.md)

The actor

##### permission

`string`

The permission

#### Returns

`boolean`

True if the actor has the permission

***

### hasRole()

> **hasRole**(`actor`, `role`): `boolean`

Check if an actor has a role

#### Parameters

##### actor

[`IActor`](IActor.md)

The actor

##### role

`string`

The role

#### Returns

`boolean`

True if the actor has the role
