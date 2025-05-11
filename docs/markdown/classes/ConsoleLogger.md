[**Magic Button Messaging v1.1.2**](../README.md)

***

# Class: ConsoleLogger

Default console logger implementation

## Implements

- [`Logger`](../interfaces/Logger.md)

## Constructors

### Constructor

> **new ConsoleLogger**(`name`, `logLevel`): `ConsoleLogger`

#### Parameters

##### name

`string`

##### logLevel

[`LogLevel`](../enumerations/LogLevel.md) = `LogLevel.INFO`

#### Returns

`ConsoleLogger`

## Methods

### debug()

> **debug**(`message`, `context?`): `void`

#### Parameters

##### message

`string`

##### context?

`Record`\<`string`, `any`\>

#### Returns

`void`

#### Implementation of

[`Logger`](../interfaces/Logger.md).[`debug`](../interfaces/Logger.md#debug)

***

### error()

> **error**(`message`, `error?`, `context?`): `void`

#### Parameters

##### message

`string`

##### error?

`Error`

##### context?

`Record`\<`string`, `any`\>

#### Returns

`void`

#### Implementation of

[`Logger`](../interfaces/Logger.md).[`error`](../interfaces/Logger.md#error)

***

### info()

> **info**(`message`, `context?`): `void`

#### Parameters

##### message

`string`

##### context?

`Record`\<`string`, `any`\>

#### Returns

`void`

#### Implementation of

[`Logger`](../interfaces/Logger.md).[`info`](../interfaces/Logger.md#info)

***

### warn()

> **warn**(`message`, `context?`): `void`

#### Parameters

##### message

`string`

##### context?

`Record`\<`string`, `any`\>

#### Returns

`void`

#### Implementation of

[`Logger`](../interfaces/Logger.md).[`warn`](../interfaces/Logger.md#warn)
