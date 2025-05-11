[**Magic Button Messaging v1.1.2**](../README.md)

***

# Class: DefaultAuthorizationProviderFactory\<TContract\>

Factory for creating DefaultAuthorizationProvider instances

## Type Parameters

### TContract

`TContract` *extends* [`Contract`](../type-aliases/Contract.md)

## Implements

- [`AuthorizationProviderFactory`](../interfaces/AuthorizationProviderFactory.md)\<`TContract`\>

## Constructors

### Constructor

> **new DefaultAuthorizationProviderFactory**\<`TContract`\>(): `DefaultAuthorizationProviderFactory`\<`TContract`\>

#### Returns

`DefaultAuthorizationProviderFactory`\<`TContract`\>

## Methods

### createAuthorizationProvider()

> **createAuthorizationProvider**(`config`): [`AuthorizationProvider`](../type-aliases/AuthorizationProvider.md)\<`TContract`\>

Create a DefaultAuthorizationProvider instance

#### Parameters

##### config

[`AuthorizationProviderConfig`](../interfaces/AuthorizationProviderConfig.md)\<`TContract`\>

The factory configuration

#### Returns

[`AuthorizationProvider`](../type-aliases/AuthorizationProvider.md)\<`TContract`\>

#### Implementation of

[`AuthorizationProviderFactory`](../interfaces/AuthorizationProviderFactory.md).[`createAuthorizationProvider`](../interfaces/AuthorizationProviderFactory.md#createauthorizationprovider)
