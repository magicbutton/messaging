import {
  AuthorizationProvider,
  Actor,
  Contract,
  RoleDefinition,
  PermissionDefinition,
  AccessSettings
} from "./types"

/**
 * Default implementation of the AuthorizationProvider interface
 * that uses the contract's role and permission definitions
 */
export class DefaultAuthorizationProvider<TContract extends Contract> implements AuthorizationProvider<TContract> {
  private contract: TContract
  private rolePermissions: Map<string, Set<string>> = new Map()
  private permissionActions: Map<string, Set<string>> = new Map()
  
  /**
   * Create a new DefaultAuthorizationProvider
   */
  constructor(contract: TContract) {
    this.contract = contract
    this.buildPermissionMaps()
  }
  
  /**
   * Build permission maps from the contract definitions
   */
  private buildPermissionMaps(): void {
    // Process role definitions
    if (this.contract.roles) {
      for (const [roleId, role] of Object.entries(this.contract.roles)) {
        this.processRole(roleId, role as RoleDefinition)
      }
    }
    
    // Process permission definitions
    if (this.contract.permissions) {
      for (const [permId, permission] of Object.entries(this.contract.permissions)) {
        this.processPermission(permId, permission as PermissionDefinition)
      }
    }
  }
  
  /**
   * Process a role definition and build permission map
   */
  private processRole(roleId: string, role: RoleDefinition): void {
    const permissions = new Set<string>()
    
    // Process inherited roles
    if (role.inherits) {
      for (const inheritedRoleId of role.inherits) {
        const inheritedPermissions = this.rolePermissions.get(inheritedRoleId)
        if (inheritedPermissions) {
          for (const permission of inheritedPermissions) {
            permissions.add(permission)
          }
        }
      }
    }
    
    // Store the combined permissions
    this.rolePermissions.set(roleId, permissions)
  }
  
  /**
   * Process a permission definition and build action map
   */
  private processPermission(permId: string, permission: PermissionDefinition): void {
    const actions = new Set<string>()
    
    // Add all actions for this permission
    for (const action of permission.actions) {
      actions.add(action)
    }
    
    // Store the actions
    this.permissionActions.set(permId, actions)
  }
  
  /**
   * Check if an actor has permission to access a request
   */
  async canAccessRequest(
    actor: Actor, 
    requestType: keyof TContract["requests"] & string
  ): Promise<boolean> {
    // System requests (starting with $) are always allowed
    if (requestType.startsWith('$')) {
      return true
    }
    
    // Get the request definition
    const requestDefinition = this.contract.requests[requestType]
    if (!requestDefinition) {
      return false
    }
    
    // Check access settings if they exist
    if ('requestSchema' in requestDefinition && requestDefinition.access) {
      return this.checkAccessSettings(actor, requestDefinition.access)
    } else if ('request' in requestDefinition && requestDefinition.access) {
      return this.checkAccessSettings(actor, requestDefinition.access)
    }
    
    // Fall back to permission-based check
    // Check for a direct permission
    const requestPermission = `request:${requestType}`
    if (await this.hasPermission(actor, requestPermission)) {
      return true
    }
    
    // Look for resource-level permissions
    const parts = requestType.split('.')
    if (parts.length > 1) {
      const resource = parts[0]
      const action = parts.slice(1).join('.')
      
      // Check for resource:action permission
      const resourceActionPermission = `${resource}:${action}`
      if (await this.hasPermission(actor, resourceActionPermission)) {
        return true
      }
      
      // Check for resource:* permission
      if (await this.hasPermission(actor, `${resource}:*`)) {
        return true
      }
    }
    
    // Check for super admin
    return await this.hasPermission(actor, "*")
  }
  
  /**
   * Check if an actor has permission to emit an event
   */
  async canEmitEvent(
    actor: Actor, 
    eventType: keyof TContract["events"] & string
  ): Promise<boolean> {
    // System events (starting with $) are always allowed
    if (eventType.startsWith('$')) {
      return true
    }
    
    // Get the event definition
    const eventDefinition = this.contract.events[eventType]
    if (!eventDefinition) {
      return false
    }
    
    // Check access settings if they exist
    if (typeof eventDefinition !== 'function' && 'schema' in eventDefinition && eventDefinition.access) {
      return this.checkAccessSettings(actor, eventDefinition.access)
    }
    
    // Fall back to permission-based check
    // Check for a direct permission
    const eventPermission = `emit:${eventType}`
    if (await this.hasPermission(actor, eventPermission)) {
      return true
    }
    
    // Look for resource-level permissions
    const parts = eventType.split('.')
    if (parts.length > 1) {
      const resource = parts[0]
      const action = parts.slice(1).join('.')
      
      // Check for resource:action permission
      const resourceActionPermission = `${resource}:emit:${action}`
      if (await this.hasPermission(actor, resourceActionPermission)) {
        return true
      }
      
      // Check for resource:emit:* permission
      if (await this.hasPermission(actor, `${resource}:emit:*`)) {
        return true
      }
    }
    
    // Check for super admin or global emit
    return (
      await this.hasPermission(actor, "*") || 
      await this.hasPermission(actor, "emit:*")
    )
  }
  
  /**
   * Check if an actor has permission to subscribe to an event
   */
  async canSubscribeToEvent(
    actor: Actor, 
    eventType: keyof TContract["events"] & string
  ): Promise<boolean> {
    // System events (starting with $) are always allowed
    if (eventType.startsWith('$')) {
      return true
    }
    
    // Get the event definition
    const eventDefinition = this.contract.events[eventType]
    if (!eventDefinition) {
      return false
    }
    
    // Check access settings if they exist
    if (typeof eventDefinition !== 'function' && 'schema' in eventDefinition && eventDefinition.access) {
      return this.checkAccessSettings(actor, eventDefinition.access)
    }
    
    // Fall back to permission-based check
    // Check for a direct permission
    const eventPermission = `subscribe:${eventType}`
    if (await this.hasPermission(actor, eventPermission)) {
      return true
    }
    
    // Look for resource-level permissions
    const parts = eventType.split('.')
    if (parts.length > 1) {
      const resource = parts[0]
      const action = parts.slice(1).join('.')
      
      // Check for resource:action permission
      const resourceActionPermission = `${resource}:subscribe:${action}`
      if (await this.hasPermission(actor, resourceActionPermission)) {
        return true
      }
      
      // Check for resource:subscribe:* permission
      if (await this.hasPermission(actor, `${resource}:subscribe:*`)) {
        return true
      }
    }
    
    // Check for super admin or global subscribe
    return (
      await this.hasPermission(actor, "*") || 
      await this.hasPermission(actor, "subscribe:*")
    )
  }
  
  /**
   * Check if an actor has a specific permission
   */
  async hasPermission(actor: Actor, permission: string): Promise<boolean> {
    // Check for directly assigned permissions
    if (actor.permissions && actor.permissions.includes(permission)) {
      return true
    }
    
    // No roles defined
    if (!actor.roles || !this.contract.roles) {
      return false
    }
    
    // Check permissions granted by roles
    for (const role of actor.roles) {
      const permissions = this.rolePermissions.get(role)
      
      if (permissions && (
        permissions.has(permission) || 
        permissions.has("*")
      )) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * Get all permissions for an actor
   */
  async getPermissions(actor: Actor): Promise<string[]> {
    const permissions = new Set<string>()
    
    // Add directly assigned permissions
    if (actor.permissions) {
      for (const permission of actor.permissions) {
        permissions.add(permission)
      }
    }
    
    // Add permissions from roles
    if (actor.roles && this.contract.roles) {
      for (const role of actor.roles) {
        const rolePerms = this.rolePermissions.get(role)
        if (rolePerms) {
          for (const permission of rolePerms) {
            permissions.add(permission)
          }
        }
      }
    }
    
    return Array.from(permissions)
  }
  
  /**
   * Check access settings for an actor - purely based on roles
   */
  private async checkAccessSettings<TRoleKey extends string = string>(
    actor: Actor, 
    access: AccessSettings<TRoleKey>
  ): Promise<boolean> {
    // If no roles, default to permissive
    if (!actor.roles || actor.roles.length === 0) {
      return !access.allowedRoles || access.allowedRoles.length === 0
    }
    
    // Check for denied roles (these take precedence)
    if (access.deniedRoles && access.deniedRoles.length > 0) {
      for (const role of actor.roles) {
        if (access.deniedRoles.includes(role as any)) {
          return false
        }
      }
    }
    
    // Check for allowed roles
    if (access.allowedRoles && access.allowedRoles.length > 0) {
      for (const role of actor.roles) {
        if (access.allowedRoles.includes(role as any)) {
          return true
        }
      }
      return false // No matching allowed role found
    }
    
    // If no allowed roles specified and no denied roles matched,
    // we allow access by default
    return true
  }
}