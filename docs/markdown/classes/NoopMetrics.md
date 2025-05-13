[**Magic Button Messaging v1.1.3**](../README.md)

***

# Class: NoopMetrics

No-op implementation of metrics

## Implements

- [`Metrics`](../interfaces/Metrics.md)

## Constructors

### Constructor

> **new NoopMetrics**(): `NoopMetrics`

#### Returns

`NoopMetrics`

## Methods

### gauge()

> **gauge**(`name`, `value`, `tags?`): `void`

#### Parameters

##### name

`string`

##### value

`number`

##### tags?

`Record`\<`string`, `string`\>

#### Returns

`void`

#### Implementation of

[`Metrics`](../interfaces/Metrics.md).[`gauge`](../interfaces/Metrics.md#gauge)

***

### histogram()

> **histogram**(`name`, `value`, `tags?`): `void`

#### Parameters

##### name

`string`

##### value

`number`

##### tags?

`Record`\<`string`, `string`\>

#### Returns

`void`

#### Implementation of

[`Metrics`](../interfaces/Metrics.md).[`histogram`](../interfaces/Metrics.md#histogram)

***

### increment()

> **increment**(`name`, `value?`, `tags?`): `void`

#### Parameters

##### name

`string`

##### value?

`number`

##### tags?

`Record`\<`string`, `string`\>

#### Returns

`void`

#### Implementation of

[`Metrics`](../interfaces/Metrics.md).[`increment`](../interfaces/Metrics.md#increment)

***

### timing()

> **timing**(`name`, `value`, `tags?`): `void`

#### Parameters

##### name

`string`

##### value

`number`

##### tags?

`Record`\<`string`, `string`\>

#### Returns

`void`

#### Implementation of

[`Metrics`](../interfaces/Metrics.md).[`timing`](../interfaces/Metrics.md#timing)
