[**Magic Button Messaging v1.2.0**](../README.md)

***

# Class: NoopTracer

No-op tracer implementation

## Implements

- [`Tracer`](../interfaces/Tracer.md)

## Constructors

### Constructor

> **new NoopTracer**(): `NoopTracer`

#### Returns

`NoopTracer`

## Methods

### extract()

> **extract**(`format`, `carrier`): `null` \| [`Span`](../interfaces/Span.md)

#### Parameters

##### format

`string`

##### carrier

`unknown`

#### Returns

`null` \| [`Span`](../interfaces/Span.md)

#### Implementation of

[`Tracer`](../interfaces/Tracer.md).[`extract`](../interfaces/Tracer.md#extract)

***

### inject()

> **inject**(`span`, `format`, `carrier`): `void`

#### Parameters

##### span

[`Span`](../interfaces/Span.md)

##### format

`string`

##### carrier

`unknown`

#### Returns

`void`

#### Implementation of

[`Tracer`](../interfaces/Tracer.md).[`inject`](../interfaces/Tracer.md#inject)

***

### startSpan()

> **startSpan**(`name`, `options?`): [`Span`](../interfaces/Span.md)

#### Parameters

##### name

`string`

##### options?

###### childOf?

[`Span`](../interfaces/Span.md)

#### Returns

[`Span`](../interfaces/Span.md)

#### Implementation of

[`Tracer`](../interfaces/Tracer.md).[`startSpan`](../interfaces/Tracer.md#startspan)
