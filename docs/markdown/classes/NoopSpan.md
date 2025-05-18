[**Magic Button Messaging v1.2.0**](../README.md)

***

# Class: NoopSpan

No-op span implementation

## Implements

- [`Span`](../interfaces/Span.md)

## Constructors

### Constructor

> **new NoopSpan**(): `NoopSpan`

#### Returns

`NoopSpan`

## Methods

### finish()

> **finish**(): `void`

#### Returns

`void`

#### Implementation of

[`Span`](../interfaces/Span.md).[`finish`](../interfaces/Span.md#finish)

***

### setError()

> **setError**(`error`): `this`

#### Parameters

##### error

`Error`

#### Returns

`this`

#### Implementation of

[`Span`](../interfaces/Span.md).[`setError`](../interfaces/Span.md#seterror)

***

### setTag()

> **setTag**(`key`, `value`): `this`

#### Parameters

##### key

`string`

##### value

`string` | `number` | `boolean`

#### Returns

`this`

#### Implementation of

[`Span`](../interfaces/Span.md).[`setTag`](../interfaces/Span.md#settag)
