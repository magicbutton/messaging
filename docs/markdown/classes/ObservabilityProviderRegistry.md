[**Magic Button Messaging v1.1.3**](../README.md)

***

# Class: ObservabilityProviderRegistry

Registry for observability provider factories

## Constructors

### Constructor

> **new ObservabilityProviderRegistry**(): `ObservabilityProviderRegistry`

#### Returns

`ObservabilityProviderRegistry`

## Methods

### clearFactories()

> `static` **clearFactories**(): `void`

Clear all registered factories (primarily for testing)

#### Returns

`void`

***

### createObservabilityProvider()

> `static` **createObservabilityProvider**(`config`): [`ObservabilityProvider`](../interfaces/ObservabilityProvider.md)

Create an observability provider instance with the specified configuration

#### Parameters

##### config

[`ObservabilityConfig`](../interfaces/ObservabilityConfig.md)

The observability provider configuration

#### Returns

[`ObservabilityProvider`](../interfaces/ObservabilityProvider.md)

***

### hasFactory()

> `static` **hasFactory**(`type`): `boolean`

Check if an observability provider type is registered

#### Parameters

##### type

`string`

The provider type to check

#### Returns

`boolean`

***

### registerFactory()

> `static` **registerFactory**(`type`, `factory`): `void`

Register an observability provider factory

#### Parameters

##### type

`string`

The provider type identifier

##### factory

[`ObservabilityProviderFactory`](../interfaces/ObservabilityProviderFactory.md)

The factory implementation

#### Returns

`void`
