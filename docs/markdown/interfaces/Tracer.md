[**Magic Button Messaging v1.1.1**](../README.md)

***

# Interface: Tracer

Tracer interface

## Methods

### extract()

> **extract**(`format`, `carrier`): `null` \| [`Span`](Span.md)

#### Parameters

##### format

`string`

##### carrier

`unknown`

#### Returns

`null` \| [`Span`](Span.md)

***

### inject()

> **inject**(`span`, `format`, `carrier`): `void`

#### Parameters

##### span

[`Span`](Span.md)

##### format

`string`

##### carrier

`unknown`

#### Returns

`void`

***

### startSpan()

> **startSpan**(`name`, `options?`): [`Span`](Span.md)

#### Parameters

##### name

`string`

##### options?

###### childOf?

[`Span`](Span.md)

#### Returns

[`Span`](Span.md)
