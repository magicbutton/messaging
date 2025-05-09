import type { Actor } from "./types"

/**
 * Role definition
 */
export interface Role {
  name: string
  permissions: string[]
  extends?: string[]
}

/**
 * System definition
 */
export interface System {
  name: string
  resources: string[]
  actions: string[]
  roles: Role[]
}

/**
 * Create a role
 * @param role The role definition
 * @returns The role
 */
export function createRole(role: Role): Role {
  return role
}

/**
 * Create a system
 * @param system The system definition
 * @returns The system
 */
export function createSystem(system: System): System {
  return system
}

/**
 * Create an actor
 * @param actor The actor definition
 * @returns The actor
 */
export function createActor(actor: Actor): Actor {
  return actor
}

/**
 * Access control interface
 */
export interface AccessControl {
  /**
   * Check if an actor has a permission
   * @param actor The actor
   * @param permission The permission
   * @returns True if the actor has the permission
   */
  hasPermission(actor: Actor, permission: string): boolean

  /**
   * Check if an actor has a role
   * @param actor The actor
   * @param role The role
   * @returns True if the actor has the role
   */
  hasRole(actor: Actor, role: string): boolean

  /**
   * Get all permissions for an actor
   * @param actor The actor
   * @returns The permissions
   */
  getPermissions(actor: Actor): string[]

  /**
   * Get all roles for an actor
   * @param actor The actor
   * @returns The roles
   */
  getRoles(actor: Actor): string[]
}

/**
 * Create an access control instance
 * @param system The system
 * @returns The access control instance
 */
export function createAccessControl(system: System): AccessControl {
  // Build role hierarchy
  const rolePermissions = new Map<string, Set<string>>()

  // Helper function to get all permissions for a role
  const getAllPermissions = (roleName: string, visited = new Set<string>()): Set<string> => {
    if (visited.has(roleName)) {
      return new Set<string>()
    }

    visited.add(roleName)

    const role = system.roles.find((r) => r.name === roleName)
    if (!role) {
      return new Set<string>()
    }

    const permissions = new Set(role.permissions)

    if (role.extends) {
      for (const extendedRole of role.extends) {
        const extendedPermissions = getAllPermissions(extendedRole, visited)
        for (const permission of extendedPermissions) {
          permissions.add(permission)
        }
      }
    }

    return permissions
  }

  // Build role permissions map
  for (const role of system.roles) {
    rolePermissions.set(role.name, getAllPermissions(role.name))
  }

  return {
    hasPermission(actor: Actor, permission: string): boolean {
      // Check direct permissions
      if (actor.permissions && actor.permissions.includes(permission)) {
        return true
      }

      // Check role-based permissions
      if (actor.roles) {
        for (const role of actor.roles) {
          const permissions = rolePermissions.get(role)
          if (permissions && permissions.has(permission)) {
            return true
          }
        }
      }

      return false
    },

    hasRole(actor: Actor, role: string): boolean {
      return actor.roles ? actor.roles.includes(role) : false
    },

    getPermissions(actor: Actor): string[] {
      const permissions = new Set<string>(actor.permissions || [])

      if (actor.roles) {
        for (const role of actor.roles) {
          const rolePerms = rolePermissions.get(role)
          if (rolePerms) {
            for (const perm of rolePerms) {
              permissions.add(perm)
            }
          }
        }
      }

      return Array.from(permissions)
    },

    getRoles(actor: Actor): string[] {
      return actor.roles || []
    },
  }
}
