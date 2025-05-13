import { 
  IMessageContext, 
  IRequestPayload, 
  IEventPayload, 
  IResponsePayload 
} from './types';

/**
 * Extended message context with additional fields for middleware
 */
export interface EnhancedMessageContext extends IMessageContext {
  /**
   * Actor ID for the request
   */
  actorId?: string;

  /**
   * Correlation ID for linking related requests
   */
  correlationId?: string;
}

/**
 * Extended request payload with additional fields for middleware
 */
export interface EnhancedRequestPayload<T = any> extends IRequestPayload<T> {
  /**
   * Unique ID for the request
   */
  requestId?: string;
  
  /**
   * Request data
   */
  data?: any;
}

/**
 * Extended event payload with additional fields for middleware
 */
export interface EnhancedEventPayload<T = any> extends IEventPayload<T> {
  /**
   * Event data
   */
  data?: any;
}

/**
 * Extended response payload with additional fields for middleware
 */
export interface EnhancedResponsePayload<T = any> extends IResponsePayload<T> {
  /**
   * Response data
   */
  data?: any;
}