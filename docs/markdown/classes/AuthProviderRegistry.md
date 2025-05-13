[**Magic Button Messaging v1.1.3**](../README.md)

***

# Class: AuthProviderRegistry

Auth provider registry for centralized dependency injection of auth providers

## Constructors

### Constructor

> **new AuthProviderRegistry**(): `AuthProviderRegistry`

#### Returns

`AuthProviderRegistry`

## Methods

### clearFactories()

> `static` **clearFactories**(): `void`

Clear all registered factories (primarily for testing)

#### Returns

`void`

***

### createAuthProvider()

> `static` **createAuthProvider**(`config`): [`IAuthProvider`](../interfaces/IAuthProvider.md)

Create an auth provider instance with the specified configuration

#### Parameters

##### config

[`AuthProviderConfig`](../interfaces/AuthProviderConfig.md)

The auth provider configuration

#### Returns

[`IAuthProvider`](../interfaces/IAuthProvider.md)

An auth provider instance

***

### hasFactory()

> `static` **hasFactory**(`type`): `boolean`

Check if an auth provider type is registered

#### Parameters

##### type

`string`

The auth provider type to check

#### Returns

`boolean`

***

### registerFactory()

> `static` **registerFactory**(`type`, `factory`): `void`

Register an auth provider factory

#### Parameters

##### type

`string`

The auth provider type identifier

##### factory

[`AuthProviderFactory`](../interfaces/AuthProviderFactory.md)

The factory implementation

#### Returns

`void`
