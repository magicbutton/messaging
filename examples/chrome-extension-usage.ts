import { z } from 'zod';
import { 
  ConnectionManager,
  ConnectionEvent,
  createLoggingMiddleware,
  createPerformanceMiddleware,
  createTelemetryMiddleware
} from '../enhanced-index';
import { ChromeExtensibleTransport, ChromeExtensibleTransportFactory } from './chrome-extension-transport';

// 1. Define our contract with Zod schemas
const eventSchemas = {
  heartbeat: {
    schema: z.object({
      timestamp: z.number()
    })
  },
  tabUrlChanged: {
    schema: z.object({
      tabId: z.number(),
      url: z.string(),
      title: z.string().optional(),
      isActiveTab: z.boolean()
    })
  },
  activeTabChanged: {
    schema: z.object({
      tabId: z.number(),
      url: z.string(),
      title: z.string().optional()
    })
  }
};

const requestSchemas = {
  getUsers: {
    request: z.object({}),
    response: z.object({
      users: z.array(
        z.object({
          id: z.number(),
          name: z.string()
        })
      )
    })
  },
  showSidePanel: {
    request: z.object({}),
    response: z.object({
      success: z.boolean()
    })
  },
  getCurrentTabInfo: {
    request: z.object({}),
    response: z.object({
      tabId: z.number(),
      url: z.string(),
      title: z.string().optional()
    })
  },
  navigateTab: {
    request: z.object({
      tabId: z.number().optional(),
      url: z.string()
    }),
    response: z.object({
      success: z.boolean(),
      error: z.string().optional()
    })
  }
};

// 2. Create type definitions for our contract
type EventSchemas = typeof eventSchemas;
type RequestSchemas = typeof requestSchemas;

interface Contract {
  events: {
    heartbeat: z.infer<EventSchemas['heartbeat']['schema']>;
    tabUrlChanged: z.infer<EventSchemas['tabUrlChanged']['schema']>;
    activeTabChanged: z.infer<EventSchemas['activeTabChanged']['schema']>;
  };
  requests: {
    getUsers: {
      request: z.infer<RequestSchemas['getUsers']['request']>;
      response: z.infer<RequestSchemas['getUsers']['response']>;
    };
    showSidePanel: {
      request: z.infer<RequestSchemas['showSidePanel']['request']>;
      response: z.infer<RequestSchemas['showSidePanel']['response']>;
    };
    getCurrentTabInfo: {
      request: z.infer<RequestSchemas['getCurrentTabInfo']['request']>;
      response: z.infer<RequestSchemas['getCurrentTabInfo']['response']>;
    };
    navigateTab: {
      request: z.infer<RequestSchemas['navigateTab']['request']>;
      response: z.infer<RequestSchemas['navigateTab']['response']>;
    };
  };
}

// 3. Create mock telemetry functions for example
const telemetry = {
  createSpan: (name: string, fn: (span: any) => any) => {
    const span = {
      setAttribute: (key: string, value: any) => {},
      recordException: (error: Error) => {},
      end: () => {}
    };
    return fn(span);
  },
  addAttributes: (attributes: Record<string, any>) => {},
  recordError: (error: Error) => {}
};

// 4. Example setup for a client (e.g., in a side panel)
async function setupSidePanel() {
  console.log('Setting up side panel messaging...');
  
  // Create transport factory
  const transportFactory = new ChromeExtensibleTransportFactory();
  
  // Create transport with Chrome-specific extensions
  const transport = transportFactory.createClient<Contract>({
    connectionName: 'sidepanel-client',
    context: 'side-panel',
    reconnect: true,
    debug: true,
    telemetry: true
  });
  
  // Create connection manager for resilience
  const connectionManager = new ConnectionManager(transport, {
    autoReconnect: true,
    maxReconnectAttempts: 5,
    initialReconnectDelayMs: 1000,
    reconnectBackoffFactor: 1.5,
    heartbeat: true,
    debug: true
  });
  
  // Listen for connection events
  connectionManager.on(ConnectionEvent.CONNECTED, () => {
    console.log('Connected to background service worker');
    updateUIConnected(true);
  });
  
  connectionManager.on(ConnectionEvent.DISCONNECTED, () => {
    console.log('Disconnected from background service worker');
    updateUIConnected(false);
  });
  
  connectionManager.on(ConnectionEvent.RECONNECTING, (data) => {
    console.log(`Reconnecting (attempt ${data.attempt})...`);
    updateUIStatus(`Reconnecting (attempt ${data.attempt})...`);
  });
  
  connectionManager.on(ConnectionEvent.HEARTBEAT, (data) => {
    const timestamp = new Date(data.timestamp).toLocaleTimeString();
    console.log(`Heartbeat received at ${timestamp}`);
    updateUIHeartbeat(timestamp);
  });
  
  // Set up request/response handling
  
  // Function to get users
  async function getUsers() {
    try {
      const response = await transport.request('getUsers', {});
      console.log('Users:', response.users);
      updateUIUsers(response.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Failed to fetch users');
    }
  }
  
  // Function to navigate the tab
  async function navigateTab(url: string, tabId?: number) {
    try {
      // Try using the browser extension directly if available
      if (transport.hasExtension('navigateTab')) {
        await transport.browser.navigateTab!(url, tabId);
        showSuccess(`Navigated to ${url}`);
      } else {
        // Fall back to using the standard request
        const result = await transport.request('navigateTab', { url, tabId });
        
        if (result.success) {
          showSuccess(`Navigated to ${url}`);
        } else {
          showError(`Navigation failed: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Navigation error:', error);
      showError(`Navigation error: ${error.message}`);
    }
  }
  
  // Set up event handling
  transport.on('heartbeat', (data) => {
    const timestamp = new Date(data.timestamp).toLocaleTimeString();
    updateUIHeartbeat(timestamp);
  });
  
  transport.on('tabUrlChanged', (data) => {
    console.log('Tab URL changed:', data);
    if (data.isActiveTab) {
      updateUICurrentTab(data);
    }
  });
  
  transport.on('activeTabChanged', (data) => {
    console.log('Active tab changed:', data);
    updateUICurrentTab(data);
  });
  
  // Connect to the background script
  try {
    await connectionManager.connect();
    console.log('Connected to background service worker');
    
    // Initial data fetching
    const tabInfo = await transport.request('getCurrentTabInfo', {});
    updateUICurrentTab(tabInfo);
    
    await getUsers();
  } catch (error) {
    console.error('Connection error:', error);
    showError(`Connection error: ${error.message}`);
  }
  
  // Set up UI event handlers (just placeholders in this example)
  document.getElementById('refreshButton')?.addEventListener('click', () => {
    getUsers();
  });
  
  document.getElementById('navigateForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const urlInput = document.getElementById('urlInput') as HTMLInputElement;
    if (urlInput && urlInput.value) {
      navigateTab(urlInput.value);
    }
  });
  
  // Clean up function for unmounting
  return async () => {
    await connectionManager.disconnect();
    connectionManager.dispose();
  };
}

// 5. Example setup for the background script
async function setupBackgroundService() {
  console.log('Setting up background service...');
  
  // Create transport factory
  const transportFactory = new ChromeExtensibleTransportFactory();
  
  // Create transport with Chrome-specific extensions
  const transport = transportFactory.createServer<Contract>({
    connectionName: 'background-server',
    context: 'background',
    debug: true,
    telemetry: true,
    sidePanel: {
      path: 'sidepanel.html',
      initialWidth: 400
    }
  });
  
  // Create middleware for the server
  const middleware = [
    createLoggingMiddleware({ 
      logRequests: true, 
      logResponses: true, 
      logEvents: true, 
      logErrors: true
    }),
    createPerformanceMiddleware({
      onRequestEnd: (request, response, duration) => {
        console.log(`Request ${request.type} completed in ${duration}ms`);
      }
    }),
    createTelemetryMiddleware(telemetry)
  ];
  
  // Set up request handlers
  
  // Handler for getUsers
  transport.on('getUsers', async () => {
    console.log('Handling getUsers request');
    
    // In a real app, this might fetch from an API or storage
    return {
      users: [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' }
      ]
    };
  });
  
  // Handler for showSidePanel
  transport.on('showSidePanel', async () => {
    console.log('Handling showSidePanel request');
    
    try {
      await transport.browser.openSidePanel?.();
      return { success: true };
    } catch (error) {
      console.error('Error opening side panel:', error);
      return { success: false };
    }
  });
  
  // Handler for getCurrentTabInfo
  transport.on('getCurrentTabInfo', async () => {
    console.log('Handling getCurrentTabInfo request');
    
    return await transport.browser.getCurrentTabInfo?.() || { 
      tabId: -1, 
      url: '', 
      title: '' 
    };
  });
  
  // Handler for navigateTab
  transport.on('navigateTab', async (data) => {
    console.log('Handling navigateTab request:', data);
    
    try {
      await transport.browser.navigateTab?.(data.url, data.tabId);
      return { success: true };
    } catch (error) {
      console.error('Error navigating tab:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  });
  
  // Connect and start listening
  await transport.connect();
  console.log('Background service started');
  
  // Set up Chrome event listeners
  
  // Listen for tab updates
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only broadcast for URL changes or when a page finishes loading
    if (changeInfo.url || changeInfo.status === 'complete') {
      transport.broadcast('tabUrlChanged', {
        tabId,
        url: tab.url || '',
        title: tab.title || '',
        isActiveTab: tab.active || false
      });
    }
  });
  
  // Listen for active tab changes
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    // Get tab details
    const tab = await chrome.tabs.get(activeInfo.tabId);
    
    transport.broadcast('activeTabChanged', {
      tabId: activeInfo.tabId,
      url: tab.url || '',
      title: tab.title || ''
    });
  });
  
  // Send heartbeats periodically
  setInterval(() => {
    transport.broadcast('heartbeat', { timestamp: Date.now() });
  }, 30000);
}

// UI update helpers (these are just placeholders for the example)
function updateUIConnected(connected: boolean) {
  // Update UI to reflect connection status
}

function updateUIStatus(status: string) {
  // Update UI with status message
}

function updateUIHeartbeat(timestamp: string) {
  // Update UI with last heartbeat time
}

function updateUIUsers(users: { id: number; name: string }[]) {
  // Update UI with user list
}

function updateUICurrentTab(tabInfo: { tabId: number; url: string; title?: string }) {
  // Update UI with current tab info
}

function showError(message: string) {
  // Show error message in UI
}

function showSuccess(message: string) {
  // Show success message in UI
}

// Export the setup functions for use in the extension
export { setupSidePanel, setupBackgroundService };