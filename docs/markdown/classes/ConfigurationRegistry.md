[**Magic Button Messaging v1.1.3**](../README.md)

***

# Class: ConfigurationRegistry

Registry for configuration providers and factories

This registry provides a centralized location for managing
configuration sources, providers, and factories, enabling
consistent configuration across a distributed system.

## Constructors

### Constructor

> **new ConfigurationRegistry**(): `ConfigurationRegistry`

#### Returns

`ConfigurationRegistry`

## Methods

### clear()

> `static` **clear**(): `void`

Clear all registered providers, factories and sources (primarily for testing)

#### Returns

`void`

***

### createProvider()

> `static` **createProvider**(`factoryName`, `sourceNames`): `Promise`\<[`ConfigurationProvider`](../interfaces/ConfigurationProvider.md)\>

Create a configuration provider using registered factory and sources

#### Parameters

##### factoryName

`string`

Factory name

##### sourceNames

`string`[]

Source names to use

#### Returns

`Promise`\<[`ConfigurationProvider`](../interfaces/ConfigurationProvider.md)\>

***

### getProvider()

> `static` **getProvider**(`name`): `undefined` \| [`ConfigurationProvider`](../interfaces/ConfigurationProvider.md)

Get a configuration provider by name

#### Parameters

##### name

`string`

Provider name

#### Returns

`undefined` \| [`ConfigurationProvider`](../interfaces/ConfigurationProvider.md)

***

### getProviderNames()

> `static` **getProviderNames**(): `string`[]

Get all registered provider names

#### Returns

`string`[]

***

### getSource()

> `static` **getSource**(`name`): `undefined` \| [`ConfigurationSource`](../interfaces/ConfigurationSource.md)

Get a configuration source by name

#### Parameters

##### name

`string`

Source name

#### Returns

`undefined` \| [`ConfigurationSource`](../interfaces/ConfigurationSource.md)

***

### getSourceNames()

> `static` **getSourceNames**(): `string`[]

Get all registered source names

#### Returns

`string`[]

***

### hasFactory()

> `static` **hasFactory**(`name`): `boolean`

Check if a configuration factory is registered

#### Parameters

##### name

`string`

Factory name

#### Returns

`boolean`

***

### hasProvider()

> `static` **hasProvider**(`name`): `boolean`

Check if a configuration provider is registered

#### Parameters

##### name

`string`

Provider name

#### Returns

`boolean`

***

### hasSource()

> `static` **hasSource**(`name`): `boolean`

Check if a configuration source is registered

#### Parameters

##### name

`string`

Source name

#### Returns

`boolean`

***

### registerFactory()

> `static` **registerFactory**(`name`, `factory`): `void`

Register a configuration provider factory

#### Parameters

##### name

`string`

Factory name

##### factory

[`ConfigurationProviderFactory`](../interfaces/ConfigurationProviderFactory.md)

The configuration provider factory

#### Returns

`void`

***

### registerProvider()

> `static` **registerProvider**(`name`, `provider`): `void`

Register a configuration provider

#### Parameters

##### name

`string`

Provider name

##### provider

[`ConfigurationProvider`](../interfaces/ConfigurationProvider.md)

The configuration provider

#### Returns

`void`

***

### registerSource()

> `static` **registerSource**(`source`): `void`

Register a configuration source

#### Parameters

##### source

[`ConfigurationSource`](../interfaces/ConfigurationSource.md)

The configuration source

#### Returns

`void`
