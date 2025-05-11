import * as z from 'zod';
import { createContract, createEventMap, createRequestSchemaMap, createErrorMap } from '@magicbutton.cloud/messaging';

// Define user roles
export type RoleKey = 'admin' | 'moderator' | 'user' | 'guest';

// Message schema
const MessageSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  senderId: z.string(),
  content: z.string(),
  timestamp: z.number(),
  edited: z.boolean().optional(),
  editedTimestamp: z.number().optional(),
});

// User presence schema
const PresenceSchema = z.object({
  userId: z.string(),
  status: z.enum(['online', 'away', 'offline']),
  lastActivity: z.number(),
});

// Typing indicator schema
const TypingIndicatorSchema = z.object({
  userId: z.string(),
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
      username: z.string(),
      password: z.string(),
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
      name: z.string(),
      description: z.string().optional(),
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
      name: z.string().optional(),
      description: z.string().optional(),
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
      content: z.string(),
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
      content: z.string(),
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
});

// Define errors
const errors = createErrorMap({
  'chat.invalid_credentials': {
    code: 'chat.invalid_credentials',
    message: 'Invalid username or password',
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