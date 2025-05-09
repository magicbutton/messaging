import { getObservabilityProvider } from "./observability"

/**
 * Error code types
 */
export enum ErrorType {
  // System errors
  SYSTEM = "system",
  TRANSPORT = "transport",
  CONNECTION = "connection",
  TIMEOUT = "timeout",
  
  // Validation errors
  VALIDATION = "validation",
  SCHEMA = "schema",
  
  // Authorization errors
  AUTH = "auth",
  PERMISSION = "permission",
  
  // Request/response errors
  REQUEST = "request",
  RESPONSE = "response",
  
  // State errors
  STATE = "state",
  
  // Business logic errors
  BUSINESS = "business",
  
  // Unknown errors
  UNKNOWN = "unknown"
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  // Informational, operation can continue
  INFO = "info",
  
  // Warning, operation can continue but might have issues
  WARNING = "warning",
  
  // Error, operation failed but system can continue
  ERROR = "error",
  
  // Critical, system might be in an unstable state
  CRITICAL = "critical",
  
  // Fatal, system cannot continue
  FATAL = "fatal"
}

/**
 * Error metadata
 */
export interface ErrorMetadata {
  // Error type
  type: ErrorType
  
  // Error severity
  severity: ErrorSeverity
  
  // HTTP status code equivalent (useful for REST transport)
  statusCode?: number
  
  // Retry information
  retry?: {
    // Whether the operation can be retried
    retryable: boolean
    
    // Suggested delay before retry in milliseconds
    delayMs?: number
    
    // Maximum number of retries suggested
    maxRetries?: number
  }
  
  // Additional metadata
  [key: string]: any
}

/**
 * Error code definition
 */
export interface ErrorDefinition {
  // Error code (e.g., "connection_failed")
  code: string
  
  // Human-readable error message template
  message: string
  
  // Error metadata
  metadata: ErrorMetadata
}

/**
 * Messaging error class
 */
export class MessagingError extends Error {
  readonly code: string
  readonly metadata: ErrorMetadata
  readonly details?: any
  readonly cause?: Error
  readonly timestamp: number
  
  constructor(
    definition: ErrorDefinition,
    options: {
      // Error details specific to this instance
      details?: any,
      
      // Error that caused this error
      cause?: Error,
      
      // Parameters for message template
      params?: Record<string, string | number | boolean>
    } = {}
  ) {
    // Format message with parameters if provided
    const message = options.params
      ? formatMessage(definition.message, options.params)
      : definition.message
    
    super(message)
    
    this.name = "MessagingError"
    this.code = definition.code
    this.metadata = definition.metadata
    this.details = options.details
    this.cause = options.cause
    this.timestamp = Date.now()
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MessagingError)
    }
    
    // Log error automatically
    this.logError()
  }
  
  /**
   * Log the error using the observability provider
   */
  private logError(): void {
    const logger = getObservabilityProvider().getLogger("errors")
    
    // Determine log level based on severity
    switch (this.metadata.severity) {
      case ErrorSeverity.INFO:
        logger.info(`${this.code}: ${this.message}`, { 
          error: this.toJSON() 
        })
        break
      case ErrorSeverity.WARNING:
        logger.warn(`${this.code}: ${this.message}`, { 
          error: this.toJSON() 
        })
        break
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.FATAL:
        logger.error(`${this.code}: ${this.message}`, this, { 
          error: this.toJSON() 
        })
        break
    }
  }
  
  /**
   * Convert to a plain object for serialization
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      metadata: this.metadata,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
      cause: this.cause instanceof Error 
        ? {
            name: this.cause.name,
            message: this.cause.message,
            stack: this.cause.stack
          }
        : this.cause
    }
  }
  
  /**
   * Convert to a response error format
   */
  toResponseError(): {
    code: string
    message: string
    details?: any
  } {
    return {
      code: this.code,
      message: this.message,
      details: this.details
    }
  }
  
  /**
   * Check if error is of a specific type
   */
  isType(type: ErrorType): boolean {
    return this.metadata.type === type
  }
  
  /**
   * Check if error has at least the specified severity
   */
  hasSeverity(severity: ErrorSeverity): boolean {
    const severities = [
      ErrorSeverity.INFO,
      ErrorSeverity.WARNING,
      ErrorSeverity.ERROR,
      ErrorSeverity.CRITICAL,
      ErrorSeverity.FATAL
    ]
    
    const currentIndex = severities.indexOf(this.metadata.severity)
    const requiredIndex = severities.indexOf(severity)
    
    return currentIndex >= requiredIndex
  }
  
  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.metadata.retry?.retryable === true
  }
  
  /**
   * Get suggested retry delay
   */
  getRetryDelay(): number {
    return this.metadata.retry?.delayMs || 1000
  }
  
  /**
   * Get maximum retries
   */
  getMaxRetries(): number {
    return this.metadata.retry?.maxRetries || 3
  }
}

/**
 * Error registry for managing error definitions
 */
export class ErrorRegistry {
  private errors: Map<string, ErrorDefinition> = new Map()
  
  /**
   * Register an error definition
   */
  register(definition: ErrorDefinition): this {
    if (this.errors.has(definition.code)) {
      console.warn(`Error code '${definition.code}' is already registered and will be overwritten`)
    }
    
    this.errors.set(definition.code, definition)
    return this
  }
  
  /**
   * Register multiple error definitions
   */
  registerMany(definitions: ErrorDefinition[]): this {
    for (const definition of definitions) {
      this.register(definition)
    }
    return this
  }
  
  /**
   * Get an error definition by code
   */
  getDefinition(code: string): ErrorDefinition | undefined {
    return this.errors.get(code)
  }
  
  /**
   * Create an error instance from a registered error code
   */
  createError(
    code: string,
    options: {
      details?: any,
      cause?: Error,
      params?: Record<string, string | number | boolean>
    } = {}
  ): MessagingError {
    const definition = this.errors.get(code)
    
    if (!definition) {
      // Create a generic error if the code is not registered
      return new MessagingError({
        code: "unknown_error",
        message: `Unknown error code: ${code}`,
        metadata: {
          type: ErrorType.UNKNOWN,
          severity: ErrorSeverity.ERROR
        }
      }, {
        details: {
          requestedCode: code,
          ...options.details
        },
        cause: options.cause
      })
    }
    
    return new MessagingError(definition, options)
  }
  
  /**
   * Get all registered error codes
   */
  getAllCodes(): string[] {
    return Array.from(this.errors.keys())
  }
}

// Create a global error registry
const globalErrorRegistry = new ErrorRegistry()

/**
 * Get the global error registry
 */
export function getErrorRegistry(): ErrorRegistry {
  return globalErrorRegistry
}

/**
 * Register system errors
 */
export function registerSystemErrors(registry: ErrorRegistry = globalErrorRegistry): ErrorRegistry {
  return registry.registerMany([
    // Connection errors
    {
      code: "connection_failed",
      message: "Failed to establish connection to {target}",
      metadata: {
        type: ErrorType.CONNECTION,
        severity: ErrorSeverity.ERROR,
        statusCode: 503,
        retry: {
          retryable: true,
          delayMs: 1000,
          maxRetries: 5
        }
      }
    },
    {
      code: "connection_timeout",
      message: "Connection to {target} timed out after {timeoutMs}ms",
      metadata: {
        type: ErrorType.TIMEOUT,
        severity: ErrorSeverity.ERROR,
        statusCode: 504,
        retry: {
          retryable: true,
          delayMs: 2000,
          maxRetries: 3
        }
      }
    },
    {
      code: "connection_closed",
      message: "Connection was closed unexpectedly",
      metadata: {
        type: ErrorType.CONNECTION,
        severity: ErrorSeverity.WARNING,
        statusCode: 500,
        retry: {
          retryable: true,
          delayMs: 1000,
          maxRetries: 3
        }
      }
    },
    
    // Transport errors
    {
      code: "transport_error",
      message: "Transport error: {details}",
      metadata: {
        type: ErrorType.TRANSPORT,
        severity: ErrorSeverity.ERROR,
        statusCode: 500,
        retry: {
          retryable: false
        }
      }
    },
    {
      code: "transport_not_supported",
      message: "Transport {transport} is not supported",
      metadata: {
        type: ErrorType.TRANSPORT,
        severity: ErrorSeverity.ERROR,
        statusCode: 400,
        retry: {
          retryable: false
        }
      }
    },
    
    // Request/response errors
    {
      code: "request_timeout",
      message: "Request {requestId} timed out after {timeoutMs}ms",
      metadata: {
        type: ErrorType.TIMEOUT,
        severity: ErrorSeverity.WARNING,
        statusCode: 504,
        retry: {
          retryable: true,
          delayMs: 2000,
          maxRetries: 2
        }
      }
    },
    {
      code: "request_failed",
      message: "Request {requestType} failed: {reason}",
      metadata: {
        type: ErrorType.REQUEST,
        severity: ErrorSeverity.ERROR,
        statusCode: 500,
        retry: {
          retryable: true,
          delayMs: 1000,
          maxRetries: 3
        }
      }
    },
    {
      code: "invalid_response",
      message: "Received invalid response from {source}",
      metadata: {
        type: ErrorType.RESPONSE,
        severity: ErrorSeverity.ERROR,
        statusCode: 502,
        retry: {
          retryable: false
        }
      }
    },
    
    // Validation errors
    {
      code: "schema_validation_failed",
      message: "Schema validation failed for {schemaType}",
      metadata: {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.ERROR,
        statusCode: 400,
        retry: {
          retryable: false
        }
      }
    },
    {
      code: "invalid_message_format",
      message: "Invalid message format",
      metadata: {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.ERROR,
        statusCode: 400,
        retry: {
          retryable: false
        }
      }
    },
    
    // Authentication errors
    {
      code: "authentication_failed",
      message: "Authentication failed",
      metadata: {
        type: ErrorType.AUTH,
        severity: ErrorSeverity.ERROR,
        statusCode: 401,
        retry: {
          retryable: false
        }
      }
    },
    {
      code: "token_expired",
      message: "Authentication token has expired",
      metadata: {
        type: ErrorType.AUTH,
        severity: ErrorSeverity.WARNING,
        statusCode: 401,
        retry: {
          retryable: true,
          delayMs: 0, // Immediate retry after getting a new token
          maxRetries: 1
        }
      }
    },
    {
      code: "insufficient_permissions",
      message: "Insufficient permissions to {action}",
      metadata: {
        type: ErrorType.PERMISSION,
        severity: ErrorSeverity.ERROR,
        statusCode: 403,
        retry: {
          retryable: false
        }
      }
    },
    
    // State errors
    {
      code: "not_connected",
      message: "Client is not connected",
      metadata: {
        type: ErrorType.STATE,
        severity: ErrorSeverity.ERROR,
        statusCode: 400,
        retry: {
          retryable: false
        }
      }
    },
    {
      code: "already_connected",
      message: "Client is already connected",
      metadata: {
        type: ErrorType.STATE,
        severity: ErrorSeverity.WARNING,
        statusCode: 400,
        retry: {
          retryable: false
        }
      }
    },
    
    // System errors
    {
      code: "system_error",
      message: "System error: {details}",
      metadata: {
        type: ErrorType.SYSTEM,
        severity: ErrorSeverity.CRITICAL,
        statusCode: 500,
        retry: {
          retryable: false
        }
      }
    },
    {
      code: "resource_exhausted",
      message: "Resource {resource} exhausted",
      metadata: {
        type: ErrorType.SYSTEM,
        severity: ErrorSeverity.ERROR,
        statusCode: 429,
        retry: {
          retryable: true,
          delayMs: 5000,
          maxRetries: 3
        }
      }
    },
    {
      code: "rate_limited",
      message: "Rate limit exceeded for {operation}. Try again in {retryAfterMs}ms",
      metadata: {
        type: ErrorType.SYSTEM,
        severity: ErrorSeverity.WARNING,
        statusCode: 429,
        retry: {
          retryable: true,
          delayMs: 1000,
          maxRetries: 5
        }
      }
    }
  ])
}

/**
 * Error handling utilities
 */

/**
 * Format a message template with parameters
 */
function formatMessage(
  template: string,
  params: Record<string, string | number | boolean>
): string {
  return template.replace(/{(\w+)}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match
  })
}

/**
 * Error handling decorator for async methods
 */
export function handleErrors<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler: (error: any) => Promise<R> | R
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      return errorHandler(error)
    }
  }
}

/**
 * Convert any error to a MessagingError
 */
export function toMessagingError(error: any, defaultCode = "unknown_error"): MessagingError {
  if (error instanceof MessagingError) {
    return error
  }
  
  const registry = getErrorRegistry()
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  return registry.createError(defaultCode, {
    details: error instanceof Error ? {
      name: error.name,
      stack: error.stack
    } : { rawError: error },
    cause: error instanceof Error ? error : undefined,
    params: { details: errorMessage }
  })
}

/**
 * Try to execute a function, returning a result or error
 */
export async function tryCatch<T>(
  fn: () => Promise<T> | T
): Promise<{ success: true; result: T } | { success: false; error: MessagingError }> {
  try {
    const result = await fn()
    return { success: true, result }
  } catch (error) {
    return { 
      success: false, 
      error: toMessagingError(error)
    }
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number,
    initialDelayMs?: number,
    maxDelayMs?: number,
    backoffFactor?: number,
    retryIf?: (error: any) => boolean
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3
  const initialDelayMs = options.initialDelayMs ?? 1000
  const maxDelayMs = options.maxDelayMs ?? 30000
  const backoffFactor = options.backoffFactor ?? 2
  const retryIf = options.retryIf ?? ((error) => {
    if (error instanceof MessagingError) {
      return error.isRetryable()
    }
    return true
  })
  
  let lastError: any
  let delayMs = initialDelayMs
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries || !retryIf(error)) {
        break
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs))
      
      // Increase delay for next attempt (with max limit)
      delayMs = Math.min(delayMs * backoffFactor, maxDelayMs)
    }
  }
  
  throw toMessagingError(lastError, "retry_failed")
}

// Register system errors by default
registerSystemErrors()