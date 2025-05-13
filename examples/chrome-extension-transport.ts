import { Contract, IMessageContext, IRequestPayload, IResponsePayload, IEventPayload } from '../types';
import { ExtensibleTransport, ExtensibleTransportConfig } from '../transport-adapter-ext';
import { BrowserExtensions } from '../transport-extensions';

/**
 * Chrome extension specific configuration
 */
export interface ChromeTransportConfig extends ExtensibleTransportConfig {
  /**
   * ID of the extension to connect to (for cross-extension communication)
   */
  extensionId?: string;
  
  /**
   * Side panel configuration
   */
  sidePanel?: {
    /**
     * Path to the side panel HTML file
     */
    path: string;
    
    /**
     * Initial width of the side panel
     */
    initialWidth?: number;
  };
}

/**
 * Chrome extension transport implementation that demonstrates the enhanced capabilities
 */
export class ChromeExtensibleTransport<TContract extends Contract> extends ExtensibleTransport<TContract> {
  /**
   * Chrome extension specific configuration
   */
  private chromeConfig: ChromeTransportConfig;
  
  /**
   * Connection port
   */
  private port: chrome.runtime.Port | null = null;
  
  /**
   * Pending requests map
   */
  private pendingRequests = new Map<string, {
    resolve: (value: IResponsePayload<TContract>) => void;
    reject: (reason: any) => void;
    timer: NodeJS.Timeout;
  }>();
  
  /**
   * Event handlers
   */
  private eventHandlers = new Map<string, ((data: any) => void)[]>();
  
  /**
   * Creates a new ChromeExtensibleTransport
   * @param config Transport configuration
   */
  constructor(config: ChromeTransportConfig) {
    super(config);
    this.chromeConfig = config;
    
    // Initialize browser extensions
    this.initializeBrowserExtensions();
  }
  
  /**
   * Initializes browser extensions
   */
  private initializeBrowserExtensions(): void {
    // Add Chrome-specific extensions
    this.extensions.browser.openSidePanel = this.openSidePanel.bind(this);
    this.extensions.browser.closeSidePanel = this.closeSidePanel.bind(this);
    this.extensions.browser.getCurrentTabInfo = this.getCurrentTabInfo.bind(this);
    this.extensions.browser.navigateTab = this.navigateTab.bind(this);
    this.extensions.browser.captureScreenshot = this.captureScreenshot.bind(this);
  }
  
  /**
   * Connects to the Chrome runtime
   * @param connectionString Optional connection string
   */
  async connect(connectionString?: string): Promise<void> {
    await super.connect(connectionString);
    
    try {
      // Create a connection to the extension
      const connectInfo: chrome.runtime.ConnectInfo = {
        name: this.config.connectionName
      };
      
      // For cross-extension communication
      if (this.chromeConfig.extensionId) {
        this.port = chrome.runtime.connect(this.chromeConfig.extensionId, connectInfo);
      } else {
        this.port = chrome.runtime.connect(connectInfo);
      }
      
      if (!this.port) {
        throw new Error('Failed to create connection port');
      }
      
      // Set up message handler
      this.port.onMessage.addListener(this.handleMessage.bind(this));
      
      // Set up disconnect handler
      this.port.onDisconnect.addListener(this.handleDisconnect.bind(this));
      
      if (this.config.debug) {
        console.log(`[ChromeExtensibleTransport] Connected to ${this.chromeConfig.extensionId || 'background'}`);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[ChromeExtensibleTransport] Connection error:', error);
      }
      throw error;
    }
  }
  
  /**
   * Disconnects from the Chrome runtime
   */
  async disconnect(): Promise<void> {
    await super.disconnect();
    
    try {
      // Clean up pending requests
      for (const [requestId, { reject, timer }] of this.pendingRequests.entries()) {
        clearTimeout(timer);
        reject(new Error('Disconnected'));
        this.pendingRequests.delete(requestId);
      }
      
      // Disconnect the port
      if (this.port) {
        this.port.disconnect();
        this.port = null;
      }
      
      if (this.config.debug) {
        console.log('[ChromeExtensibleTransport] Disconnected');
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[ChromeExtensibleTransport] Disconnect error:', error);
      }
      throw error;
    }
  }
  
  /**
   * Handles messages from the port
   * @param message The received message
   */
  private handleMessage(message: any): void {
    try {
      if (!message || !message.type) {
        return;
      }
      
      if (this.config.debug) {
        console.log(`[ChromeExtensibleTransport] Received message: ${message.type}`, message);
      }
      
      if (message.type === 'response') {
        // Handle request response
        const pendingRequest = this.pendingRequests.get(message.requestId);
        
        if (pendingRequest) {
          clearTimeout(pendingRequest.timer);
          pendingRequest.resolve(message);
          this.pendingRequests.delete(message.requestId);
        }
      } else if (message.type === 'event') {
        // Handle events
        const handlers = this.eventHandlers.get(message.eventType) || [];
        
        for (const handler of handlers) {
          try {
            handler(message.data);
          } catch (error) {
            console.error(`[ChromeExtensibleTransport] Error in event handler for ${message.eventType}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('[ChromeExtensibleTransport] Error handling message:', error);
    }
  }
  
  /**
   * Handles port disconnection
   */
  private handleDisconnect(): void {
    const error = chrome.runtime.lastError;
    
    if (this.config.debug) {
      console.log('[ChromeExtensibleTransport] Port disconnected', error ? `Error: ${error.message}` : '');
    }
    
    this.port = null;
    
    // Reject all pending requests
    for (const [requestId, { reject, timer }] of this.pendingRequests.entries()) {
      clearTimeout(timer);
      reject(new Error(error?.message || 'Connection closed'));
      this.pendingRequests.delete(requestId);
    }
    
    // Attempt reconnection if enabled
    if (this.config.reconnect) {
      this.attemptReconnect();
    }
  }
  
  /**
   * Sends a request through the port
   * @param request The request to send
   * @param context The message context
   */
  async request<K extends keyof TContract['requests']>(
    type: K,
    data: TContract['requests'][K]['request'],
    context: IMessageContext = {}
  ): Promise<TContract['requests'][K]['response']> {
    if (!this.port) {
      throw new Error('Not connected');
    }
    
    const requestId = generateRequestId();
    
    const requestPayload: IRequestPayload<TContract> = {
      type: type as string,
      requestId,
      data,
      timestamp: Date.now()
    };
    
    return new Promise<any>((resolve, reject) => {
      // Set a timeout for the request
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout: ${type}`));
      }, 30000); // 30 second timeout
      
      // Store the pending request
      this.pendingRequests.set(requestId, { resolve, reject, timer });
      
      try {
        // Send the request
        this.port!.postMessage({
          type: 'request',
          ...requestPayload,
          context
        });
        
        if (this.config.debug) {
          console.log(`[ChromeExtensibleTransport] Sent request: ${type}`, requestPayload);
        }
      } catch (error) {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        reject(error);
      }
    });
  }
  
  /**
   * Broadcasts an event through the port
   * @param event The event to broadcast
   * @param context The message context
   */
  async broadcast<K extends keyof TContract['events']>(
    type: K,
    data: TContract['events'][K],
    context: IMessageContext = {}
  ): Promise<void> {
    if (!this.port) {
      throw new Error('Not connected');
    }
    
    const eventPayload: IEventPayload<TContract> = {
      type: type as string,
      data,
      timestamp: Date.now()
    };
    
    try {
      // Send the event
      this.port.postMessage({
        type: 'event',
        ...eventPayload,
        context
      });
      
      if (this.config.debug) {
        console.log(`[ChromeExtensibleTransport] Broadcast event: ${type}`, eventPayload);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error(`[ChromeExtensibleTransport] Error broadcasting event ${type}:`, error);
      }
      throw error;
    }
  }
  
  /**
   * Registers an event handler
   * @param event The event to listen for
   * @param handler The event handler
   */
  on<K extends keyof TContract['events']>(
    event: K,
    handler: (data: TContract['events'][K]) => void
  ): void {
    const eventType = event as string;
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler as any);
    this.eventHandlers.set(eventType, handlers);
    
    if (this.config.debug) {
      console.log(`[ChromeExtensibleTransport] Registered handler for event: ${eventType}`);
    }
  }
  
  /**
   * Unregisters an event handler
   * @param event The event to stop listening for
   * @param handler The event handler to remove
   */
  off<K extends keyof TContract['events']>(
    event: K,
    handler: (data: TContract['events'][K]) => void
  ): void {
    const eventType = event as string;
    const handlers = this.eventHandlers.get(eventType) || [];
    const index = handlers.indexOf(handler as any);
    
    if (index !== -1) {
      handlers.splice(index, 1);
      this.eventHandlers.set(eventType, handlers);
      
      if (this.config.debug) {
        console.log(`[ChromeExtensibleTransport] Unregistered handler for event: ${eventType}`);
      }
    }
  }
  
  /**
   * Opens the side panel
   */
  private async openSidePanel(): Promise<void> {
    if (!chrome.sidePanel) {
      throw new Error('Side panel API not available');
    }
    
    try {
      if (this.config.debug) {
        console.log('[ChromeExtensibleTransport] Opening side panel');
      }
      
      // If side panel path is specified, set it first
      if (this.chromeConfig.sidePanel?.path) {
        await chrome.sidePanel.setOptions({
          path: this.chromeConfig.sidePanel.path,
          enabled: true
        });
      }
      
      // Open the side panel
      await chrome.sidePanel.open();
      
      if (this.config.debug) {
        console.log('[ChromeExtensibleTransport] Side panel opened');
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[ChromeExtensibleTransport] Error opening side panel:', error);
      }
      throw error;
    }
  }
  
  /**
   * Closes the side panel
   */
  private async closeSidePanel(): Promise<void> {
    if (!chrome.sidePanel) {
      throw new Error('Side panel API not available');
    }
    
    try {
      if (this.config.debug) {
        console.log('[ChromeExtensibleTransport] Closing side panel');
      }
      
      await chrome.sidePanel.close();
      
      if (this.config.debug) {
        console.log('[ChromeExtensibleTransport] Side panel closed');
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[ChromeExtensibleTransport] Error closing side panel:', error);
      }
      throw error;
    }
  }
  
  /**
   * Gets information about the current tab
   */
  private async getCurrentTabInfo(): Promise<{ tabId: number; url: string; title?: string }> {
    try {
      if (this.config.debug) {
        console.log('[ChromeExtensibleTransport] Getting current tab info');
      }
      
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tabs.length === 0) {
        throw new Error('No active tab found');
      }
      
      const activeTab = tabs[0];
      
      return {
        tabId: activeTab.id || -1,
        url: activeTab.url || '',
        title: activeTab.title
      };
    } catch (error) {
      if (this.config.debug) {
        console.error('[ChromeExtensibleTransport] Error getting current tab info:', error);
      }
      throw error;
    }
  }
  
  /**
   * Navigates a tab to a URL
   * @param url The URL to navigate to
   * @param tabId Optional tab ID (defaults to current tab)
   */
  private async navigateTab(url: string, tabId?: number): Promise<void> {
    try {
      if (this.config.debug) {
        console.log(`[ChromeExtensibleTransport] Navigating ${tabId ? `tab ${tabId}` : 'current tab'} to ${url}`);
      }
      
      // If no tab ID is provided, get the current active tab
      if (tabId === undefined) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tabs.length === 0) {
          throw new Error('No active tab found');
        }
        
        tabId = tabs[0].id || -1;
      }
      
      await chrome.tabs.update(tabId, { url });
      
      if (this.config.debug) {
        console.log(`[ChromeExtensibleTransport] Tab ${tabId} navigated to ${url}`);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[ChromeExtensibleTransport] Error navigating tab:', error);
      }
      throw error;
    }
  }
  
  /**
   * Captures a screenshot of the current tab
   * @param options Screenshot options
   */
  private async captureScreenshot(options?: { fullPage?: boolean }): Promise<string> {
    try {
      if (this.config.debug) {
        console.log('[ChromeExtensibleTransport] Capturing screenshot');
      }
      
      // Capture visible area
      const dataUrl = await chrome.tabs.captureVisibleTab(undefined, { format: 'png' });
      
      if (options?.fullPage) {
        // TODO: Implement full page screenshot using content script injection
        console.warn('Full page screenshot not implemented yet. Returning visible area only.');
      }
      
      if (this.config.debug) {
        console.log('[ChromeExtensibleTransport] Screenshot captured');
      }
      
      return dataUrl;
    } catch (error) {
      if (this.config.debug) {
        console.error('[ChromeExtensibleTransport] Error capturing screenshot:', error);
      }
      throw error;
    }
  }
}

/**
 * Generates a unique request ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Factory for creating Chrome extension transport instances
 */
export class ChromeExtensibleTransportFactory {
  /**
   * Creates a client transport
   * @param config Transport configuration
   */
  createClient<TContract extends Contract>(config: ChromeTransportConfig): ChromeExtensibleTransport<TContract> {
    return new ChromeExtensibleTransport<TContract>(config);
  }
  
  /**
   * Creates a server transport
   * @param config Transport configuration
   */
  createServer<TContract extends Contract>(config: ChromeTransportConfig): ChromeExtensibleTransport<TContract> {
    return new ChromeExtensibleTransport<TContract>(config);
  }
}