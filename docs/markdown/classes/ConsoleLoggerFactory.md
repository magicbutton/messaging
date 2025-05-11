[**Magic Button Messaging v1.1.1**](../README.md)

***

# Class: ConsoleLoggerFactory

Factory for creating console loggers

## Implements

- [`LoggerFactory`](../interfaces/LoggerFactory.md)

## Constructors

### Constructor

> **new ConsoleLoggerFactory**(`defaultLogLevel`): `ConsoleLoggerFactory`

#### Parameters

##### defaultLogLevel

[`LogLevel`](../enumerations/LogLevel.md) = `LogLevel.INFO`

#### Returns

`ConsoleLoggerFactory`

## Methods

### createLogger()

> **createLogger**(`name`, `options?`): [`ConsoleLogger`](ConsoleLogger.md)

Create a logger instance

#### Parameters

##### name

`string`

The logger name

##### options?

`Record`\<`string`, `any`\>

Optional logger configuration

#### Returns

[`ConsoleLogger`](ConsoleLogger.md)

#### Implementation of

[`LoggerFactory`](../interfaces/LoggerFactory.md).[`createLogger`](../interfaces/LoggerFactory.md#createlogger)
