[**Magic Button Messaging v1.1.1**](../README.md)

***

# Interface: ConfigurationProviderFactory

Factory interface for creating configuration providers

This factory creates providers that can load and merge configuration
from multiple sources following priority rules defined by the factory.

## Methods

### createProvider()

> **createProvider**(`sources`): `Promise`\<[`ConfigurationProvider`](ConfigurationProvider.md)\>

Create a configuration provider from multiple sources

Sources are typically processed in order with later sources
overriding values from earlier ones, allowing for layered
configuration (defaults, environment-specific, instance-specific).

#### Parameters

##### sources

[`ConfigurationSource`](ConfigurationSource.md)[]

Configuration sources to load and merge

#### Returns

`Promise`\<[`ConfigurationProvider`](ConfigurationProvider.md)\>

Promise resolving to a configured provider
