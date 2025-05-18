[**Magic Button Messaging v1.2.0**](../README.md)

***

# Class: DefaultConfigurationProviderFactory

Default configuration provider factory

## Implements

- [`ConfigurationProviderFactory`](../interfaces/ConfigurationProviderFactory.md)

## Constructors

### Constructor

> **new DefaultConfigurationProviderFactory**(): `DefaultConfigurationProviderFactory`

#### Returns

`DefaultConfigurationProviderFactory`

## Methods

### createProvider()

> **createProvider**(`sources`): `Promise`\<[`ConfigurationProvider`](../interfaces/ConfigurationProvider.md)\>

Create a configuration provider from multiple sources

#### Parameters

##### sources

[`ConfigurationSource`](../interfaces/ConfigurationSource.md)[]

Configuration sources to use

#### Returns

`Promise`\<[`ConfigurationProvider`](../interfaces/ConfigurationProvider.md)\>

#### Implementation of

[`ConfigurationProviderFactory`](../interfaces/ConfigurationProviderFactory.md).[`createProvider`](../interfaces/ConfigurationProviderFactory.md#createprovider)
