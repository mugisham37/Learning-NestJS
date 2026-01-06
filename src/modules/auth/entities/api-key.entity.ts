/**
 * API Key Entity - Service-to-Service Authentication
 * 
 * This entity demonstrates:
 * - API key generation and management
 * - Service-to-service authentication
 * - Key rotation and expiration
 * - Usage tracking and rate limiting
 * - Scope-based permissions
 * - Security features (IP whitelisting, usage monitoring)
 * 
 * Educational Notes:
 * - API keys are used for service-to-service authentication
 * - They should have limited scopes and permissions
 * - Regular rotation improves security
 * - Usage tracking helps with monitoring and billing
 * - IP whitelisting adds an extra security layer
 */

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseEntity } from '../../../entities/base.entity';
import { User } from '../../../entities/user.entity';

/**
 * API Key Scope Enum
 * 
 * Educational: Scopes define what operations an API key can perform.
 * This implements the principle of least privilege.
 */
export enum ApiKeyScope {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin',
  TASKS_READ = 'tasks:read',
  TASKS_WRITE = 'tasks:write',
  PROJECTS_READ = 'projects:read',
  PROJECTS_WRITE = 'projects:write',
  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',
  FILES_READ = 'files:read',
  FILES_WRITE = 'files:write',
  ANALYTICS_READ = 'analytics:read',
  WEBHOOKS = 'webhooks',
}

/**
 * API Key Status Enum
 */
export enum ApiKeyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

/**
 * API Key Entity
 * 
 * Educational: API keys provide a way for services and applications
 * to authenticate with the API without user credentials.
 */
@Entity('api_keys')
@Index(['keyHash'], { unique: true })
@Index(['userId', 'status'])
@Index(['expiresAt'])
@Index(['name'])
export class ApiKey extends BaseEntity {
  /**
   * Key Name
   * 
   * Educational: Human-readable name to help users identify
   * and manage their API keys.
   */
  @Column({ length: 100 })
  @ApiProperty({
    description: 'Human-readable name for the API key',
    example: 'Production API Key',
    maxLength: 100,
  })
  name: string;

  /**
   * Key Hash
   * 
   * Educational: Store a hash of the API key instead of the
   * plain text for security. The actual key is only shown once.
   */
  @Column({ name: 'key_hash', unique: true })
  @Exclude() // Never expose the hash in API responses
  keyHash: string;

  /**
   * Key Prefix
   * 
   * Educational: Store a prefix of the key for identification
   * purposes without exposing the full key.
   */
  @Column({ name: 'key_prefix', length: 10 })
  @ApiProperty({
    description: 'Prefix of the API key for identification',
    example: 'ak_12345',
  })
  keyPrefix: string;

  /**
   * User ID
   * 
   * Educational: API keys are associated with users for
   * permission and audit purposes.
   */
  @Column({ name: 'user_id' })
  @ApiProperty({
    description: 'ID of the user who owns this API key',
    format: 'uuid',
  })
  userId: string;

  /**
   * Description
   * 
   * Educational: Optional description to help users remember
   * what each API key is used for.
   */
  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional({
    description: 'Optional description of the API key usage',
    example: 'Used by the mobile app for task synchronization',
  })
  description?: string;

  /**
   * Status
   * 
   * Educational: Track the lifecycle status of API keys.
   */
  @Column({
    type: 'enum',
    enum: ApiKeyStatus,
    default: ApiKeyStatus.ACTIVE,
  })
  @ApiProperty({
    enum: ApiKeyStatus,
    description: 'Current status of the API key',
    example: ApiKeyStatus.ACTIVE,
  })
  status: ApiKeyStatus;

  /**
   * Scopes
   * 
   * Educational: Array of scopes that define what operations
   * this API key can perform.
   */
  @Column({
    type: 'simple-array',
    nullable: true,
  })
  @ApiPropertyOptional({
    description: 'Scopes/permissions for this API key',
    type: [String],
    enum: ApiKeyScope,
    example: [ApiKeyScope.TASKS_READ, ApiKeyScope.PROJECTS_READ],
  })
  scopes?: ApiKeyScope[];

  /**
   * Expiration Date
   * 
   * Educational: API keys should have expiration dates
   * to limit the window of potential misuse.
   */
  @Column({ name: 'expires_at', nullable: true })
  @ApiPropertyOptional({
    description: 'When this API key expires (null for no expiration)',
    type: 'string',
    format: 'date-time',
  })
  expiresAt?: Date;

  /**
   * Last Used Date
   * 
   * Educational: Track when API keys were last used for
   * security monitoring and cleanup.
   */
  @Column({ name: 'last_used_at', nullable: true })
  @ApiPropertyOptional({
    description: 'When this API key was last used',
    type: 'string',
    format: 'date-time',
  })
  lastUsedAt?: Date;

  /**
   * Usage Count
   * 
   * Educational: Track how many times an API key has been used.
   */
  @Column({ name: 'usage_count', default: 0 })
  @ApiProperty({
    description: 'Number of times this API key has been used',
    example: 1250,
  })
  usageCount: number;

  /**
   * Rate Limit
   * 
   * Educational: Per-key rate limiting for API usage control.
   */
  @Column({ name: 'rate_limit_per_hour', nullable: true })
  @ApiPropertyOptional({
    description: 'Maximum requests per hour (null for no limit)',
    example: 1000,
  })
  rateLimitPerHour?: number;

  /**
   * IP Whitelist
   * 
   * Educational: Restrict API key usage to specific IP addresses
   * for enhanced security.
   */
  @Column({
    type: 'simple-array',
    nullable: true,
  })
  @ApiPropertyOptional({
    description: 'Whitelisted IP addresses (null for no restriction)',
    type: [String],
    example: ['192.168.1.1', '10.0.0.0/8'],
  })
  ipWhitelist?: string[];

  /**
   * Referrer Whitelist
   * 
   * Educational: Restrict API key usage to specific referrers
   * for web-based applications.
   */
  @Column({
    type: 'simple-array',
    nullable: true,
  })
  @ApiPropertyOptional({
    description: 'Whitelisted referrer domains (null for no restriction)',
    type: [String],
    example: ['https://myapp.com', 'https://*.myapp.com'],
  })
  referrerWhitelist?: string[];

  /**
   * Environment
   * 
   * Educational: Tag API keys with environment information
   * for better organization and security.
   */
  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: 'Environment this API key is intended for',
    example: 'production',
  })
  environment?: string;

  /**
   * Revocation Information
   */
  @Column({ name: 'revoked_at', nullable: true })
  @ApiPropertyOptional({
    description: 'When this API key was revoked',
    type: 'string',
    format: 'date-time',
  })
  revokedAt?: Date;

  @Column({ name: 'revoked_reason', nullable: true })
  @ApiPropertyOptional({
    description: 'Reason why this API key was revoked',
    example: 'Security breach',
  })
  revokedReason?: string;

  // ==========================================
  // Relationships
  // ==========================================

  /**
   * User Relationship
   * 
   * Educational: Many-to-one relationship with User entity.
   * One user can have multiple API keys.
   */
  @ManyToOne(() => User, user => user.apiKeys, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  @ApiProperty({
    description: 'User who owns this API key',
    type: () => User,
  })
  user: User;

  // ==========================================
  // Virtual Properties
  // ==========================================

  /**
   * Is Expired
   */
  get isExpired(): boolean {
    return this.expiresAt ? this.expiresAt < new Date() : false;
  }

  /**
   * Is Active
   */
  get isActive(): boolean {
    return this.status === ApiKeyStatus.ACTIVE && !this.isExpired;
  }

  /**
   * Days Until Expiration
   */
  get daysUntilExpiration(): number | null {
    if (!this.expiresAt) return null;
    const now = new Date();
    const diffTime = this.expiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Days Since Last Use
   */
  get daysSinceLastUse(): number | null {
    if (!this.lastUsedAt) return null;
    const now = new Date();
    const diffTime = now.getTime() - this.lastUsedAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // ==========================================
  // Entity Lifecycle Hooks
  // ==========================================

  /**
   * Before Insert Hook
   */
  @BeforeInsert()
  async beforeInsert(): Promise<void> {
    super.beforeInsert();

    // Set default scopes if none provided
    if (!this.scopes || this.scopes.length === 0) {
      this.scopes = [ApiKeyScope.READ];
    }
  }

  // ==========================================
  // Business Logic Methods
  // ==========================================

  /**
   * Check if API Key Has Scope
   * 
   * Educational: Check if the API key has a specific scope/permission.
   */
  hasScope(scope: ApiKeyScope): boolean {
    if (!this.scopes) return false;
    
    // Admin scope grants all permissions
    if (this.scopes.includes(ApiKeyScope.ADMIN)) return true;
    
    // Check for specific scope
    if (this.scopes.includes(scope)) return true;
    
    // Check for broader scopes
    if (scope.includes(':read') && this.scopes.includes(ApiKeyScope.READ)) return true;
    if (scope.includes(':write') && this.scopes.includes(ApiKeyScope.WRITE)) return true;
    
    return false;
  }

  /**
   * Check if IP is Whitelisted
   * 
   * Educational: Validate if a request IP is allowed to use this key.
   */
  isIpAllowed(ip: string): boolean {
    if (!this.ipWhitelist || this.ipWhitelist.length === 0) return true;
    
    return this.ipWhitelist.some(allowedIp => {
      // Exact match
      if (allowedIp === ip) return true;
      
      // CIDR notation support (basic implementation)
      if (allowedIp.includes('/')) {
        // This is a simplified CIDR check - in production, use a proper library
        const [network, prefixLength] = allowedIp.split('/');
        // Implementation would go here
        return false;
      }
      
      return false;
    });
  }

  /**
   * Check if Referrer is Whitelisted
   */
  isReferrerAllowed(referrer: string): boolean {
    if (!this.referrerWhitelist || this.referrerWhitelist.length === 0) return true;
    
    return this.referrerWhitelist.some(allowedReferrer => {
      // Exact match
      if (allowedReferrer === referrer) return true;
      
      // Wildcard support
      if (allowedReferrer.includes('*')) {
        const pattern = allowedReferrer.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(referrer);
      }
      
      return false;
    });
  }

  /**
   * Use API Key
   * 
   * Educational: Mark API key as used and update usage statistics.
   */
  use(): void {
    this.lastUsedAt = new Date();
    this.usageCount += 1;
  }

  /**
   * Revoke API Key
   */
  revoke(reason?: string): void {
    this.status = ApiKeyStatus.REVOKED;
    this.revokedAt = new Date();
    this.revokedReason = reason || 'Manual revocation';
  }

  /**
   * Check if API Key Can Be Used
   */
  canBeUsed(): boolean {
    return this.isActive && !this.isExpired && this.status === ApiKeyStatus.ACTIVE;
  }

  /**
   * Generate API Key
   * 
   * Educational: Generate a new API key with proper format and security.
   */
  static generateApiKey(): { key: string; hash: string; prefix: string } {
    const crypto = require('crypto');
    
    // Generate random bytes for the key
    const keyBytes = crypto.randomBytes(32);
    const key = `ak_${keyBytes.toString('hex')}`;
    
    // Create hash for storage
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    
    // Create prefix for identification
    const prefix = key.substring(0, 8);
    
    return { key, hash, prefix };
  }

  /**
   * Verify API Key
   * 
   * Educational: Verify if a provided key matches this API key.
   */
  verifyKey(providedKey: string): boolean {
    const crypto = require('crypto');
    const providedHash = crypto.createHash('sha256').update(providedKey).digest('hex');
    return this.keyHash === providedHash;
  }
}