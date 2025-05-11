[**Magic Button Messaging v1.1.2**](../README.md)

***

# Class: DefaultObservabilityProviderFactory

Factory for creating DefaultObservabilityProvider instances

## Implements

- [`ObservabilityProviderFactory`](../interfaces/ObservabilityProviderFactory.md)

## Constructors

### Constructor

> **new DefaultObservabilityProviderFactory**(`loggerFactory?`, `metricsFactory?`, `tracerFactory?`): `DefaultObservabilityProviderFactory`

Create a new DefaultObservabilityProviderFactory

#### Parameters

##### loggerFactory?

[`LoggerFactory`](../interfaces/LoggerFactory.md)

Optional custom logger factory

##### metricsFactory?

[`MetricsFactory`](../interfaces/MetricsFactory.md)

Optional custom metrics factory

##### tracerFactory?

[`TracerFactory`](../interfaces/TracerFactory.md)

Optional custom tracer factory

#### Returns

`DefaultObservabilityProviderFactory`

## Methods

### createObservabilityProvider()

> **createObservabilityProvider**(`config`): [`ObservabilityProvider`](../interfaces/ObservabilityProvider.md)

Create a DefaultObservabilityProvider instance

#### Parameters

##### config

[`ObservabilityConfig`](../interfaces/ObservabilityConfig.md)

The factory configuration

#### Returns

[`ObservabilityProvider`](../interfaces/ObservabilityProvider.md)

#### Implementation of

[`ObservabilityProviderFactory`](../interfaces/ObservabilityProviderFactory.md).[`createObservabilityProvider`](../interfaces/ObservabilityProviderFactory.md#createobservabilityprovider)
