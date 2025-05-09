import {
  ErrorRegistry,
  ErrorType,
  ErrorSeverity,
  MessagingError,
  getErrorRegistry,
  handleErrors,
  toMessagingError,
  tryCatch,
  retry
} from "../errors"
import { LogLevel, DefaultObservabilityProvider, setObservabilityProvider } from "../observability"

// Set up observability
const observabilityProvider = new DefaultObservabilityProvider(LogLevel.DEBUG)
setObservabilityProvider(observabilityProvider)

// Get logger for this example
const logger = observabilityProvider.getLogger("error-handling-example")

// Create business-specific error registry
const orderErrorRegistry = new ErrorRegistry()

// Register custom business errors
orderErrorRegistry.registerMany([
  {
    code: "order_not_found",
    message: "Order with ID {orderId} not found",
    metadata: {
      type: ErrorType.BUSINESS,
      severity: ErrorSeverity.ERROR,
      statusCode: 404,
      retry: {
        retryable: false
      }
    }
  },
  {
    code: "insufficient_inventory",
    message: "Insufficient inventory for product {productId}. Requested: {requested}, Available: {available}",
    metadata: {
      type: ErrorType.BUSINESS,
      severity: ErrorSeverity.ERROR,
      statusCode: 400,
      businessImpact: "medium",
      retry: {
        retryable: false
      }
    }
  },
  {
    code: "payment_processing_failed",
    message: "Payment processing failed: {reason}",
    metadata: {
      type: ErrorType.BUSINESS,
      severity: ErrorSeverity.ERROR,
      statusCode: 400,
      businessImpact: "high",
      retry: {
        retryable: true,
        delayMs: 5000,
        maxRetries: 3
      }
    }
  }
])

// Mock inventory database
const inventory: Record<string, number> = {
  "product-1": 10,
  "product-2": 0,
  "product-3": 5
}

// Mock order repository
class OrderRepository {
  private orders: Record<string, any> = {}
  
  async findOrder(orderId: string): Promise<any> {
    // Simulate database lookup
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const order = this.orders[orderId]
        if (!order) {
          // Create domain-specific error
          const error = orderErrorRegistry.createError("order_not_found", {
            params: { orderId }
          })
          reject(error)
        } else {
          resolve(order)
        }
      }, 100)
    })
  }
  
  async createOrder(orderData: any): Promise<string> {
    // Simulate order creation
    return new Promise((resolve) => {
      setTimeout(() => {
        const orderId = `order-${Math.random().toString(36).substring(2, 10)}`
        this.orders[orderId] = {
          id: orderId,
          ...orderData,
          status: "created",
          createdAt: new Date()
        }
        resolve(orderId)
      }, 100)
    })
  }
}

// Mock payment gateway
class PaymentGateway {
  async processPayment(amount: number): Promise<string> {
    // Simulate payment processing with occasional failures
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.5) {
          // Simulate successful payment
          resolve(`payment-${Math.random().toString(36).substring(2, 10)}`)
        } else {
          // Simulate payment failure
          const error = orderErrorRegistry.createError("payment_processing_failed", {
            params: { reason: "Gateway connection timed out" }
          })
          reject(error)
        }
      }, 200)
    })
  }
}

// Order service using error handling patterns
class OrderService {
  private orderRepo: OrderRepository
  private paymentGateway: PaymentGateway
  
  constructor() {
    this.orderRepo = new OrderRepository()
    this.paymentGateway = new PaymentGateway()
  }
  
  /**
   * Get order by ID with error handling
   */
  async getOrder(orderId: string): Promise<any> {
    try {
      return await this.orderRepo.findOrder(orderId)
    } catch (error) {
      // Rethrow MessagingErrors directly
      if (error instanceof MessagingError) {
        throw error
      }
      
      // Convert other errors to MessagingError
      throw toMessagingError(error, "request_failed")
    }
  }
  
  /**
   * Check inventory with error handling
   */
  async checkInventory(productId: string, quantity: number): Promise<void> {
    const available = inventory[productId] || 0
    
    if (available < quantity) {
      throw orderErrorRegistry.createError("insufficient_inventory", {
        params: {
          productId,
          requested: String(quantity),
          available: String(available)
        }
      })
    }
  }
  
  /**
   * Process payment with retry
   */
  async processPayment(amount: number): Promise<string> {
    // Use retry utility for operations that might fail transiently
    return retry(
      async () => this.paymentGateway.processPayment(amount),
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        backoffFactor: 2,
        // Only retry if it's a retryable error
        retryIf: (error) => {
          if (error instanceof MessagingError) {
            return error.isRetryable()
          }
          return false
        }
      }
    )
  }
  
  /**
   * Create order with try/catch pattern
   */
  async createOrder(orderData: any): Promise<any> {
    const result = await tryCatch(async () => {
      // Check inventory first
      await this.checkInventory(orderData.productId, orderData.quantity)
      
      // Process payment
      const paymentId = await this.processPayment(orderData.amount)
      
      // Create order
      const orderId = await this.orderRepo.createOrder({
        ...orderData,
        paymentId
      })
      
      // Return the created order
      return this.getOrder(orderId)
    })
    
    if (result.success) {
      return result.result
    } else {
      // Handle specific error types
      if (result.error.isType(ErrorType.BUSINESS)) {
        // Handle business errors specifically
        logger.warn(`Business rule violation: ${result.error.message}`, {
          code: result.error.code,
          details: result.error.details
        })
      }
      
      throw result.error
    }
  }
  
  /**
   * Process order with decorator pattern
   */
  processOrder = handleErrors(
    async (orderData: any) => {
      logger.info("Processing order", { orderData })
      
      // Create the order (which has its own error handling)
      const order = await this.createOrder(orderData)
      
      logger.info("Order processed successfully", { orderId: order.id })
      return order
    },
    (error) => {
      // Convert to messaging error if needed
      const messagingError = toMessagingError(error)
      
      // Log based on severity
      if (messagingError.hasSeverity(ErrorSeverity.ERROR)) {
        logger.error("Order processing failed", messagingError)
      } else {
        logger.warn("Order processing issue", { 
          message: messagingError.message,
          code: messagingError.code
        })
      }
      
      // Return error result
      return {
        success: false,
        error: messagingError.toResponseError()
      }
    }
  )
}

// Demonstrate error handling
async function demonstrateErrorHandling() {
  logger.info("Starting error handling demonstration")
  
  const orderService = new OrderService()
  
  // Scenario 1: Order not found
  logger.info("Scenario 1: Attempting to get non-existent order")
  try {
    await orderService.getOrder("non-existent-order")
  } catch (error) {
    if (error instanceof MessagingError) {
      logger.info("Received expected error", { 
        code: error.code, 
        message: error.message, 
        isRetryable: error.isRetryable() 
      })
    }
  }
  
  // Scenario 2: Insufficient inventory
  logger.info("Scenario 2: Ordering product with insufficient inventory")
  try {
    await orderService.createOrder({
      productId: "product-2", // Has 0 inventory
      quantity: 5,
      amount: 100
    })
  } catch (error) {
    if (error instanceof MessagingError) {
      logger.info("Received expected error", { 
        code: error.code, 
        message: error.message, 
        isRetryable: error.isRetryable() 
      })
    }
  }
  
  // Scenario 3: Successful order with retry for payment
  logger.info("Scenario 3: Creating order with retry for payment")
  try {
    const order = await orderService.createOrder({
      productId: "product-1", // Has 10 inventory
      quantity: 2,
      amount: 50
    })
    
    logger.info("Order created successfully", { order })
  } catch (error) {
    logger.error("Unexpected error in scenario 3", error)
  }
  
  // Scenario 4: Using the error handler decorator
  logger.info("Scenario 4: Using error handler decorator for different cases")
  
  // Case 1: Valid order
  const result1 = await orderService.processOrder({
    productId: "product-3",
    quantity: 1,
    amount: 25
  })
  
  logger.info("Processed order result", { result: result1 })
  
  // Case 2: Invalid order (out of stock)
  const result2 = await orderService.processOrder({
    productId: "product-3",
    quantity: 10, // Only 5 available
    amount: 250
  })
  
  logger.info("Processed order result (expected failure)", { result: result2 })
  
  logger.info("Error handling demonstration completed")
}

// Register system errors
// (Note: These are automatically registered in the errors.ts module)

// Run the demonstration
demonstrateErrorHandling().catch(error => {
  console.error("Example failed:", error)
})