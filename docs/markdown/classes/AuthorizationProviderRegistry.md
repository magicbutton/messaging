[**Magic Button Messaging v1.2.0**](../README.md)

***

# Class: AuthorizationProviderRegistry

Authorization provider registry for centralized dependency injection of authorization providers

## Constructors

### Constructor

> **new AuthorizationProviderRegistry**(): `AuthorizationProviderRegistry`

#### Returns

`AuthorizationProviderRegistry`

## Methods

### clearFactories()

> `static` **clearFactories**(): `void`

Clear all registered factories (primarily for testing)

#### Returns

`void`

***

### createAuthorizationProvider()

> `static` **createAuthorizationProvider**\<`TContract`\>(`config`): [`AuthorizationProvider`](../type-aliases/AuthorizationProvider.md)\<`TContract`\>

Create an authorization provider instance with the specified configuration

#### Type Parameters

##### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

#### Parameters

##### config

[`AuthorizationProviderConfig`](../interfaces/AuthorizationProviderConfig.md)\<`TContract`\>

The authorization provider configuration

#### Returns

[`AuthorizationProvider`](../type-aliases/AuthorizationProvider.md)\<`TContract`\>

An authorization provider instance

***

### hasFactory()

> `static` **hasFactory**(`type`): `boolean`

Check if an authorization provider type is registered

#### Parameters

##### type

`string`

The authorization provider type to check

#### Returns

`boolean`

***

### registerFactory()

> `static` **registerFactory**\<`TContract`\>(`type`, `factory`): `void`

Register an authorization provider factory

#### Type Parameters

##### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

#### Parameters

##### type

`string`

The authorization provider type identifier

##### factory

[`AuthorizationProviderFactory`](../interfaces/AuthorizationProviderFactory.md)\<`TContract`\>

The factory implementation

#### Returns

`void`
