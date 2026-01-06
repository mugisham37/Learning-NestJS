/**
 * Project Member Entity - Team Membership Management
 * 
 * This entity demonstrates:
 * - Junction table with additional attributes
 * - Role-based access control within projects
 * - Membership lifecycle tracking
 * - Permission management and inheritance
 * - Invitation and approval workflows
 * - Activity tracking for team changes
 * 
 * Educational Notes:
 * - Junction tables can have their own attributes beyond foreign keys
 * - Role-based permissions provide granular access control
 * - Membership status tracks invitation and approval workflows
 * - Timestamps help with membership analytics and reporting
 * - Composite indexes optimize common query patterns
 */

import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  Unique,
} from 'typeorm';
import {
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseEntity } from './base.entity';
import { ProjectMemberRole, EnumMetadata } from './enums';
import { User } from './user.entity';
import { Project } from './project.entity';

/**
 * Member Permissions Interface
 * 
 * Educational: Permissions provide fine-grained control
 * over what actions members can perform within projects.
 */
export interface MemberPermissions {
  // Task permissions
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canAssignTasks: boolean;
  
  // Comment permissions
  canCreateComments: boolean;
  canEditComments: boolean;
  canDeleteComments: boolean;
  canModerateComments: boolean;
  
  // File permissions
  canUploadFiles: boolean;
  canDownloadFiles: boolean;
  canDeleteFiles: boolean;
  
  // Project permissions
  canEditProject: boolean;
  canDeleteProject: boolean;
  canManageMembers: boolean;
  canManageCategories: boolean;
  
  // Administrative permissions
  canViewReports: boolean;
  canExportData: boolean;
  canManageIntegrations: boolean;
}

/**
 * Member Settings Interface
 * 
 * Educational: Settings allow customization of the
 * member experience within specific projects.
 */
export interface MemberSettings {
  notifications: {
    taskAssigned: boolean;
    taskCompleted: boolean;
    taskOverdue: boolean;
    commentAdded: boolean;
    projectUpdates: boolean;
    memberJoined: boolean;
  };
  preferences: {
    defaultView: 'list' | 'board' | 'calendar';
    showCompletedTasks: boolean;
    emailDigest: 'none' | 'daily' | 'weekly';
  };
  customFields?: Record<string, any>;
}

/**
 * Member Status Enum
 * 
 * Educational: Status tracks the membership lifecycle
 * from invitation through active participation.
 */
export enum MemberStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  LEFT = 'left',
}

/**
 * Project Member Entity
 * 
 * Educational: This entity demonstrates a junction table with additional
 * attributes for managing team membership and role-based permissions.
 */
@Entity('project_members')
@Unique(['projectId', 'userId'])
@Index(['projectId'])
@Index(['userId'])
@Index(['role'])
@Index(['status'])
@Index(['joinedAt'])
@Index(['projectId', 'role'])
@Index(['projectId', 'status'])
@Index(['userId', 'status'])
export class ProjectMember extends BaseEntity {
  // ==========================================
  // Foreign Key Relationships
  // ==========================================

  /**
   * Project ID
   * 
   * Educational: Foreign key to the Project entity.
   * Part of the composite unique constraint.
   */
  @Column({ name: 'project_id' })
  @IsUUID()
  @ApiProperty({
    description: 'ID of the project',
    format: 'uuid',
  })
  projectId: string;

  /**
   * Project
   * 
   * Educational: ManyToOne relationship to Project entity.
   * Multiple members can belong to one project.
   */
  @ManyToOne(() => Project, project => project.projectMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  @ApiProperty({
    description: 'Project this membership belongs to',
    type: () => Project,
  })
  project: Project;

  /**
   * User ID
   * 
   * Educational: Foreign key to the User entity.
   * Part of the composite unique constraint.
   */
  @Column({ name: 'user_id' })
  @IsUUID()
  @ApiProperty({
    description: 'ID of the user',
    format: 'uuid',
  })
  userId: string;

  /**
   * User
   * 
   * Educational: ManyToOne relationship to User entity.
   * One user can be a member of multiple projects.
   */
  @ManyToOne(() => User, user => user.projectMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  @ApiProperty({
    description: 'User who is a member of the project',
    type: () => User,
  })
  user: User;

  // ==========================================
  // Membership Information
  // ==========================================

  /**
   * Member Role
   * 
   * Educational: Role determines what actions the member
   * can perform within the project context.
   */
  @Column({
    type: 'enum',
    enum: ProjectMemberRole,
    default: ProjectMemberRole.MEMBER,
  })
  @IsEnum(ProjectMemberRole, { message: 'Please provide a valid project member role' })
  @ApiProperty(EnumMetadata.ProjectMemberRole)
  role: ProjectMemberRole;

  /**
   * Member Status
   * 
   * Educational: Status tracks the membership lifecycle
   * and enables invitation workflows.
   */
  @Column({
    type: 'enum',
    enum: MemberStatus,
    default: MemberStatus.INVITED,
  })
  @IsEnum(MemberStatus, { message: 'Please provide a valid member status' })
  @ApiProperty({
    enum: MemberStatus,
    description: 'Current status of the membership',
    example: MemberStatus.ACTIVE,
  })
  status: MemberStatus;

  // ==========================================
  // Membership Timeline
  // ==========================================

  /**
   * Joined At
   * 
   * Educational: Join timestamp tracks when the member
   * accepted the invitation and became active.
   */
  @Column({ name: 'joined_at', nullable: true })
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Timestamp when the user joined the project',
    type: 'string',
    format: 'date-time',
  })
  joinedAt?: Date;

  /**
   * Invited At
   * 
   * Educational: Invitation timestamp tracks when the
   * invitation was sent to the user.
   */
  @Column({ name: 'invited_at', nullable: true })
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Timestamp when the user was invited',
    type: 'string',
    format: 'date-time',
  })
  invitedAt?: Date;

  /**
   * Invited By
   * 
   * Educational: Tracking who sent invitations helps
   * with audit trails and invitation management.
   */
  @Column({ name: 'invited_by', nullable: true })
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: 'ID of the user who sent the invitation',
    format: 'uuid',
  })
  invitedBy?: string;

  /**
   * Left At
   * 
   * Educational: Leave timestamp tracks when members
   * left the project voluntarily or were removed.
   */
  @Column({ name: 'left_at', nullable: true })
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Timestamp when the user left the project',
    type: 'string',
    format: 'date-time',
  })
  leftAt?: Date;

  // ==========================================
  // Extended Data (JSON Columns)
  // ==========================================

  /**
   * Member Permissions
   * 
   * Educational: JSON column for storing granular permissions
   * that can override role-based defaults.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'Custom permissions for this member',
    type: 'object',
  })
  permissions?: MemberPermissions;

  /**
   * Member Settings
   * 
   * Educational: JSON column for storing member-specific
   * preferences and configuration within the project.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'Member settings and preferences',
    type: 'object',
  })
  settings?: MemberSettings;

  // ==========================================
  // Virtual Properties
  // ==========================================

  /**
   * Is Active
   * 
   * Educational: Convenience property for checking
   * if the membership is currently active.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the membership is active',
    example: true,
  })
  get isActive(): boolean {
    return this.status === MemberStatus.ACTIVE;
  }

  /**
   * Is Pending
   * 
   * Educational: Pending status indicates the user
   * has been invited but hasn't accepted yet.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the membership is pending invitation acceptance',
    example: false,
  })
  get isPending(): boolean {
    return this.status === MemberStatus.INVITED;
  }

  /**
   * Is Owner
   * 
   * Educational: Owner role has special privileges
   * and cannot be removed from the project.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the member is the project owner',
    example: false,
  })
  get isOwner(): boolean {
    return this.role === ProjectMemberRole.OWNER;
  }

  /**
   * Is Admin
   * 
   * Educational: Admin role has elevated privileges
   * for project management.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the member has admin privileges',
    example: false,
  })
  get isAdmin(): boolean {
    return this.role === ProjectMemberRole.ADMIN || this.isOwner;
  }

  /**
   * Can Manage Members
   * 
   * Educational: Permission checking combines role-based
   * and custom permissions for flexible access control.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the member can manage other members',
    example: false,
  })
  get canManageMembers(): boolean {
    // Check custom permissions first
    if (this.permissions?.canManageMembers !== undefined) {
      return this.permissions.canManageMembers;
    }
    
    // Fall back to role-based permissions
    return this.isAdmin;
  }

  /**
   * Days Since Joined
   * 
   * Educational: Membership duration helps with
   * analytics and member engagement tracking.
   */
  @Expose()
  @ApiProperty({
    description: 'Number of days since joining the project',
    example: 30,
  })
  get daysSinceJoined(): number | null {
    if (!this.joinedAt) return null;
    
    const diffTime = Date.now() - this.joinedAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Invitation Age
   * 
   * Educational: Invitation age helps identify
   * stale invitations that may need follow-up.
   */
  @Expose()
  @ApiProperty({
    description: 'Number of days since invitation was sent',
    example: 7,
  })
  get invitationAge(): number | null {
    if (!this.invitedAt) return null;
    
    const diffTime = Date.now() - this.invitedAt.getTime();
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

    // Set invitation timestamp if not provided
    if (!this.invitedAt && this.status === MemberStatus.INVITED) {
      this.invitedAt = new Date();
    }

    // Set join timestamp if status is active
    if (this.status === MemberStatus.ACTIVE && !this.joinedAt) {
      this.joinedAt = new Date();
    }

    // Initialize default permissions if not provided
    if (!this.permissions) {
      this.permissions = this.getDefaultPermissions();
    }

    // Initialize default settings if not provided
    if (!this.settings) {
      this.settings = this.getDefaultSettings();
    }
  }

  /**
   * Before Update Hook
   */
  @BeforeUpdate()
  async beforeUpdate(): Promise<void> {
    super.beforeUpdate();

    // Set join timestamp when status changes to active
    if (this.status === MemberStatus.ACTIVE && !this.joinedAt) {
      this.joinedAt = new Date();
    }

    // Set leave timestamp when status changes to left
    if (this.status === MemberStatus.LEFT && !this.leftAt) {
      this.leftAt = new Date();
    }
  }

  // ==========================================
  // Business Logic Methods
  // ==========================================

  /**
   * Accept Invitation
   * 
   * Educational: Invitation acceptance should update
   * status and timestamps appropriately.
   */
  acceptInvitation(): void {
    if (this.status !== MemberStatus.INVITED) {
      throw new Error('Can only accept pending invitations');
    }
    
    this.status = MemberStatus.ACTIVE;
    this.joinedAt = new Date();
  }

  /**
   * Decline Invitation
   * 
   * Educational: Invitation decline should clean up
   * the membership record appropriately.
   */
  declineInvitation(): void {
    if (this.status !== MemberStatus.INVITED) {
      throw new Error('Can only decline pending invitations');
    }
    
    this.status = MemberStatus.LEFT;
    this.leftAt = new Date();
  }

  /**
   * Leave Project
   * 
   * Educational: Leaving should preserve membership
   * history while marking the member as inactive.
   */
  leaveProject(): void {
    if (this.isOwner) {
      throw new Error('Project owner cannot leave the project');
    }
    
    this.status = MemberStatus.LEFT;
    this.leftAt = new Date();
  }

  /**
   * Suspend Member
   * 
   * Educational: Suspension temporarily restricts access
   * while preserving membership data.
   */
  suspend(): void {
    if (this.isOwner) {
      throw new Error('Cannot suspend project owner');
    }
    
    this.status = MemberStatus.SUSPENDED;
  }

  /**
   * Reactivate Member
   * 
   * Educational: Reactivation restores access for
   * previously suspended or inactive members.
   */
  reactivate(): void {
    if (this.status === MemberStatus.LEFT) {
      throw new Error('Cannot reactivate members who have left');
    }
    
    this.status = MemberStatus.ACTIVE;
    
    // Set join date if not already set
    if (!this.joinedAt) {
      this.joinedAt = new Date();
    }
  }

  /**
   * Update Role
   * 
   * Educational: Role updates should validate business
   * rules and update permissions accordingly.
   */
  updateRole(newRole: ProjectMemberRole): void {
    if (this.isOwner && newRole !== ProjectMemberRole.OWNER) {
      throw new Error('Cannot change owner role');
    }
    
    this.role = newRole;
    
    // Reset permissions to defaults for new role
    this.permissions = this.getDefaultPermissions();
  }

  /**
   * Update Permissions
   * 
   * Educational: Permission updates should validate
   * against role constraints and business rules.
   */
  updatePermissions(newPermissions: Partial<MemberPermissions>): void {
    this.permissions = {
      ...this.getDefaultPermissions(),
      ...this.permissions,
      ...newPermissions,
    };
  }

  /**
   * Update Settings
   * 
   * Educational: Settings updates should merge with
   * existing settings to avoid losing unrelated preferences.
   */
  updateSettings(newSettings: Partial<MemberSettings>): void {
    this.settings = {
      ...this.getDefaultSettings(),
      ...this.settings,
      ...newSettings,
    };
  }

  /**
   * Check Permission
   * 
   * Educational: Permission checking should consider
   * both role-based and custom permissions.
   */
  hasPermission(permission: keyof MemberPermissions): boolean {
    // Check custom permissions first
    if (this.permissions?.[permission] !== undefined) {
      return this.permissions[permission];
    }
    
    // Fall back to role-based permissions
    const defaultPermissions = this.getDefaultPermissions();
    return defaultPermissions[permission];
  }

  /**
   * Can Perform Action
   * 
   * Educational: Action validation should consider
   * membership status, role, and specific permissions.
   */
  canPerformAction(action: string): boolean {
    // Inactive members cannot perform actions
    if (!this.isActive) return false;
    
    // Map actions to permissions
    const actionPermissionMap: Record<string, keyof MemberPermissions> = {
      'create_task': 'canCreateTasks',
      'edit_task': 'canEditTasks',
      'delete_task': 'canDeleteTasks',
      'assign_task': 'canAssignTasks',
      'create_comment': 'canCreateComments',
      'edit_comment': 'canEditComments',
      'delete_comment': 'canDeleteComments',
      'upload_file': 'canUploadFiles',
      'download_file': 'canDownloadFiles',
      'delete_file': 'canDeleteFiles',
      'edit_project': 'canEditProject',
      'manage_members': 'canManageMembers',
      'manage_categories': 'canManageCategories',
    };
    
    const permission = actionPermissionMap[action];
    if (!permission) return false;
    
    return this.hasPermission(permission);
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  /**
   * Get Default Permissions for Role
   * 
   * Educational: Default permissions provide baseline
   * access control based on role hierarchy.
   */
  private getDefaultPermissions(): MemberPermissions {
    const basePermissions: MemberPermissions = {
      canCreateTasks: false,
      canEditTasks: false,
      canDeleteTasks: false,
      canAssignTasks: false,
      canCreateComments: false,
      canEditComments: false,
      canDeleteComments: false,
      canModerateComments: false,
      canUploadFiles: false,
      canDownloadFiles: false,
      canDeleteFiles: false,
      canEditProject: false,
      canDeleteProject: false,
      canManageMembers: false,
      canManageCategories: false,
      canViewReports: false,
      canExportData: false,
      canManageIntegrations: false,
    };

    switch (this.role) {
      case ProjectMemberRole.OWNER:
        // Owner has all permissions
        return Object.keys(basePermissions).reduce((perms, key) => {
          perms[key as keyof MemberPermissions] = true;
          return perms;
        }, {} as MemberPermissions);

      case ProjectMemberRole.ADMIN:
        return {
          ...basePermissions,
          canCreateTasks: true,
          canEditTasks: true,
          canDeleteTasks: true,
          canAssignTasks: true,
          canCreateComments: true,
          canEditComments: true,
          canDeleteComments: true,
          canModerateComments: true,
          canUploadFiles: true,
          canDownloadFiles: true,
          canDeleteFiles: true,
          canEditProject: true,
          canManageMembers: true,
          canManageCategories: true,
          canViewReports: true,
          canExportData: true,
        };

      case ProjectMemberRole.MEMBER:
        return {
          ...basePermissions,
          canCreateTasks: true,
          canEditTasks: true,
          canCreateComments: true,
          canEditComments: true,
          canUploadFiles: true,
          canDownloadFiles: true,
        };

      case ProjectMemberRole.VIEWER:
        return {
          ...basePermissions,
          canCreateComments: true,
          canDownloadFiles: true,
        };

      case ProjectMemberRole.GUEST:
        return {
          ...basePermissions,
          canDownloadFiles: true,
        };

      default:
        return basePermissions;
    }
  }

  /**
   * Get Default Settings
   * 
   * Educational: Default settings provide sensible
   * defaults for new members.
   */
  private getDefaultSettings(): MemberSettings {
    return {
      notifications: {
        taskAssigned: true,
        taskCompleted: true,
        taskOverdue: true,
        commentAdded: true,
        projectUpdates: true,
        memberJoined: false,
      },
      preferences: {
        defaultView: 'list',
        showCompletedTasks: false,
        emailDigest: 'weekly',
      },
    };
  }
}