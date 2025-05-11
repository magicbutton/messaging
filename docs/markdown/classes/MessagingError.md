[**Magic Button Messaging v1.1.2**](../README.md)

***

# Class: MessagingError

Messaging error that includes error code and metadata

## Extends

- `Error`

## Constructors

### Constructor

> **new MessagingError**(`message`, `code`, `severity`, `type`, `retryable`, `metadata`): `MessagingError`

#### Parameters

##### message

`string`

##### code

`string`

##### severity

[`ErrorSeverity`](../enumerations/ErrorSeverity.md) = `ErrorSeverity.ERROR`

##### type

[`ErrorType`](../enumerations/ErrorType.md) = `ErrorType.UNEXPECTED`

##### retryable

`boolean` = `false`

##### metadata

`Record`\<`string`, `unknown`\> = `{}`

#### Returns

`MessagingError`

#### Overrides

`Error.constructor`

## Properties

### code

> `readonly` **code**: `string`

***

### metadata

> `readonly` **metadata**: `Record`\<`string`, `unknown`\>

***

### retryable

> `readonly` **retryable**: `boolean`

***

### severity

> `readonly` **severity**: [`ErrorSeverity`](../enumerations/ErrorSeverity.md)

***

### type

> `readonly` **type**: [`ErrorType`](../enumerations/ErrorType.md)

## Methods

### toJSON()

> **toJSON**(): `Record`\<`string`, `unknown`\>

Convert the error to a plain object for serialization

#### Returns

`Record`\<`string`, `unknown`\>
