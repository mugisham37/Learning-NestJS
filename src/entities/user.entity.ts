/**
 * User Entity - Comprehensive User Management
 * 
 * This entity demonstrates:
 * - Complete user profile with validation
 * - Multiple authentication methods
 * - Role-based access control
 * - User preferences and settings
 * - Profile picture and avatar management
 * - Account status and lifecycle management
 * - Relationship mapping to other entities
 * - Security features (password hashing, 2FA)
 * 
 * Educational Notes:
 * - Entities represent database tables and business objects
 * - Decorators define column properties and constraints
 * - Relationships define how entities connect to each other
 * - Validation ensures data integrity at the application level
 * - Indexes improve query performance
 * - Virtual properties provide computed values
 * - Entity listeners handle lifecycle events
 */

import {
  Entity,
  Column,
  Index,
  OneToMany,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from 'typeorm';
import {
  IsEmail,
  IsString,
  Length,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsUrl,
  IsPhoneNumber,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';

import { BaseEntity } from './base.entity';
import { UserRole, UserStatus, EnumMetadata } from './enums';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { Comment } from './comment.entity';
import { ActivityLog } from './activity-log.entity';
import { ProjectMember } from './project-member.entity';

/**
 * User Preferences Interface
 * 
 * Educational: JSON columns allow storing structured data
 * while maintaining type safety through interfaces.
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    taskAssigned: boolean;
    taskCompleted: boolean;
    projectUpdates: boolean;
    comments: boolean;
    mentions: boolean;
  };
  privacy: {
    profileVisible: boolean;
    emailVisible: boolean;
    activityVisible: boolean;
  };
  dashboard: {
    defaultView: 'list' | 'board' | 'calendar';
    itemsPerPage: number;
    showCompletedTasks: boolean;
  };
}

/**
 * User Profile Interface
 * 
 * Educational: Separating profile data into an interface
 * makes it easier to manage and validate complex nested data.
 */
export interface UserProfile {
  bio?: string;
  website?: string;
  location?: string;
  company?: string;
  jobTitle?: string;
  skills: string[];
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
  };
  experience: {
    years: number;
    level: 'junior' | 'mid' | 'senior' | 'lead' | 'architect';
  };
}

/**
 * User Security Settings Interface
 * 
 * Educational: Security settings are stored separately
 * to make it easier to manage and audit security features.
 */
export interface UserSecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  lastPasswordChange: Date;
  passwordExpiresAt?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  trustedDevices: string[];
  sessionTimeout: number; // in minutes
}

/**
 * User Entity
 * 
 * Educational: This entity demonstrates comprehensive user management
 * with authentication, authorization, preferences, and relationships.
 */
@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
@Index(['role', 'status'])
@Index(['createdAt'])
@Index(['lastLoginAt'])
export class User extends BaseEntity {
  // ==========================================
  // Basic Information
  // ==========================================

  /**
   * Email Address (Unique)
   * 
   * Educational: Email is used for authentication and communication.
   * Unique constraint prevents duplicate accounts.
   */
  @Column({ unique: true, length: 255 })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @ApiProperty({
    description: 'User email address (unique)',
    example: 'john.doe@example.com',
    format: 'email',
  })
  email: string;

  /**
   * Username (Unique)
   * 
   * Educational: Username provides a user-friendly identifier
   * that's easier to remember than email addresses.
   */
  @Column({ unique: true, length: 50 })
  @IsString()
  @Length(3, 50, { message: 'Username must be between 3 and 50 characters' })
  @ApiProperty({
    description: 'Unique username',
    example: 'johndoe',
    minLength: 3,
    maxLength: 50,
  })
  username: string;

  /**
   * Password Hash
   * 
   * Educational: Passwords are hashed using bcrypt for security.
   * The @Exclude decorator prevents the hash from being serialized.
   */
  @Column({ name: 'password_hash' })
  @Exclude()
  passwordHash: string;

  /**
   * First Name
   */
  @Column({ name: 'first_name', length: 100 })
  @IsString()
  @Length(1, 100, { message: 'First name must be between 1 and 100 characters' })
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    maxLength: 100,
  })
  firstName: string;

  /**
   * Last Name
   */
  @Column({ name: 'last_name', length: 100 })
  @IsString()
  @Length(1, 100, { message: 'Last name must be between 1 and 100 characters' })
  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    maxLength: 100,
  })
  lastName: string;

  /**
   * Display Name (Optional)
   * 
   * Educational: Display name allows users to choose how
   * they appear to others, separate from their real name.
   */
  @Column({ name: 'display_name', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @ApiPropertyOptional({
    description: 'Display name for public profile',
    example: 'Johnny D',
    maxLength: 100,
  })
  displayName?: string;

  // ==========================================
  // Contact Information
  // ==========================================

  /**
   * Phone Number (Optional)
   */
  @Column({ name: 'phone_number', length: 20, nullable: true })
  @IsOptional()
  @IsPhoneNumber(null, { message: 'Please provide a valid phone number' })
  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1-555-123-4567',
  })
  phoneNumber?: string;

  /**
   * Avatar URL
   * 
   * Educational: Avatar URLs can point to uploaded files
   * or external services like Gravatar.
   */
  @Column({ name: 'avatar_url', nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid avatar URL' })
  @ApiPropertyOptional({
    description: 'URL to user avatar image',
    example: 'https://example.com/avatars/johndoe.jpg',
    format: 'uri',
  })
  avatarUrl?: string;

  // ==========================================
  // Account Management
  // ==========================================

  /**
   * User Role
   * 
   * Educational: Roles define what actions users can perform
   * in the system. This implements role-based access control (RBAC).
   */
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsEnum(UserRole, { message: 'Please provide a valid user role' })
  @ApiProperty(EnumMetadata.UserRole)
  role: UserRole;

  /**
   * Account Status
   * 
   * Educational: Status tracks the account lifecycle and
   * can be used to implement features like email verification.
   */
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  @IsEnum(UserStatus, { message: 'Please provide a valid user status' })
  @ApiProperty(EnumMetadata.UserStatus)
  status: UserStatus;

  /**
   * Email Verified Flag
   * 
   * Educational: Email verification is a common security practice
   * to ensure users own the email addresses they register with.
   */
  @Column({ name: 'email_verified', default: false })
  @IsBoolean()
  @ApiProperty({
    description: 'Whether the user email has been verified',
    example: true,
  })
  emailVerified: boolean;

  /**
   * Email Verification Token
   * 
   * Educational: Verification tokens are used to confirm
   * email ownership. They should be excluded from API responses.
   */
  @Column({ name: 'email_verification_token', nullable: true })
  @Exclude()
  emailVerificationToken?: string;

  /**
   * Password Reset Token
   * 
   * Educational: Reset tokens allow users to securely
   * reset their passwords. Always exclude from responses.
   */
  @Column({ name: 'password_reset_token', nullable: true })
  @Exclude()
  passwordResetToken?: string;

  /**
   * Password Reset Expires At
   */
  @Column({ name: 'password_reset_expires_at', nullable: true })
  @Exclude()
  passwordResetExpiresAt?: Date;

  // ==========================================
  // Activity Tracking
  // ==========================================

  /**
   * Last Login Timestamp
   * 
   * Educational: Tracking login activity helps with
   * security monitoring and user engagement analytics.
   */
  @Column({ name: 'last_login_at', nullable: true })
  @ApiPropertyOptional({
    description: 'Timestamp of last login',
    type: 'string',
    format: 'date-time',
  })
  lastLoginAt?: Date;

  /**
   * Last Login IP Address
   */
  @Column({ name: 'last_login_ip', nullable: true })
  @ApiPropertyOptional({
    description: 'IP address of last login',
    example: '192.168.1.1',
  })
  lastLoginIp?: string;

  /**
   * Login Count
   * 
   * Educational: Tracking login frequency can help
   * identify user engagement and potential security issues.
   */
  @Column({ name: 'login_count', default: 0 })
  @ApiProperty({
    description: 'Total number of logins',
    example: 42,
  })
  loginCount: number;

  // ==========================================
  // User Data (JSON Columns)
  // ==========================================

  /**
   * User Preferences
   * 
   * Educational: JSON columns allow storing structured data
   * while maintaining flexibility for different preference types.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'User preferences and settings',
    type: 'object',
    example: {
      theme: 'dark',
      language: 'en',
      notifications: { email: true, push: false },
    },
  })
  preferences?: UserPreferences;

  /**
   * User Profile
   * 
   * Educational: Profile data is stored as JSON to allow
   * flexible schema evolution without database migrations.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'Extended user profile information',
    type: 'object',
    example: {
      bio: 'Software developer with 5 years experience',
      skills: ['JavaScript', 'TypeScript', 'Node.js'],
    },
  })
  profile?: UserProfile;

  /**
   * Security Settings
   * 
   * Educational: Security settings are stored separately
   * and excluded from most API responses for security.
   */
  @Column({ type: 'jsonb', nullable: true })
  @Exclude()
  securitySettings?: UserSecuritySettings;

  // ==========================================
  // Relationships
  // ==========================================

  /**
   * Owned Projects
   * 
   * Educational: OneToMany relationship where one user
   * can own multiple projects. The foreign key is on the Project entity.
   */
  @OneToMany(() => Project, project => project.owner, {
    cascade: ['soft-remove'],
  })
  @ApiPropertyOptional({
    description: 'Projects owned by this user',
    type: () => [Project],
  })
  ownedProjects?: Project[];

  /**
   * Assigned Tasks
   * 
   * Educational: OneToMany relationship for tasks assigned to this user.
   */
  @OneToMany(() => Task, task => task.assignee)
  @ApiPropertyOptional({
    description: 'Tasks assigned to this user',
    type: () => [Task],
  })
  assignedTasks?: Task[];

  /**
   * Created Comments
   * 
   * Educational: OneToMany relationship for comments created by this user.
   */
  @OneToMany(() => Comment, comment => comment.author)
  @ApiPropertyOptional({
    description: 'Comments created by this user',
    type: () => [Comment],
  })
  comments?: Comment[];

  /**
   * Activity Logs
   * 
   * Educational: OneToMany relationship for tracking user activities.
   */
  @OneToMany(() => ActivityLog, log => log.user)
  @ApiPropertyOptional({
    description: 'Activity logs for this user',
    type: () => [ActivityLog],
  })
  activityLogs?: ActivityLog[];

  /**
   * Project Memberships
   * 
   * Educational: OneToMany relationship through ProjectMember
   * for projects where this user is a member (not owner).
   */
  @OneToMany(() => ProjectMember, member => member.user)
  @ApiPropertyOptional({
    description: 'Project memberships for this user',
    type: () => [ProjectMember],
  })
  projectMemberships?: ProjectMember[];

  /**
   * Member Projects (Many-to-Many through ProjectMember)
   * 
   * Educational: This demonstrates a many-to-many relationship
   * with additional attributes (role, joinedAt) stored in the junction table.
   */
  @ManyToMany(() => Project, project => project.members)
  @ApiPropertyOptional({
    description: 'Projects where this user is a member',
    type: () => [Project],
  })
  memberProjects?: Project[];

  // ==========================================
  // Virtual Properties
  // ==========================================

  /**
   * Full Name
   * 
   * Educational: Virtual properties are computed at runtime
   * and provide convenient access to derived values.
   */
  @Expose()
  @ApiProperty({
    description: 'Full name (first + last)',
    example: 'John Doe',
  })
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Display Name or Full Name
   * 
   * Educational: This property provides a fallback mechanism
   * for displaying user names in the UI.
   */
  @Expose()
  @ApiProperty({
    description: 'Display name or full name if display name is not set',
    example: 'Johnny D',
  })
  get displayNameOrFull(): string {
    return this.displayName || this.fullName;
  }

  /**
   * Initials
   * 
   * Educational: Initials are useful for avatar placeholders
   * when no profile picture is available.
   */
  @Expose()
  @ApiProperty({
    description: 'User initials',
    example: 'JD',
  })
  get initials(): string {
    const first = this.firstName?.charAt(0)?.toUpperCase() || '';
    const last = this.lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}`;
  }

  /**
   * Is Admin
   * 
   * Educational: Convenience property for checking admin privileges.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the user has admin privileges',
    example: false,
  })
  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.SUPER_ADMIN;
  }

  /**
   * Is Active
   * 
   * Educational: Convenience property for checking if account is active.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
  })
  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  /**
   * Account Age in Days
   */
  @Expose()
  @ApiProperty({
    description: 'Account age in days',
    example: 365,
  })
  get accountAgeDays(): number {
    return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Days Since Last Login
   */
  @Expose()
  @ApiProperty({
    description: 'Days since last login',
    example: 7,
  })
  get daysSinceLastLogin(): number | null {
    if (!this.lastLoginAt) return null;
    return Math.floor((Date.now() - this.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  // ==========================================
  // Entity Lifecycle Hooks
  // ==========================================

  /**
   * Before Insert Hook
   * 
   * Educational: This hook runs before the entity is inserted
   * into the database. It's used for data preparation and validation.
   */
  @BeforeInsert()
  async beforeInsert(): Promise<void> {
    // Call parent hook
    super.beforeInsert();

    // Initialize default preferences if not set
    if (!this.preferences) {
      this.preferences = this.getDefaultPreferences();
    }

    // Initialize security settings
    if (!this.securitySettings) {
      this.securitySettings = this.getDefaultSecuritySettings();
    }

    // Generate email verification token if email is not verified
    if (!this.emailVerified && !this.emailVerificationToken) {
      this.emailVerificationToken = this.generateToken();
    }

    // Ensure display name is set
    if (!this.displayName) {
      this.displayName = this.fullName;
    }
  }

  /**
   * Before Update Hook
   * 
   * Educational: This hook runs before the entity is updated.
   * It's useful for maintaining data consistency and audit trails.
   */
  @BeforeUpdate()
  async beforeUpdate(): Promise<void> {
    // Call parent hook
    super.beforeUpdate();

    // Update display name if it matches the old full name
    if (this.displayName === `${this.firstName} ${this.lastName}`.trim()) {
      this.displayName = this.fullName;
    }
  }

  /**
   * After Load Hook
   * 
   * Educational: This hook runs after the entity is loaded from the database.
   * It's useful for data transformation and computed properties.
   */
  @AfterLoad()
  afterLoad(): void {
    // Ensure preferences have default values
    if (this.preferences) {
      this.preferences = { ...this.getDefaultPreferences(), ...this.preferences };
    }
  }

  // ==========================================
  // Business Logic Methods
  // ==========================================

  /**
   * Set Password
   * 
   * Educational: Password hashing should always be done
   * in the entity to ensure consistency and security.
   */
  async setPassword(password: string): Promise<void> {
    const saltRounds = 12; // Higher rounds = more secure but slower
    this.passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Update security settings
    if (!this.securitySettings) {
      this.securitySettings = this.getDefaultSecuritySettings();
    }
    this.securitySettings.lastPasswordChange = new Date();
    this.securitySettings.loginAttempts = 0;
    this.securitySettings.lockedUntil = undefined;
  }

  /**
   * Verify Password
   * 
   * Educational: Password verification should be done
   * in the entity to maintain encapsulation.
   */
  async verifyPassword(password: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return bcrypt.compare(password, this.passwordHash);
  }

  /**
   * Update Last Login
   * 
   * Educational: Login tracking helps with security
   * monitoring and user engagement analytics.
   */
  updateLastLogin(ipAddress?: string): void {
    this.lastLoginAt = new Date();
    this.loginCount += 1;
    
    if (ipAddress) {
      this.lastLoginIp = ipAddress;
    }

    // Reset failed login attempts on successful login
    if (this.securitySettings) {
      this.securitySettings.loginAttempts = 0;
      this.securitySettings.lockedUntil = undefined;
    }
  }

  /**
   * Increment Failed Login Attempts
   * 
   * Educational: Tracking failed login attempts helps
   * prevent brute force attacks.
   */
  incrementFailedLoginAttempts(): void {
    if (!this.securitySettings) {
      this.securitySettings = this.getDefaultSecuritySettings();
    }

    this.securitySettings.loginAttempts += 1;

    // Lock account after 5 failed attempts for 30 minutes
    if (this.securitySettings.loginAttempts >= 5) {
      this.securitySettings.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
  }

  /**
   * Check if Account is Locked
   */
  isAccountLocked(): boolean {
    if (!this.securitySettings?.lockedUntil) return false;
    return this.securitySettings.lockedUntil > new Date();
  }

  /**
   * Generate Verification Token
   * 
   * Educational: Tokens should be cryptographically secure
   * and have sufficient entropy to prevent guessing.
   */
  generateEmailVerificationToken(): string {
    this.emailVerificationToken = this.generateToken();
    return this.emailVerificationToken;
  }

  /**
   * Generate Password Reset Token
   */
  generatePasswordResetToken(): string {
    this.passwordResetToken = this.generateToken();
    this.passwordResetExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return this.passwordResetToken;
  }

  /**
   * Verify Email
   */
  verifyEmail(): void {
    this.emailVerified = true;
    this.emailVerificationToken = null;
    
    // Activate account if it was pending email verification
    if (this.status === UserStatus.PENDING) {
      this.status = UserStatus.ACTIVE;
    }
  }

  /**
   * Update Preferences
   * 
   * Educational: Preference updates should merge with existing
   * preferences to avoid losing unrelated settings.
   */
  updatePreferences(newPreferences: Partial<UserPreferences>): void {
    this.preferences = {
      ...this.getDefaultPreferences(),
      ...this.preferences,
      ...newPreferences,
    };
  }

  /**
   * Update Profile
   */
  updateProfile(newProfile: Partial<UserProfile>): void {
    this.profile = {
      ...this.profile,
      ...newProfile,
    };
  }

  /**
   * Check Permission
   * 
   * Educational: Permission checking should be centralized
   * in the entity to ensure consistency.
   */
  hasPermission(permission: string): boolean {
    // Super admin has all permissions
    if (this.role === UserRole.SUPER_ADMIN) return true;

    // Admin has most permissions
    if (this.role === UserRole.ADMIN) {
      const adminDeniedPermissions = ['user.delete.super_admin', 'system.shutdown'];
      return !adminDeniedPermissions.includes(permission);
    }

    // Moderator has limited permissions
    if (this.role === UserRole.MODERATOR) {
      const moderatorPermissions = [
        'task.read', 'task.create', 'task.update',
        'comment.read', 'comment.create', 'comment.update', 'comment.moderate',
        'project.read', 'project.create',
      ];
      return moderatorPermissions.includes(permission);
    }

    // Regular user has basic permissions
    const userPermissions = [
      'task.read', 'task.create', 'task.update.own',
      'comment.read', 'comment.create', 'comment.update.own',
      'project.read.member', 'project.create',
      'profile.read.own', 'profile.update.own',
    ];
    return userPermissions.includes(permission);
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  /**
   * Generate Secure Token
   * 
   * Educational: Tokens should be cryptographically secure
   * and have sufficient length to prevent brute force attacks.
   */
  private generateToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get Default Preferences
   * 
   * Educational: Default preferences ensure the application
   * works correctly even when users haven't set preferences.
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      notifications: {
        email: true,
        push: true,
        desktop: false,
        taskAssigned: true,
        taskCompleted: true,
        projectUpdates: true,
        comments: true,
        mentions: true,
      },
      privacy: {
        profileVisible: true,
        emailVisible: false,
        activityVisible: true,
      },
      dashboard: {
        defaultView: 'list',
        itemsPerPage: 25,
        showCompletedTasks: false,
      },
    };
  }

  /**
   * Get Default Security Settings
   */
  private getDefaultSecuritySettings(): UserSecuritySettings {
    return {
      twoFactorEnabled: false,
      lastPasswordChange: new Date(),
      loginAttempts: 0,
      trustedDevices: [],
      sessionTimeout: 480, // 8 hours
    };
  }
}