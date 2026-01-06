/**
 * Refresh Token Entity - JWT Refresh Token Management
 * 
 * This entity demonstrates:
 * - Refresh token storage and management
 * - Token expiration and revocation
 * - User association and tracking
 * - Security features (device tracking, IP logging)
 * - Token rotation for enhanced security
 * 
 * Educational Notes:
 * - Refresh tokens allow obtaining new access tokens without re-authentication
 * - They should be stored securely and have longer expiration times
 * - Token rotation prevents replay attacks
 * - Device tracking helps with security monitoring
 * - Proper cleanup prevents token accumulation
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
 * Refresh Token Entity
 * 
 * Educational: Refresh tokens are used to obtain new access tokens
 * without requiring the user to re-authenticate. They have longer
 * expiration times but should be stored securely.
 */
@Entity('refresh_tokens')
@Index(['token'], { unique: true })
@Index(['userId', 'isRevoked'])
@Index(['expiresAt'])
@Index(['deviceId'])
export class RefreshToken extends BaseEntity {
  /**
   * Token Value
   * 
   * Educational: The actual refresh token value. This should be
   * a cryptographically secure random string with sufficient entropy.
   */
  @Column({ unique: true, length: 255 })
  @Exclude() // Never expose the actual token in API responses
  token: string;

  /**
   * User ID
   * 
   * Educational: Foreign key to the user who owns this refresh token.
   */
  @Column({ name: 'user_id' })
  @ApiProperty({
    description: 'ID of the user who owns this refresh token',
    format: 'uuid',
  })
  userId: string;

  /**
   * Expiration Date
   * 
   * Educational: Refresh tokens should have expiration dates
   * to limit the window of potential misuse.
   */
  @Column({ name: 'expires_at' })
  @ApiProperty({
    description: 'When this refresh token expires',
    type: 'string',
    format: 'date-time',
  })
  expiresAt: Date;

  /**
   * Revocation Status
   * 
   * Educational: Revoked tokens should not be accepted for
   * generating new access tokens.
   */
  @Column({ name: 'is_revoked', default: false })
  @ApiProperty({
    description: 'Whether this refresh token has been revoked',
    example: false,
  })
  isRevoked: boolean;

  /**
   * Revocation Date
   * 
   * Educational: Track when tokens were revoked for audit purposes.
   */
  @Column({ name: 'revoked_at', nullable: true })
  @ApiPropertyOptional({
    description: 'When this refresh token was revoked',
    type: 'string',
    format: 'date-time',
  })
  revokedAt?: Date;

  /**
   * Revocation Reason
   * 
   * Educational: Track why tokens were revoked for security analysis.
   */
  @Column({ name: 'revoked_reason', nullable: true })
  @ApiPropertyOptional({
    description: 'Reason why this refresh token was revoked',
    example: 'User logout',
  })
  revokedReason?: string;

  /**
   * Device Information
   * 
   * Educational: Track device information for security monitoring
   * and to allow users to manage their active sessions.
   */
  @Column({ name: 'device_id', nullable: true })
  @ApiPropertyOptional({
    description: 'Unique identifier for the device',
    example: 'device-uuid-123',
  })
  deviceId?: string;

  @Column({ name: 'device_name', nullable: true })
  @ApiPropertyOptional({
    description: 'Human-readable device name',
    example: 'iPhone 12 Pro',
  })
  deviceName?: string;

  @Column({ name: 'device_type', nullable: true })
  @ApiPropertyOptional({
    description: 'Type of device',
    example: 'mobile',
  })
  deviceType?: string;

  /**
   * IP Address Tracking
   * 
   * Educational: Track IP addresses for security monitoring
   * and fraud detection.
   */
  @Column({ name: 'ip_address', nullable: true })
  @ApiPropertyOptional({
    description: 'IP address when token was created',
    example: '192.168.1.1',
  })
  ipAddress?: string;

  /**
   * User Agent
   * 
   * Educational: Store user agent for device identification
   * and security analysis.
   */
  @Column({ name: 'user_agent', nullable: true })
  @ApiPropertyOptional({
    description: 'User agent string when token was created',
    example: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  })
  userAgent?: string;

  /**
   * Last Used Date
   * 
   * Educational: Track when tokens were last used to identify
   * inactive sessions and potential security issues.
   */
  @Column({ name: 'last_used_at', nullable: true })
  @ApiPropertyOptional({
    description: 'When this refresh token was last used',
    type: 'string',
    format: 'date-time',
  })
  lastUsedAt?: Date;

  /**
   * Usage Count
   * 
   * Educational: Track how many times a token has been used.
   * This can help identify suspicious activity.
   */
  @Column({ name: 'usage_count', default: 0 })
  @ApiProperty({
    description: 'Number of times this refresh token has been used',
    example: 5,
  })
  usageCount: number;

  /**
   * Token Family
   * 
   * Educational: Token families help implement token rotation.
   * All tokens in a family are revoked when one is compromised.
   */
  @Column({ name: 'token_family', nullable: true })
  @ApiPropertyOptional({
    description: 'Token family for rotation tracking',
    example: 'family-uuid-123',
  })
  tokenFamily?: string;

  /**
   * Parent Token ID
   * 
   * Educational: Track token rotation chain for security analysis.
   */
  @Column({ name: 'parent_token_id', nullable: true })
  @ApiPropertyOptional({
    description: 'ID of the parent token (for rotation)',
    format: 'uuid',
  })
  parentTokenId?: string;

  // ==========================================
  // Relationships
  // ==========================================

  /**
   * User Relationship
   * 
   * Educational: Many-to-one relationship with User entity.
   * One user can have multiple refresh tokens (different devices).
   */
  @ManyToOne(() => User, user => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  @ApiProperty({
    description: 'User who owns this refresh token',
    type: () => User,
  })
  user: User;

  /**
   * Parent Token Relationship
   * 
   * Educational: Self-referencing relationship for token rotation.
   */
  @ManyToOne(() => RefreshToken, { nullable: true })
  @JoinColumn({ name: 'parent_token_id' })
  @ApiPropertyOptional({
    description: 'Parent token in rotation chain',
    type: () => RefreshToken,
  })
  parentToken?: RefreshToken;

  // ==========================================
  // Virtual Properties
  // ==========================================

  /**
   * Is Expired
   * 
   * Educational: Virtual property to check if token is expired.
   */
  get isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  /**
   * Is Valid
   * 
   * Educational: Virtual property to check if token is valid
   * (not expired and not revoked).
   */
  get isValid(): boolean {
    return !this.isExpired && !this.isRevoked;
  }

  /**
   * Days Until Expiration
   */
  get daysUntilExpiration(): number {
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
   * 
   * Educational: Generate token value and set expiration
   * if not already set.
   */
  @BeforeInsert()
  async beforeInsert(): Promise<void> {
    super.beforeInsert();

    // Generate token if not set
    if (!this.token) {
      this.token = this.generateToken();
    }

    // Set expiration if not set (default 30 days)
    if (!this.expiresAt) {
      this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // Generate token family if not set
    if (!this.tokenFamily) {
      this.tokenFamily = this.generateTokenFamily();
    }
  }

  // ==========================================
  // Business Logic Methods
  // ==========================================

  /**
   * Revoke Token
   * 
   * Educational: Revoke a refresh token with reason tracking.
   */
  revoke(reason?: string): void {
    this.isRevoked = true;
    this.revokedAt = new Date();
    this.revokedReason = reason || 'Manual revocation';
  }

  /**
   * Use Token
   * 
   * Educational: Mark token as used and update usage statistics.
   */
  use(ipAddress?: string): void {
    this.lastUsedAt = new Date();
    this.usageCount += 1;
    
    if (ipAddress) {
      this.ipAddress = ipAddress;
    }
  }

  /**
   * Check if Token Can Be Used
   * 
   * Educational: Comprehensive validation for token usage.
   */
  canBeUsed(): boolean {
    return this.isValid && !this.isExpired && !this.isRevoked;
  }

  /**
   * Get Device Summary
   * 
   * Educational: Get a summary of device information for display.
   */
  getDeviceSummary(): string {
    if (this.deviceName) {
      return this.deviceName;
    }
    
    if (this.deviceType) {
      return `${this.deviceType} device`;
    }
    
    if (this.userAgent) {
      // Extract browser/device info from user agent
      const match = this.userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera|Mobile)/i);
      return match ? match[1] : 'Unknown device';
    }
    
    return 'Unknown device';
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  /**
   * Generate Secure Token
   * 
   * Educational: Generate a cryptographically secure token
   * with sufficient entropy.
   */
  private generateToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Generate Token Family ID
   * 
   * Educational: Generate a unique identifier for token families.
   */
  private generateTokenFamily(): string {
    const crypto = require('crypto');
    return crypto.randomUUID();
  }
}