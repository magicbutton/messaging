import type { MessageContext, EventPayload, RequestPayload, ResponsePayload } from "./types"

/**
 * Log level enum
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, context?: Record<string, any>): void
  info(message: string, context?: Record<string, any>): void
  warn(message: string, context?: Record<string, any>): void
  error(message: string, error?: Error, context?: Record<string, any>): void
}

/**
 * Metrics interface
 */
export interface Metrics {
  increment(name: string, value?: number, tags?: Record<string, string>): void
  gauge(name: string, value: number, tags?: Record<string, string>): void
  histogram(name: string, value: number, tags?: Record<string, string>): void
  timing(name: string, value: number, tags?: Record<string, string>): void
}

/**
 * Tracing span interface
 */
export interface Span {
  setTag(key: string, value: string | number | boolean): this
  setError(error: Error): this
  finish(): void
}

/**
 * Tracer interface
 */
export interface Tracer {
  startSpan(name: string, options?: { childOf?: Span }): Span
  inject(span: Span, format: string, carrier: unknown): void
  extract(format: string, carrier: unknown): Span | null
}

/**
 * Observability provider interface
 */
export interface ObservabilityProvider {
  getLogger(name: string): Logger
  getMetrics(): Metrics
  getTracer(name: string): Tracer
}

/**
 * Default console logger implementation
 */
export class ConsoleLogger implements Logger {
  private name: string
  private logLevel: LogLevel

  constructor(name: string, logLevel: LogLevel = LogLevel.INFO) {
    this.name = name
    this.logLevel = logLevel
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel)
    return levels.indexOf(level) >= levels.indexOf(this.logLevel)
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ""
    return `[${timestamp}] [${level.toUpperCase()}] [${this.name}] ${message}${contextStr}`
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context))
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, context))
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context))
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = error 
        ? { ...context, error: { message: error.message, stack: error.stack } }
        : context
      console.error(this.formatMessage(LogLevel.ERROR, message, errorContext))
    }
  }
}

/**
 * No-op implementation of metrics
 */
export class NoopMetrics implements Metrics {
  increment(name: string, value?: number, tags?: Record<string, string>): void {}
  gauge(name: string, value: number, tags?: Record<string, string>): void {}
  histogram(name: string, value: number, tags?: Record<string, string>): void {}
  timing(name: string, value: number, tags?: Record<string, string>): void {}
}

/**
 * No-op span implementation
 */
export class NoopSpan implements Span {
  setTag(key: string, value: string | number | boolean): this {
    return this
  }

  setError(error: Error): this {
    return this
  }

  finish(): void {}
}

/**
 * No-op tracer implementation
 */
export class NoopTracer implements Tracer {
  startSpan(name: string, options?: { childOf?: Span }): Span {
    return new NoopSpan()
  }

  inject(span: Span, format: string, carrier: unknown): void {}

  extract(format: string, carrier: unknown): Span | null {
    return null
  }
}

/**
 * Default observability provider implementation
 */
export class DefaultObservabilityProvider implements ObservabilityProvider {
  private loggers: Map<string, Logger> = new Map()
  private metrics: Metrics = new NoopMetrics()
  private tracers: Map<string, Tracer> = new Map()
  private defaultLogLevel: LogLevel

  constructor(defaultLogLevel: LogLevel = LogLevel.INFO) {
    this.defaultLogLevel = defaultLogLevel
  }

  getLogger(name: string): Logger {
    if (!this.loggers.has(name)) {
      this.loggers.set(name, new ConsoleLogger(name, this.defaultLogLevel))
    }
    return this.loggers.get(name)!
  }

  getMetrics(): Metrics {
    return this.metrics
  }

  getTracer(name: string): Tracer {
    if (!this.tracers.has(name)) {
      this.tracers.set(name, new NoopTracer())
    }
    return this.tracers.get(name)!
  }

  // Allow setting custom implementation of these interfaces
  setLogger(name: string, logger: Logger): void {
    this.loggers.set(name, logger)
  }

  setMetrics(metrics: Metrics): void {
    this.metrics = metrics
  }

  setTracer(name: string, tracer: Tracer): void {
    this.tracers.set(name, tracer)
  }
}

// Global instance - can be replaced with more sophisticated implementation
let globalObservabilityProvider: ObservabilityProvider = new DefaultObservabilityProvider()

/**
 * Set the global observability provider
 * @param provider The provider to use
 */
export function setObservabilityProvider(provider: ObservabilityProvider): void {
  globalObservabilityProvider = provider
}

/**
 * Get the global observability provider
 */
export function getObservabilityProvider(): ObservabilityProvider {
  return globalObservabilityProvider
}

/**
 * Create message context with tracing information
 * @param context Existing context to extend
 * @param spanName Name for the span
 * @returns Augmented message context with tracing info
 */
export function createTracedContext(
  context: Partial<MessageContext> = {}, 
  spanName: string
): MessageContext {
  const tracer = getObservabilityProvider().getTracer("messaging")
  let parentSpan: Span | null = null
  
  // Try to extract parent span from existing context
  if (context.traceId && context.spanId) {
    const carrier = {
      "trace-id": context.traceId,
      "span-id": context.spanId,
      "parent-id": context.parentSpanId,
    }
    parentSpan = tracer.extract("text_map", carrier)
  }
  
  const span = tracer.startSpan(spanName, parentSpan ? { childOf: parentSpan } : undefined)
  
  // Generate IDs if not present
  const traceId = context.traceId || generateId()
  const spanId = generateId()
  
  span.setTag("trace.id", traceId)
  span.setTag("span.id", spanId)
  
  if (context.spanId) {
    span.setTag("parent.id", context.spanId)
  }
  
  // Include metadata from context
  if (context.metadata) {
    for (const [key, value] of Object.entries(context.metadata)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        span.setTag(key, value)
      }
    }
  }
  
  return {
    id: context.id || generateId(),
    timestamp: context.timestamp || Date.now(),
    source: context.source,
    target: context.target,
    auth: context.auth,
    metadata: {
      ...context.metadata,
      span, // Include the span in metadata so it can be finished later
    },
    traceId,
    spanId,
    parentSpanId: context.spanId,
  }
}

/**
 * Log an event with proper tracing
 * @param event Event payload
 */
export function logEvent<T = any>(event: EventPayload<T>): void {
  const logger = getObservabilityProvider().getLogger("events")
  const metrics = getObservabilityProvider().getMetrics()
  
  // Log the event
  logger.info(`Event: ${event.type}`, {
    payload: event.payload,
    context: {
      id: event.context?.id,
      source: event.context?.source,
      target: event.context?.target,
      traceId: event.context?.traceId,
      spanId: event.context?.spanId,
    },
  })
  
  // Record metrics
  metrics.increment("events.count", 1, { type: event.type })
  
  // Finish the span if it exists
  const span = event.context?.metadata?.span as Span | undefined
  if (span) {
    span.setTag("event.type", event.type)
    span.finish()
    
    // Remove span from metadata to avoid circular references
    if (event.context?.metadata) {
      delete event.context.metadata.span
    }
  }
}

/**
 * Log a request with proper tracing
 * @param request Request payload
 */
export function logRequest<T = any>(request: RequestPayload<T>): void {
  const logger = getObservabilityProvider().getLogger("requests")
  const metrics = getObservabilityProvider().getMetrics()
  
  // Log the request
  logger.info(`Request: ${request.type}`, {
    payload: request.payload,
    context: {
      id: request.context?.id,
      source: request.context?.source,
      target: request.context?.target,
      traceId: request.context?.traceId,
      spanId: request.context?.spanId,
    },
  })
  
  // Record metrics
  metrics.increment("requests.count", 1, { type: request.type })
}

/**
 * Log a response with proper tracing
 * @param type Request type
 * @param response Response payload
 * @param startTime Start time for timing calculation
 */
export function logResponse<T = any>(
  type: string, 
  response: ResponsePayload<T>, 
  startTime: number
): void {
  const logger = getObservabilityProvider().getLogger("responses")
  const metrics = getObservabilityProvider().getMetrics()
  const duration = Date.now() - startTime
  
  // Log the response
  if (response.success) {
    logger.info(`Response success: ${type}`, {
      duration,
      context: {
        id: response.context?.id,
        traceId: response.context?.traceId,
        spanId: response.context?.spanId,
      },
    })
  } else {
    logger.warn(`Response error: ${type}`, {
      error: response.error,
      duration,
      context: {
        id: response.context?.id,
        traceId: response.context?.traceId,
        spanId: response.context?.spanId,
      },
    })
  }
  
  // Record metrics
  metrics.timing("requests.duration", duration, { 
    type, 
    success: response.success.toString() 
  })
  
  if (!response.success) {
    metrics.increment("requests.errors", 1, { 
      type, 
      code: response.error?.code || "unknown" 
    })
  }
  
  // Finish the span if it exists
  const span = response.context?.metadata?.span as Span | undefined
  if (span) {
    span.setTag("request.type", type)
    span.setTag("request.success", response.success)
    span.setTag("request.duration", duration)
    
    if (!response.success && response.error) {
      span.setTag("error", true)
      span.setTag("error.code", response.error.code)
      span.setTag("error.message", response.error.message)
    }
    
    span.finish()
    
    // Remove span from metadata to avoid circular references
    if (response.context?.metadata) {
      delete response.context.metadata.span
    }
  }
}

/**
 * Generate a random ID for tracing
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}