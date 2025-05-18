[**Magic Button Messaging v1.2.0**](../README.md)

***

# Class: DefaultConfigurationProvider

Default configuration provider implementation

## Implements

- [`ConfigurationProvider`](../interfaces/ConfigurationProvider.md)

## Constructors

### Constructor

> **new DefaultConfigurationProvider**(`config`): `DefaultConfigurationProvider`

Create a new default configuration provider

#### Parameters

##### config

`Record`\<`string`, `any`\> = `{}`

Initial configuration

#### Returns

`DefaultConfigurationProvider`

## Methods

### get()

> **get**\<`T`\>(`key`, `defaultValue?`): `T`

Get configuration value by key

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

Configuration key path

##### defaultValue?

`T`

Default value if key not found

#### Returns

`T`

#### Implementation of

[`ConfigurationProvider`](../interfaces/ConfigurationProvider.md).[`get`](../interfaces/ConfigurationProvider.md#get)

***

### getAll()

> **getAll**(): `Record`\<`string`, `any`\>

Get all configuration values

#### Returns

`Record`\<`string`, `any`\>

#### Implementation of

[`ConfigurationProvider`](../interfaces/ConfigurationProvider.md).[`getAll`](../interfaces/ConfigurationProvider.md#getall)

***

### getSection()

> **getSection**(`section`): `Record`\<`string`, `any`\>

Get configuration section

#### Parameters

##### section

`string`

Section name

#### Returns

`Record`\<`string`, `any`\>

#### Implementation of

[`ConfigurationProvider`](../interfaces/ConfigurationProvider.md).[`getSection`](../interfaces/ConfigurationProvider.md#getsection)

***

### has()

> **has**(`key`): `boolean`

Check if configuration key exists

#### Parameters

##### key

`string`

Configuration key path

#### Returns

`boolean`

#### Implementation of

[`ConfigurationProvider`](../interfaces/ConfigurationProvider.md).[`has`](../interfaces/ConfigurationProvider.md#has)
