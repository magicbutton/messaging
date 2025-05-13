[**Magic Button Messaging v1.1.3**](../README.md)

***

# Class: JsonFileConfigurationSource

JSON file configuration source

## Implements

- [`ConfigurationSource`](../interfaces/ConfigurationSource.md)

## Constructors

### Constructor

> **new JsonFileConfigurationSource**(`name`, `filePath`, `optional`): `JsonFileConfigurationSource`

Create a new JSON file configuration source

#### Parameters

##### name

`string`

Source name

##### filePath

`string`

Path to JSON file

##### optional

`boolean` = `false`

Whether file is optional (don't throw if missing)

#### Returns

`JsonFileConfigurationSource`

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

Load configuration from JSON file

#### Returns

`Promise`\<`Record`\<`string`, `any`\>\>

#### Implementation of

[`ConfigurationSource`](../interfaces/ConfigurationSource.md).[`load`](../interfaces/ConfigurationSource.md#load)
