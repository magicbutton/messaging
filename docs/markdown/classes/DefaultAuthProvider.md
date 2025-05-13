[**Magic Button Messaging v1.1.3**](../README.md)

***

# Class: DefaultAuthProvider

Default implementation of the AuthProvider interface
that uses in-memory storage for users and tokens

## Implements

- [`AuthProvider`](../type-aliases/AuthProvider.md)

## Constructors

### Constructor

> **new DefaultAuthProvider**(`initialUsers`): `DefaultAuthProvider`

Create a new DefaultAuthProvider with optional initial users

#### Parameters

##### initialUsers

`object`[] = `[]`

#### Returns

`DefaultAuthProvider`

## Methods

### authenticate()

> **authenticate**(`credentials`): `Promise`\<[`IAuthResult`](../interfaces/IAuthResult.md)\>

Authenticate a user with credentials

#### Parameters

##### credentials

\{ `password`: `string`; `username`: `string`; \} | \{ `token`: `string`; \}

#### Returns

`Promise`\<[`IAuthResult`](../interfaces/IAuthResult.md)\>

#### Implementation of

`AuthProvider.authenticate`

***

### logout()

> **logout**(`token`): `Promise`\<`void`\>

Logout a user by invalidating their token

#### Parameters

##### token

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`AuthProvider.logout`

***

### registerUser()

> **registerUser**(`id`, `username`, `password`, `roles?`): `void`

Register a new user

#### Parameters

##### id

`string`

##### username

`string`

##### password

`string`

##### roles?

`string`[]

#### Returns

`void`

***

### removeUser()

> **removeUser**(`username`): `boolean`

Remove a user

#### Parameters

##### username

`string`

#### Returns

`boolean`

***

### verifyToken()

> **verifyToken**(`token`): `Promise`\<\{ `actor?`: [`IActor`](../interfaces/IActor.md); `valid`: `boolean`; \}\>

Verify a token is valid

#### Parameters

##### token

`string`

#### Returns

`Promise`\<\{ `actor?`: [`IActor`](../interfaces/IActor.md); `valid`: `boolean`; \}\>

#### Implementation of

`AuthProvider.verifyToken`
