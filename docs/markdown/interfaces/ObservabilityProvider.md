[**Magic Button Messaging v1.2.0**](../README.md)

***

# Interface: ObservabilityProvider

Observability provider interface

## Methods

### getLogger()

> **getLogger**(`name`): [`Logger`](Logger.md)

#### Parameters

##### name

`string`

#### Returns

[`Logger`](Logger.md)

***

### getMetrics()

> **getMetrics**(): [`Metrics`](Metrics.md)

#### Returns

[`Metrics`](Metrics.md)

***

### getTracer()

> **getTracer**(`name`): [`Tracer`](Tracer.md)

#### Parameters

##### name

`string`

#### Returns

[`Tracer`](Tracer.md)
