# React Chat Application Using Magic Button Messaging

Use this prompt when asking Claude to help you build a modern React chat application using the @magicbutton.cloud/messaging library.

## Prompt Template

```
I want to create a modern React chat application using @magicbutton.cloud/messaging v1.0.10. Please help me set up the following:

1. A project structure using:
   - React (latest version) with TypeScript
   - Vite for fast development
   - Magic Button Messaging for communication
   - CSS modules or Tailwind CSS for styling

2. A chat contract that defines:
   - Message events (sending, editing, deleting messages)
   - User presence events (online, offline, typing)
   - Channel management (create, join, leave)
   - User authentication and roles (admin, moderator, user)

3. A React component architecture with:
   - Authentication components (login/register)
   - Channel components (channel list, channel creation)
   - Message components (message list, message input)
   - User presence components (online users, typing indicators)
   - Responsive UI that works on desktop and mobile

4. State management using:
   - React Context for application state
   - Custom hooks for messaging interactions
   - Proper error handling and loading states

Please include implementation of:
- User authentication flow
- Real-time message display
- Typing indicators
- Message editing and deletion
- Channel joining and leaving
- User presence indicators

The architecture should follow best practices for React development and messaging patterns.
```

## Project Structure

```
react-chat-app/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── channels/
│   │   │   ├── ChannelCreation.tsx
│   │   │   ├── ChannelItem.tsx
│   │   │   └── ChannelList.tsx
│   │   ├── chat/
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   └── MessageList.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainLayout.tsx
│   │   └── users/
│   │       ├── OnlineUsers.tsx
│   │       └── TypingIndicator.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── ChatContext.tsx
│   │   └── MessagingContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   ├── useChannels.ts
│   │   └── useMessaging.ts
│   ├── messaging/
│   │   ├── contract/
│   │   │   └── chat-contract.ts
│   │   ├── transport/
│   │   │   └── in-memory-transport.ts
│   │   └── client.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── .eslintrc.cjs
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Setting Up the Project

### Installation Instructions

```bash
# Create a new vite project with React and TypeScript
npm create vite@latest react-chat-app -- --template react-ts

# Navigate to the project directory
cd react-chat-app

# Install dependencies
npm install @magicbutton.cloud/messaging@1.0.10 zod uuid react-router-dom

# Install dev dependencies
npm install --save-dev @types/uuid

# Start the development server
npm run dev
```

## Contract Implementation

Here's an example implementation for the chat contract that defines the events, requests, and role-based permissions:

```typescript
// src/messaging/contract/chat-contract.ts
import * as z from 'zod';
import { 
  createContract, 
  createEventMap, 
  createRequestSchemaMap, 
  createErrorMap 
} from '@magicbutton.cloud/messaging';

// Define user roles
export type RoleKey = 'admin' | 'moderator' | 'user' | 'guest';

// Message schema
const MessageSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  content: z.string(),
  timestamp: z.number(),
  edited: z.boolean().optional(),
  editedTimestamp: z.number().optional(),
});

// User presence schema
const PresenceSchema = z.object({
  userId: z.string(),
  username: z.string(),
  status: z.enum(['online', 'away', 'offline']),
  lastActivity: z.number(),
});

// Typing indicator schema
const TypingIndicatorSchema = z.object({
  userId: z.string(),
  username: z.string(),
  channelId: z.string(),
  isTyping: z.boolean(),
  timestamp: z.number(),
});

// Channel schema
const ChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isPrivate: z.boolean(),
  createdBy: z.string(),
  createdAt: z.number(),
  members: z.array(z.string()),
});

// Define events
const events = createEventMap({
  // Message events
  'message.sent': {
    schema: MessageSchema,
    description: 'Sent when a new message is posted',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },
  'message.edited': {
    schema: MessageSchema,
    description: 'Sent when a message is edited',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },
  'message.deleted': {
    schema: z.object({
      id: z.string(),
      channelId: z.string(),
      timestamp: z.number(),
    }),
    description: 'Sent when a message is deleted',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },

  // Typing events
  'user.typing': {
    schema: TypingIndicatorSchema,
    description: 'Sent when a user starts or stops typing',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },

  // Presence events
  'user.presence': {
    schema: PresenceSchema,
    description: 'Sent when a user changes presence status',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },

  // Channel events
  'channel.created': {
    schema: ChannelSchema,
    description: 'Sent when a new channel is created',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },
  'channel.updated': {
    schema: ChannelSchema,
    description: 'Sent when a channel is updated',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },
  'channel.deleted': {
    schema: z.object({
      id: z.string(),
      timestamp: z.number(),
    }),
    description: 'Sent when a channel is deleted',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'channel.joined': {
    schema: z.object({
      userId: z.string(),
      username: z.string(),
      channelId: z.string(),
      timestamp: z.number(),
    }),
    description: 'Sent when a user joins a channel',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },
  'channel.left': {
    schema: z.object({
      userId: z.string(),
      username: z.string(),
      channelId: z.string(),
      timestamp: z.number(),
    }),
    description: 'Sent when a user leaves a channel',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  }
});

// Define requests
const requests = createRequestSchemaMap({
  // Authentication
  'auth.login': {
    requestSchema: z.object({
      username: z.string().min(3),
      password: z.string().min(6),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      userId: z.string().optional(),
      username: z.string().optional(),
      roles: z.array(z.string()).optional(),
      error: z.string().optional(),
    }),
    description: 'Login to the chat system',
  },
  'auth.register': {
    requestSchema: z.object({
      username: z.string().min(3),
      password: z.string().min(6),
      email: z.string().email(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      userId: z.string().optional(),
      username: z.string().optional(),
      error: z.string().optional(),
    }),
    description: 'Register a new user',
  },
  'auth.logout': {
    requestSchema: z.object({}),
    responseSchema: z.object({
      success: z.boolean(),
    }),
    description: 'Logout from the chat system',
  },

  // Channel operations
  'channel.create': {
    requestSchema: z.object({
      name: z.string().min(2).max(50),
      description: z.string().max(200).optional(),
      isPrivate: z.boolean().default(false),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      channel: ChannelSchema.optional(),
      error: z.string().optional(),
    }),
    description: 'Create a new channel',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'channel.update': {
    requestSchema: z.object({
      id: z.string(),
      name: z.string().min(2).max(50).optional(),
      description: z.string().max(200).optional(),
      isPrivate: z.boolean().optional(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      channel: ChannelSchema.optional(),
      error: z.string().optional(),
    }),
    description: 'Update a channel',
    access: {
      allowedRoles: ['admin', 'moderator'] as RoleKey[]
    }
  },
  'channel.delete': {
    requestSchema: z.object({
      id: z.string(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
    description: 'Delete a channel',
    access: {
      allowedRoles: ['admin'] as RoleKey[]
    }
  },
  'channel.join': {
    requestSchema: z.object({
      channelId: z.string(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      channelId: z.string().optional(),
      error: z.string().optional(),
    }),
    description: 'Join a channel',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'channel.leave': {
    requestSchema: z.object({
      channelId: z.string(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
    description: 'Leave a channel',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'channel.list': {
    requestSchema: z.object({}),
    responseSchema: z.object({
      channels: z.array(ChannelSchema),
    }),
    description: 'Get list of channels',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },

  // Message operations
  'message.send': {
    requestSchema: z.object({
      channelId: z.string(),
      content: z.string().min(1).max(2000),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      id: z.string().optional(),
      timestamp: z.number().optional(),
      error: z.string().optional(),
    }),
    description: 'Send a message to a channel',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'message.edit': {
    requestSchema: z.object({
      id: z.string(),
      channelId: z.string(),
      content: z.string().min(1).max(2000),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      timestamp: z.number().optional(),
      error: z.string().optional(),
    }),
    description: 'Edit a message',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'message.delete': {
    requestSchema: z.object({
      id: z.string(),
      channelId: z.string(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
    description: 'Delete a message',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'message.history': {
    requestSchema: z.object({
      channelId: z.string(),
      limit: z.number().optional(),
      before: z.number().optional(),
    }),
    responseSchema: z.object({
      messages: z.array(MessageSchema),
      hasMore: z.boolean(),
    }),
    description: 'Get message history for a channel',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },

  // User operations
  'user.setPresence': {
    requestSchema: z.object({
      status: z.enum(['online', 'away', 'offline']),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
    description: 'Set user presence status',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'user.setTyping': {
    requestSchema: z.object({
      channelId: z.string(),
      isTyping: z.boolean(),
    }),
    responseSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
    description: 'Set typing indicator',
    access: {
      allowedRoles: ['admin', 'moderator', 'user'] as RoleKey[]
    }
  },
  'user.getOnline': {
    requestSchema: z.object({}),
    responseSchema: z.object({
      users: z.array(PresenceSchema),
    }),
    description: 'Get online users',
    access: {
      allowedRoles: ['admin', 'moderator', 'user', 'guest'] as RoleKey[]
    }
  },
});

// Define errors
const errors = createErrorMap({
  'chat.invalid_credentials': {
    code: 'chat.invalid_credentials',
    message: 'Invalid username or password',
    severity: 'error',
  },
  'chat.user_exists': {
    code: 'chat.user_exists',
    message: 'A user with this username already exists',
    severity: 'error',
  },
  'chat.permission_denied': {
    code: 'chat.permission_denied',
    message: 'You do not have permission to perform this action',
    severity: 'error',
  },
  'chat.invalid_channel': {
    code: 'chat.invalid_channel',
    message: 'Channel not found',
    severity: 'error',
  },
  'chat.invalid_message': {
    code: 'chat.invalid_message',
    message: 'Message not found or invalid',
    severity: 'error',
  },
  'chat.not_member': {
    code: 'chat.not_member',
    message: 'You are not a member of this channel',
    severity: 'error',
  },
  'chat.already_member': {
    code: 'chat.already_member',
    message: 'You are already a member of this channel',
    severity: 'error',
  },
  'chat.message_not_found': {
    code: 'chat.message_not_found',
    message: 'Message not found',
    severity: 'error',
  },
  'chat.channel_exists': {
    code: 'chat.channel_exists',
    message: 'Channel with this name already exists',
    severity: 'error',
  },
});

// Define role permissions
const roles = {
  admin: {
    name: 'admin',
    description: 'Administrator with full access',
    inherits: ['moderator'],
  },
  moderator: {
    name: 'moderator',
    description: 'Moderator with elevated permissions',
    inherits: ['user'],
  },
  user: {
    name: 'user',
    description: 'Regular user',
    inherits: ['guest'],
  },
  guest: {
    name: 'guest',
    description: 'Guest with limited access',
    inherits: [],
  },
};

// Export the chat contract
export const chatContract = createContract({
  name: 'chat-contract',
  version: '1.0.0',
  events,
  requests,
  errors,
  roles,
});

// Export types for easy use elsewhere
export type ChatMessage = z.infer<typeof MessageSchema>;
export type TypingIndicator = z.infer<typeof TypingIndicatorSchema>;
export type UserPresence = z.infer<typeof PresenceSchema>;
export type Channel = z.infer<typeof ChannelSchema>;
```

## Context and Hooks

Here's how to create a messaging context that will provide the chat functionality throughout your React app:

```typescript
// src/context/MessagingContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MessagingClient, Transport } from '@magicbutton.cloud/messaging';
import { createInMemoryTransport } from '../messaging/transport/in-memory-transport';
import { chatContract, ChatMessage, Channel, UserPresence, TypingIndicator } from '../messaging/contract/chat-contract';

interface MessagingContextType {
  client: MessagingClient<typeof chatContract> | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  currentUser: {
    id: string;
    username: string;
    roles: string[];
  } | null;
  channels: Channel[];
  currentChannel: Channel | null;
  messages: ChatMessage[];
  onlineUsers: UserPresence[];
  typingUsers: TypingIndicator[];
  connectToServer: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadChannels: () => Promise<void>;
  createChannel: (name: string, description?: string, isPrivate?: boolean) => Promise<boolean>;
  joinChannel: (channelId: string) => Promise<boolean>;
  leaveChannel: (channelId: string) => Promise<boolean>;
  sendMessage: (content: string) => Promise<boolean>;
  editMessage: (messageId: string, content: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  setTyping: (isTyping: boolean) => Promise<void>;
  setPresence: (status: 'online' | 'away' | 'offline') => Promise<void>;
  loadMessageHistory: (channelId: string, limit?: number, before?: number) => Promise<void>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transport, setTransport] = useState<Transport | null>(null);
  const [client, setClient] = useState<MessagingClient<typeof chatContract> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; roles: string[] } | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);

  useEffect(() => {
    // Initialize transport and client
    const newTransport = createInMemoryTransport('client');
    setTransport(newTransport);

    const newClient = new MessagingClient(newTransport, {
      clientId: 'web-client-' + Math.random().toString(36).substring(2, 9),
      clientType: 'web',
    });

    setClient(newClient);

    // Setup event listeners
    if (newClient) {
      newClient.onStatusChange((status) => {
        setIsConnected(status === 'connected');
      });

      // Subscribe to events
      newClient.on('message.sent', (payload) => {
        setMessages((prevMessages) => [...prevMessages, payload]);
      });

      newClient.on('message.edited', (payload) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => (msg.id === payload.id ? payload : msg))
        );
      });

      newClient.on('message.deleted', (payload) => {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== payload.id)
        );
      });

      newClient.on('channel.created', (payload) => {
        setChannels((prevChannels) => [...prevChannels, payload]);
      });

      newClient.on('channel.updated', (payload) => {
        setChannels((prevChannels) =>
          prevChannels.map((ch) => (ch.id === payload.id ? payload : ch))
        );
      });

      newClient.on('channel.deleted', (payload) => {
        setChannels((prevChannels) =>
          prevChannels.filter((ch) => ch.id !== payload.id)
        );

        if (currentChannel && currentChannel.id === payload.id) {
          setCurrentChannel(null);
        }
      });

      newClient.on('user.presence', (payload) => {
        setOnlineUsers((prevUsers) => {
          const exists = prevUsers.some((u) => u.userId === payload.userId);
          if (exists) {
            return prevUsers.map((u) =>
              u.userId === payload.userId ? payload : u
            );
          } else {
            return [...prevUsers, payload];
          }
        });
      });

      newClient.on('user.typing', (payload) => {
        if (payload.isTyping) {
          setTypingUsers((prevUsers) => {
            const exists = prevUsers.some((u) => u.userId === payload.userId);
            if (exists) {
              return prevUsers.map((u) =>
                u.userId === payload.userId ? payload : u
              );
            } else {
              return [...prevUsers, payload];
            }
          });
        } else {
          setTypingUsers((prevUsers) =>
            prevUsers.filter((u) => u.userId !== payload.userId)
          );
        }
      });
    }

    return () => {
      // Clean up on unmount
      if (newClient && newClient.isConnected()) {
        newClient.disconnect().catch(console.error);
      }
    };
  }, []);

  // Connect to server
  const connectToServer = async () => {
    if (client) {
      try {
        await client.connect('memory://chat-server');
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect:', error);
        setIsConnected(false);
      }
    }
  };

  // Authentication functions
  const login = async (username: string, password: string) => {
    if (!client) return false;

    try {
      const response = await client.request('auth.login', { username, password });
      if (response.success && response.userId) {
        setIsAuthenticated(true);
        setCurrentUser({
          id: response.userId,
          username: response.username || username,
          roles: response.roles || ['user'],
        });

        // Set presence status to online
        await client.request('user.setPresence', { status: 'online' });
        
        // Load available channels
        await loadChannels();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (username: string, password: string, email: string) => {
    if (!client) return false;

    try {
      const response = await client.request('auth.register', { username, password, email });
      return response.success;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = async () => {
    if (!client) return;

    try {
      // Set presence to offline
      await client.request('user.setPresence', { status: 'offline' });
      
      await client.request('auth.logout', {});
      
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentChannel(null);
      setMessages([]);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Channel functions
  const loadChannels = async () => {
    if (!client || !isAuthenticated) return;

    try {
      const response = await client.request('channel.list', {});
      setChannels(response.channels);
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const createChannel = async (name: string, description?: string, isPrivate = false) => {
    if (!client || !isAuthenticated) return false;

    try {
      const response = await client.request('channel.create', { name, description, isPrivate });
      if (response.success && response.channel) {
        setChannels((prevChannels) => [...prevChannels, response.channel!]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create channel:', error);
      return false;
    }
  };

  const joinChannel = async (channelId: string) => {
    if (!client || !isAuthenticated) return false;

    try {
      const response = await client.request('channel.join', { channelId });
      if (response.success) {
        const channel = channels.find((c) => c.id === channelId);
        if (channel) {
          setCurrentChannel(channel);
          await loadMessageHistory(channelId);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to join channel:', error);
      return false;
    }
  };

  const leaveChannel = async (channelId: string) => {
    if (!client || !isAuthenticated) return false;

    try {
      const response = await client.request('channel.leave', { channelId });
      if (response.success) {
        if (currentChannel && currentChannel.id === channelId) {
          setCurrentChannel(null);
          setMessages([]);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to leave channel:', error);
      return false;
    }
  };

  // Message functions
  const sendMessage = async (content: string) => {
    if (!client || !isAuthenticated || !currentChannel) return false;

    try {
      const response = await client.request('message.send', {
        channelId: currentChannel.id,
        content,
      });
      return response.success;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    if (!client || !isAuthenticated || !currentChannel) return false;

    try {
      const response = await client.request('message.edit', {
        id: messageId,
        channelId: currentChannel.id,
        content,
      });
      return response.success;
    } catch (error) {
      console.error('Failed to edit message:', error);
      return false;
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!client || !isAuthenticated || !currentChannel) return false;

    try {
      const response = await client.request('message.delete', {
        id: messageId,
        channelId: currentChannel.id,
      });
      return response.success;
    } catch (error) {
      console.error('Failed to delete message:', error);
      return false;
    }
  };

  const loadMessageHistory = async (channelId: string, limit = 50, before?: number) => {
    if (!client || !isAuthenticated) return;

    try {
      const response = await client.request('message.history', {
        channelId,
        limit,
        before,
      });
      setMessages(response.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // User presence and typing functions
  const setTyping = async (isTyping: boolean) => {
    if (!client || !isAuthenticated || !currentChannel) return;

    try {
      await client.request('user.setTyping', {
        channelId: currentChannel.id,
        isTyping,
      });
    } catch (error) {
      console.error('Failed to set typing status:', error);
    }
  };

  const setPresence = async (status: 'online' | 'away' | 'offline') => {
    if (!client || !isAuthenticated) return;

    try {
      await client.request('user.setPresence', { status });
    } catch (error) {
      console.error('Failed to set presence status:', error);
    }
  };

  // Context value
  const value: MessagingContextType = {
    client,
    isConnected,
    isAuthenticated,
    currentUser,
    channels,
    currentChannel,
    messages,
    onlineUsers,
    typingUsers,
    connectToServer,
    login,
    register,
    logout,
    loadChannels,
    createChannel,
    joinChannel,
    leaveChannel,
    sendMessage,
    editMessage,
    deleteMessage,
    setTyping,
    setPresence,
    loadMessageHistory,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

// Custom hook to use the messaging context
export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};
```

## React Components

Here's a sample implementation of a login component:

```tsx
// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { useMessaging } from '../../context/MessagingContext';
import './LoginForm.css'; // You would create this CSS file for styling

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onRegisterClick }) => {
  const { login, isAuthenticated } = useMessaging();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        setUsername('');
        setPassword('');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <h2>Login to Chat</h2>
      {error && <div className="login-error">{error}</div>}
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
            minLength={3}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            minLength={6}
          />
        </div>
        <div className="form-actions">
          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
      <div className="register-link">
        Don't have an account?{' '}
        <button onClick={onRegisterClick} className="register-button">
          Register
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
```

And a sample implementation of a chat container component:

```tsx
// src/components/chat/ChatContainer.tsx
import React, { useEffect } from 'react';
import { useMessaging } from '../../context/MessagingContext';
import ChannelList from '../channels/ChannelList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import OnlineUsers from '../users/OnlineUsers';
import './ChatContainer.css'; // You would create this CSS file for styling

const ChatContainer: React.FC = () => {
  const {
    isAuthenticated,
    currentUser,
    currentChannel,
    channels,
    messages,
    onlineUsers,
    typingUsers,
    loadChannels,
    joinChannel,
    logout,
  } = useMessaging();

  useEffect(() => {
    if (isAuthenticated) {
      loadChannels();
    }
  }, [isAuthenticated, loadChannels]);

  if (!isAuthenticated || !currentUser) {
    return <div className="chat-container-not-authenticated">Please log in to use the chat.</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="user-info">
          <span>{currentUser.username}</span>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
        <ChannelList
          channels={channels}
          currentChannelId={currentChannel?.id}
          onSelectChannel={(channelId) => joinChannel(channelId)}
        />
        <OnlineUsers users={onlineUsers} />
      </div>
      <div className="chat-main">
        {currentChannel ? (
          <>
            <div className="chat-header">
              <h2>{currentChannel.name}</h2>
              {currentChannel.description && <p>{currentChannel.description}</p>}
            </div>
            <MessageList
              messages={messages}
              currentUser={currentUser}
              typingUsers={typingUsers.filter(t => t.channelId === currentChannel.id)}
            />
            <MessageInput />
          </>
        ) : (
          <div className="no-channel-selected">
            <p>Select a channel to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;
```

## Main App Component

```tsx
// src/App.tsx
import React, { useEffect, useState } from 'react';
import { MessagingProvider, useMessaging } from './context/MessagingContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ChatContainer from './components/chat/ChatContainer';
import './App.css';

const ChatApp: React.FC = () => {
  const { isConnected, isAuthenticated, connectToServer } = useMessaging();
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      connectToServer();
    }
  }, [isConnected, connectToServer]);

  if (!isConnected) {
    return <div className="connecting-message">Connecting to server...</div>;
  }

  if (!isAuthenticated) {
    return showRegister ? (
      <RegisterForm
        onSuccess={() => setShowRegister(false)}
        onLoginClick={() => setShowRegister(false)}
      />
    ) : (
      <LoginForm onRegisterClick={() => setShowRegister(true)} />
    );
  }

  return <ChatContainer />;
};

const App: React.FC = () => {
  return (
    <MessagingProvider>
      <div className="app-container">
        <ChatApp />
      </div>
    </MessagingProvider>
  );
};

export default App;
```

## Styling

For the styling, you can either use CSS modules or Tailwind CSS. Here's a basic CSS example for the login form:

```css
/* src/components/auth/LoginForm.css */
.login-form-container {
  max-width: 400px;
  margin: 100px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.login-form-container h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.login-error {
  background-color: #ffeeee;
  color: #cc0000;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  text-align: center;
}

.login-form .form-group {
  margin-bottom: 15px;
}

.login-form label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #555;
}

.login-form input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.login-form input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-actions {
  margin-top: 20px;
}

.login-button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-button:hover {
  background-color: #0069d9;
}

.login-button:disabled {
  background-color: #7eb3e7;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
  color: #666;
}

.register-button {
  background: none;
  border: none;
  color: #007bff;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.register-button:hover {
  color: #0056b3;
}
```

## Development Tips

1. **Component Organization**: Keep your React components small and focused on a single responsibility.

2. **Custom Hooks**: Create custom hooks for specific functionality to avoid duplicating code.

3. **Error Handling**: Implement comprehensive error handling with user-friendly error messages.

4. **Loading States**: Use loading states to provide feedback during async operations.

5. **Performance Optimization**: Use React's built-in memoization features (memo, useMemo, useCallback) for performance-critical components.

6. **Responsive Design**: Implement responsive design using media queries or Tailwind's responsive modifiers.

7. **Testing**: Write tests for your React components and hooks using Jest and React Testing Library.

8. **TypeScript Best Practices**:
   - Use interfaces for objects that will be extended
   - Use type aliases for union types or complex types
   - Use type inference where possible to keep code clean

## Next Steps

After implementing the basic chat application, consider these enhancements:

1. Add persistent storage with a database or localStorage
2. Implement a WebSocket transport for real-world use
3. Add file sharing and image support
4. Add emoji reactions to messages
5. Implement message threading
6. Add push notifications for new messages
7. Implement read receipts
8. Add user profiles with avatars