import { v4 as uuidv4 } from "uuid"
import { AuthProvider, AuthResult, Actor } from "./types"

/**
 * Default implementation of the AuthProvider interface
 * that uses in-memory storage for users and tokens
 */
export class DefaultAuthProvider implements AuthProvider {
  private users: Map<string, { 
    id: string;
    username: string;
    password: string;
    roles?: string[];
  }> = new Map()
  
  private tokens: Map<string, {
    userId: string;
    expiresAt: number;
  }> = new Map()
  
  /**
   * Create a new DefaultAuthProvider with optional initial users
   */
  constructor(initialUsers: Array<{
    id: string;
    username: string;
    password: string;
    roles?: string[];
  }> = []) {
    // Register initial users
    initialUsers.forEach(user => {
      this.registerUser(user.id, user.username, user.password, user.roles)
    })
  }
  
  /**
   * Register a new user
   */
  registerUser(id: string, username: string, password: string, roles?: string[]): void {
    this.users.set(username, {
      id,
      username,
      password,
      roles
    })
  }
  
  /**
   * Remove a user
   */
  removeUser(username: string): boolean {
    return this.users.delete(username)
  }
  
  /**
   * Authenticate a user with credentials
   */
  async authenticate(credentials: { username: string; password: string } | { token: string }): Promise<AuthResult> {
    if ("token" in credentials) {
      // Token authentication
      return this.authenticateWithToken(credentials.token)
    } else {
      // Username/password authentication
      return this.authenticateWithPassword(credentials.username, credentials.password)
    }
  }
  
  /**
   * Authenticate with username and password
   */
  private async authenticateWithPassword(username: string, password: string): Promise<AuthResult> {
    const user = this.users.get(username)
    
    if (!user || user.password !== password) {
      return {
        success: false,
        error: {
          code: "invalid_credentials",
          message: "Invalid username or password"
        }
      }
    }
    
    // Create a token
    const token = uuidv4()
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    
    this.tokens.set(token, {
      userId: user.id,
      expiresAt
    })
    
    return {
      success: true,
      token,
      expiresAt,
      user: {
        id: user.id,
        username: user.username,
        roles: user.roles
      }
    }
  }
  
  /**
   * Authenticate with token
   */
  private async authenticateWithToken(token: string): Promise<AuthResult> {
    const verification = await this.verifyToken(token)
    
    if (!verification.valid || !verification.actor) {
      return {
        success: false,
        error: {
          code: "invalid_token",
          message: "Invalid or expired token"
        }
      }
    }
    
    const tokenInfo = this.tokens.get(token)!
    
    return {
      success: true,
      token,
      expiresAt: tokenInfo.expiresAt,
      user: {
        id: verification.actor.id,
        username: verification.actor.type === 'user' ? String(verification.actor.metadata?.username) : verification.actor.id,
        roles: verification.actor.roles
      }
    }
  }
  
  /**
   * Verify a token is valid
   */
  async verifyToken(token: string): Promise<{ valid: boolean; actor?: Actor }> {
    const tokenInfo = this.tokens.get(token)
    
    if (!tokenInfo) {
      return { valid: false }
    }
    
    if (tokenInfo.expiresAt < Date.now()) {
      // Token has expired
      this.tokens.delete(token)
      return { valid: false }
    }
    
    // Find the user
    const user = Array.from(this.users.values()).find(u => u.id === tokenInfo.userId)
    
    if (!user) {
      return { valid: false }
    }
    
    return {
      valid: true,
      actor: {
        id: user.id,
        type: 'user',
        roles: user.roles,
        metadata: {
          username: user.username
        }
      }
    }
  }
  
  /**
   * Logout a user by invalidating their token
   */
  async logout(token: string): Promise<void> {
    this.tokens.delete(token)
  }
}