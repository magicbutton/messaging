[**Magic Button Messaging v1.1.1**](../README.md)

***

# Class: NoopTracerFactory

Factory for creating noop tracers

## Implements

- [`TracerFactory`](../interfaces/TracerFactory.md)

## Constructors

### Constructor

> **new NoopTracerFactory**(): `NoopTracerFactory`

#### Returns

`NoopTracerFactory`

## Methods

### createTracer()

> **createTracer**(`name`, `options?`): [`NoopTracer`](NoopTracer.md)

Create a tracer instance

#### Parameters

##### name

`string`

The tracer name

##### options?

`Record`\<`string`, `any`\>

Optional tracer configuration

#### Returns

[`NoopTracer`](NoopTracer.md)

#### Implementation of

[`TracerFactory`](../interfaces/TracerFactory.md).[`createTracer`](../interfaces/TracerFactory.md#createtracer)
