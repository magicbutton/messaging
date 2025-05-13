[**Magic Button Messaging v1.1.3**](../README.md)

***

# Interface: ITransport\<TContract\>

Transport interface for messaging

## Type Parameters

### TContract

`TContract` *extends* [`IContract`](IContract.md) = [`IContract`](IContract.md)

## Methods

### connect()

> **connect**(`connectionString`): `Promise`\<`void`\>

#### Parameters

##### connectionString

`string`

#### Returns

`Promise`\<`void`\>

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

***

### emit()

> **emit**\<`E`\>(`event`, `payload`, `context?`): `Promise`\<`void`\>

#### Type Parameters

##### E

`E` *extends* `string`

#### Parameters

##### event

`E`

##### payload

[`InferEventData`](../type-aliases/InferEventData.md)\<`TContract`\[`"events"`\], `E`\>

##### context?

[`IMessageContext`](IMessageContext.md)

#### Returns

`Promise`\<`void`\>

***

### getConnectionString()

> **getConnectionString**(): `string`

#### Returns

`string`

***

### handleRequest()

> **handleRequest**\<`R`\>(`requestType`, `handler`): `void`

#### Type Parameters

##### R

`R` *extends* `string`

#### Parameters

##### requestType

`R`

##### handler

(`payload`, `context`) => `Promise`\<[`InferResponseData`](../type-aliases/InferResponseData.md)\<`TContract`\[`"requests"`\], `R`\>\>

#### Returns

`void`

***

### isConnected()

> **isConnected**(): `boolean`

#### Returns

`boolean`

***

### login()

> **login**(`credentials`): `Promise`\<[`IAuthResult`](IAuthResult.md)\>

#### Parameters

##### credentials

\{ `password`: `string`; `username`: `string`; \} | \{ `token`: `string`; \}

#### Returns

`Promise`\<[`IAuthResult`](IAuthResult.md)\>

***

### logout()

> **logout**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

***

### off()

> **off**\<`E`\>(`event`, `handler`): `void`

#### Type Parameters

##### E

`E` *extends* `string`

#### Parameters

##### event

`E`

##### handler

(`payload`, `context`) => `void`

#### Returns

`void`

***

### on()

> **on**\<`E`\>(`event`, `handler`, `subscriptionContext?`): `void`

#### Type Parameters

##### E

`E` *extends* `string`

#### Parameters

##### event

`E`

##### handler

(`payload`, `context`) => `void`

##### subscriptionContext?

[`IMessageContext`](IMessageContext.md)

#### Returns

`void`

***

### request()

> **request**\<`R`\>(`requestType`, `payload`, `context?`): `Promise`\<[`InferResponseData`](../type-aliases/InferResponseData.md)\<`TContract`\[`"requests"`\], `R`\>\>

#### Type Parameters

##### R

`R` *extends* `string`

#### Parameters

##### requestType

`R`

##### payload

[`InferRequestData`](../type-aliases/InferRequestData.md)\<`TContract`\[`"requests"`\], `R`\>

##### context?

[`IMessageContext`](IMessageContext.md)

#### Returns

`Promise`\<[`InferResponseData`](../type-aliases/InferResponseData.md)\<`TContract`\[`"requests"`\], `R`\>\>
