[**Magic Button Messaging v1.1.2**](../README.md)

***

# Interface: IAuthProvider

AuthProvider interface for pluggable authentication systems

## Methods

### authenticate()

> **authenticate**(`credentials`): `Promise`\<[`IAuthResult`](IAuthResult.md)\>

Authenticate a user with credentials

#### Parameters

##### credentials

\{ `password`: `string`; `username`: `string`; \} | \{ `token`: `string`; \}

#### Returns

`Promise`\<[`IAuthResult`](IAuthResult.md)\>

***

### logout()

> **logout**(`token`): `Promise`\<`void`\>

Logout a user

#### Parameters

##### token

`string`

#### Returns

`Promise`\<`void`\>

***

### verifyToken()

> **verifyToken**(`token`): `Promise`\<\{ `actor?`: [`IActor`](IActor.md); `valid`: `boolean`; \}\>

Verify a token is valid

#### Parameters

##### token

`string`

#### Returns

`Promise`\<\{ `actor?`: [`IActor`](IActor.md); `valid`: `boolean`; \}\>
