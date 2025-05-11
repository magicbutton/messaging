import { Contract, ErrorDefinition, ErrorSeverity } from "./types"

/**
 * Error types for categorizing system errors
 */
export enum ErrorType {
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  CONNECTION = "connection",
  TIMEOUT = "timeout",
  NOT_FOUND = "not_found",
  CONFLICT = "conflict",
  SERVER = "server",
  CLIENT = "client",
  UNEXPECTED = "unexpected"
}

/**
 * Messaging error that includes error code and metadata
 */
export class MessagingError extends Error {
  readonly code: string
  readonly severity: ErrorSeverity
  readonly type: ErrorType
  readonly retryable: boolean
  readonly metadata: Record<string, unknown>

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    type: ErrorType = ErrorType.UNEXPECTED,
    retryable: boolean = false,
    metadata: Record<string, unknown> = {}
  ) {
    super(message)
    this.name = "MessagingError"
    this.code = code
    this.severity = severity
    this.type = type
    this.retryable = retryable
    this.metadata = metadata
  }

  /**
   * Convert the error to a plain object for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      type: this.type,
      retryable: this.retryable,
      metadata: this.metadata,
      stack: this.stack
    }
  }
}

/**
 * Error registry that stores error definitions and allows creating error instances
 */
export class ErrorRegistry<TContract extends Contract> {
  private errorDefinitions: Map<string, ErrorDefinition> = new Map()
  
  /**
   * Create a new error registry with predefined system errors and contract errors
   */
  constructor(contract: TContract) {
    // Register system errors
    this.registerSystemErrors()
    
    // Register contract errors
    this.registerContractErrors(contract)
  }
  
  /**
   * Register system error definitions
   */
  private registerSystemErrors(): void {
    this.register({
      code: "system.validation_error",
      message: "Validation error",
      severity: ErrorSeverity.ERROR,
      retryable: false
    })
    
    this.register({
      code: "system.authentication_error",
      message: "Authentication error",
      severity: ErrorSeverity.ERROR,
      retryable: true
    })
    
    this.register({
      code: "system.authorization_error",
      message: "Authorization error",
      severity: ErrorSeverity.ERROR,
      retryable: false
    })
    
    this.register({
      code: "system.connection_error",
      message: "Connection error",
      severity: ErrorSeverity.ERROR,
      retryable: true
    })
    
    this.register({
      code: "system.timeout_error",
      message: "Timeout error",
      severity: ErrorSeverity.WARNING,
      retryable: true
    })
    
    this.register({
      code: "system.not_found_error",
      message: "Resource not found",
      severity: ErrorSeverity.ERROR,
      retryable: false
    })
    
    this.register({
      code: "system.conflict_error",
      message: "Resource conflict",
      severity: ErrorSeverity.ERROR,
      retryable: false
    })
    
    this.register({
      code: "system.server_error",
      message: "Server error",
      severity: ErrorSeverity.ERROR,
      retryable: true
    })
    
    this.register({
      code: "system.client_error",
      message: "Client error",
      severity: ErrorSeverity.ERROR,
      retryable: false
    })
    
    this.register({
      code: "system.unexpected_error",
      message: "Unexpected error",
      severity: ErrorSeverity.CRITICAL,
      retryable: false
    })
  }
  
  /**
   * Register contract error definitions
   */
  private registerContractErrors(contract: TContract): void {
    Object.entries(contract.errors).forEach(([code, definition]) => {
      this.register(definition)
    })
  }
  
  /**
   * Register an error definition
   */
  register(definition: ErrorDefinition): void {
    this.errorDefinitions.set(definition.code, definition)
  }
  
  /**
   * Create an error instance from an error code
   * @param code The error code
   * @param message Optional custom message (overrides the default)
   * @param metadata Optional metadata to attach to the error
   */
  createError(code: string, message?: string, metadata: Record<string, unknown> = {}): MessagingError {
    const definition = this.errorDefinitions.get(code)
    
    if (!definition) {
      return new MessagingError(
        message || `Unknown error: ${code}`,
        code,
        ErrorSeverity.ERROR,
        ErrorType.UNEXPECTED,
        false,
        metadata
      )
    }
    
    return new MessagingError(
      message || definition.message,
      definition.code,
      definition.severity,
      this.mapErrorType(definition.code),
      definition.retryable || false,
      { ...definition.metadata, ...metadata }
    )
  }
  
  /**
   * Map error code to error type
   */
  private mapErrorType(code: string): ErrorType {
    if (code.includes("validation")) return ErrorType.VALIDATION
    if (code.includes("auth")) return ErrorType.AUTHENTICATION
    if (code.includes("permission")) return ErrorType.AUTHORIZATION
    if (code.includes("connect")) return ErrorType.CONNECTION
    if (code.includes("timeout")) return ErrorType.TIMEOUT
    if (code.includes("not_found")) return ErrorType.NOT_FOUND
    if (code.includes("conflict")) return ErrorType.CONFLICT
    if (code.includes("server")) return ErrorType.SERVER
    if (code.includes("client")) return ErrorType.CLIENT
    return ErrorType.UNEXPECTED
  }
  
  /**
   * Get all registered error definitions
   */
  getErrorDefinitions(): Map<string, ErrorDefinition> {
    return new Map(this.errorDefinitions)
  }
  
  /**
   * Check if an error code is registered
   */
  hasError(code: string): boolean {
    return this.errorDefinitions.has(code)
  }
  
  /**
   * Convert any error to a MessagingError
   */
  toMessagingError(error: unknown, defaultCode = "system.unexpected_error"): MessagingError {
    if (error instanceof MessagingError) {
      return error
    }
    
    if (error instanceof Error) {
      return this.createError(
        defaultCode,
        error.message,
        { originalStack: error.stack }
      )
    }
    
    return this.createError(
      defaultCode,
      typeof error === "string" ? error : "Unknown error",
      { originalError: error }
    )
  }
}

/**
 * Retry function that handles retryable errors
 * @param fn The function to retry
 * @param options Retry options
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    retryMultiplier?: number;
    shouldRetry?: (error: unknown) => boolean;
    onRetry?: (error: unknown, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 500,
    retryMultiplier = 1.5,
    shouldRetry = (error) => error instanceof MessagingError && error.retryable,
    onRetry = () => {}
  } = options
  
  let lastError: unknown
  let delay = retryDelay
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error
      }
      
      onRetry(error, attempt + 1)
      
      await new Promise(resolve => setTimeout(resolve, delay))
      delay = Math.floor(delay * retryMultiplier)
    }
  }
  
  // This should never happen, but TypeScript needs it
  throw lastError
}

/**
 * Error handling utility for standardized error processing
 */
export async function handleErrors<T>(
  fn: () => Promise<T>,
  options: {
    errorRegistry: ErrorRegistry<any>;
    defaultErrorCode?: string;
    onError?: (error: MessagingError) => void;
  }
): Promise<T> {
  const {
    errorRegistry,
    defaultErrorCode = "system.unexpected_error",
    onError = () => {}
  } = options
  
  try {
    return await fn()
  } catch (error) {
    const messagingError = errorRegistry.toMessagingError(error, defaultErrorCode)
    onError(messagingError)
    throw messagingError
  }
}