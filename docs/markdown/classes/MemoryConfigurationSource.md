[**Magic Button Messaging v1.1.3**](../README.md)

***

# Class: MemoryConfigurationSource

Memory-based configuration source

## Implements

- [`ConfigurationSource`](../interfaces/ConfigurationSource.md)

## Constructors

### Constructor

> **new MemoryConfigurationSource**(`name`, `data`): `MemoryConfigurationSource`

Create a new memory configuration source

#### Parameters

##### name

`string`

Source name

##### data

`Record`\<`string`, `any`\> = `{}`

Configuration data

#### Returns

`MemoryConfigurationSource`

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

Load configuration from memory

#### Returns

`Promise`\<`Record`\<`string`, `any`\>\>

#### Implementation of

[`ConfigurationSource`](../interfaces/ConfigurationSource.md).[`load`](../interfaces/ConfigurationSource.md#load)
