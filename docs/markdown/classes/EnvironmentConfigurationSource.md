[**Magic Button Messaging v1.1.2**](../README.md)

***

# Class: EnvironmentConfigurationSource

Environment variables configuration source

## Implements

- [`ConfigurationSource`](../interfaces/ConfigurationSource.md)

## Constructors

### Constructor

> **new EnvironmentConfigurationSource**(`name`, `prefix`): `EnvironmentConfigurationSource`

Create a new environment configuration source

#### Parameters

##### name

`string`

Source name

##### prefix

`string` = `"MSG_"`

Optional prefix for environment variables

#### Returns

`EnvironmentConfigurationSource`

## Methods

### getName()

> **getName**(): `string`

Get source name

#### Returns

`string`

#### Implementation of

[`ConfigurationSource`](../interfaces/ConfigurationSource.md).[`getName`](../interfaces/ConfigurationSource.md#getname)

***

### load()

> **load**(): `Promise`\<`Record`\<`string`, `any`\>\>

Load configuration from environment variables

#### Returns

`Promise`\<`Record`\<`string`, `any`\>\>

#### Implementation of

[`ConfigurationSource`](../interfaces/ConfigurationSource.md).[`load`](../interfaces/ConfigurationSource.md#load)
