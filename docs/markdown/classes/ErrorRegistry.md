[**Magic Button Messaging v1.1.1**](../README.md)

***

# Class: ErrorRegistry\<TContract\>

Error registry that stores error definitions and allows creating error instances

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

## Constructors

### Constructor

> **new ErrorRegistry**\<`TContract`\>(`contract`): `ErrorRegistry`\<`TContract`\>

Create a new error registry with predefined system errors and contract errors

#### Parameters

##### contract

`TContract`

#### Returns

`ErrorRegistry`\<`TContract`\>

## Methods

### createError()

> **createError**(`code`, `message?`, `metadata?`): [`MessagingError`](MessagingError.md)

Create an error instance from an error code

#### Parameters

##### code

`string`

The error code

##### message?

`string`

Optional custom message (overrides the default)

##### metadata?

`Record`\<`string`, `unknown`\> = `{}`

Optional metadata to attach to the error

#### Returns

[`MessagingError`](MessagingError.md)

***

### getErrorDefinitions()

> **getErrorDefinitions**(): `Map`\<`string`, [`IErrorDefinition`](../interfaces/IErrorDefinition.md)\>

Get all registered error definitions

#### Returns

`Map`\<`string`, [`IErrorDefinition`](../interfaces/IErrorDefinition.md)\>

***

### hasError()

> **hasError**(`code`): `boolean`

Check if an error code is registered

#### Parameters

##### code

`string`

#### Returns

`boolean`

***

### register()

> **register**(`definition`): `void`

Register an error definition

#### Parameters

##### definition

[`IErrorDefinition`](../interfaces/IErrorDefinition.md)

#### Returns

`void`

***

### toMessagingError()

> **toMessagingError**(`error`, `defaultCode`): [`MessagingError`](MessagingError.md)

Convert any error to a MessagingError

#### Parameters

##### error

`unknown`

##### defaultCode

`string` = `"system.unexpected_error"`

#### Returns

[`MessagingError`](MessagingError.md)
