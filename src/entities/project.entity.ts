/**
 * Project Entity - Project Management and Collaboration
 * 
 * This entity demonstrates:
 * - Project lifecycle management
 * - Team collaboration features
 * - Project settings and configuration
 * - File and resource management
 * - Activity tracking and audit trails
 * - Complex relationships with multiple entities
 * - JSON columns for flexible metadata
 * - Performance optimization with indexes
 * 
 * Educational Notes:
 * - Projects serve as containers for tasks and collaboration
 * - Many-to-many relationships enable team membership
 * - JSON columns provide flexibility for project-specific settings
 * - Indexes improve query performance for common access patterns
 * - Cascade options control related entity lifecycle
 * - Virtual properties provide computed business logic
 */

import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from 'typeorm';
import {
  IsString,
  Length,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUrl,
  IsObject,
  ValidateNested,
  IsArray,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Exclude, Expose, Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseEntity } from './base.entity';
import { ProjectStatus, ProjectVisibility, EnumMetadata } from './enums';
import { User } from './user.entity';
import { Task } from './task.entity';
import { Category } from './category.entity';
import { ActivityLog } from './activity-log.entity';
import { ProjectMember } from './project-member.entity';

/**
 * Project Settings Interface
 * 
 * Educational: Project settings allow customization of
 * project behavior and features on a per-project basis.
 */
export interface ProjectSettings {
  features: {
    tasks: boolean;
    comments: boolean;
    files: boolean;
    timeTracking: boolean;
    milestones: boolean;
    reports: boolean;
    integrations: boolean;
  };
  permissions: {
    allowMemberInvites: boolean;
    allowGuestAccess: boolean;
    requireApprovalForTasks: boolean;
    allowFileUploads: boolean;
    maxFileSize: number; // in MB
  };
  notifications: {
    taskCreated: boolean;
    taskCompleted: boolean;
    taskOverdue: boolean;
    commentAdded: boolean;
    memberJoined: boolean;
    memberLeft: boolean;
  };
  workflow: {
    defaultTaskStatus: string;
    allowStatusTransitions: Record<string, string[]>;
    autoAssignTasks: boolean;
    requireTaskApproval: boolean;
  };
  integrations: {
    slack?: {
      webhookUrl: string;
      channel: string;
      enabled: boolean;
    };
    github?: {
      repository: string;
      accessToken: string;
      enabled: boolean;
    };
    jira?: {
      projectKey: string;
      serverUrl: string;
      enabled: boolean;
    };
  };
}

/**
 * Project Statistics Interface
 * 
 * Educational: Statistics are computed and cached
 * to provide quick access to project metrics.
 */
export interface ProjectStatistics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalMembers: number;
  activeMembers: number;
  totalComments: number;
  totalFiles: number;
  totalFileSize: number; // in bytes
  averageTaskCompletionTime: number; // in hours
  lastActivity: Date;
  completionPercentage: number;
}

/**
 * Project Metadata Interface
 * 
 * Educational: Metadata provides additional context
 * and custom fields for different project types.
 */
export interface ProjectMetadata {
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  budget?: {
    allocated: number;
    spent: number;
    currency: string;
  };
  client?: {
    name: string;
    contact: string;
    email: string;
  };
  repository?: {
    url: string;
    branch: string;
    lastCommit: string;
  };
  deployment?: {
    environment: string;
    url: string;
    lastDeployment: Date;
  };
  customFields: Record<string, any>;
}

/**
 * Project Entity
 * 
 * Educational: This entity demonstrates comprehensive project management
 * with team collaboration, settings, and extensive relationship mapping.
 */
@Entity('projects')
@Index(['name'])
@Index(['status'])
@Index(['visibility'])
@Index(['ownerId'])
@Index(['createdAt'])
@Index(['startDate', 'endDate'])
@Index(['status', 'visibility'])
export class Project extends BaseEntity {
  // ==========================================
  // Basic Information
  // ==========================================

  /**
   * Project Name
   * 
   * Educational: Project names should be descriptive and unique
   * within the context of the owner or organization.
   */
  @Column({ length: 255 })
  @IsString()
  @Length(1, 255, { message: 'Project name must be between 1 and 255 characters' })
  @ApiProperty({
    description: 'Project name',
    example: 'E-commerce Platform Redesign',
    maxLength: 255,
  })
  name: string;

  /**
   * Project Description
   * 
   * Educational: Rich text descriptions help team members
   * understand project goals and context.
   */
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Detailed project description',
    example: 'Complete redesign of the e-commerce platform with modern UI/UX and improved performance.',
  })
  description?: string;

  /**
   * Project Slug
   * 
   * Educational: Slugs provide URL-friendly identifiers
   * that are more user-friendly than UUIDs.
   */
  @Column({ length: 100, unique: true })
  @IsString()
  @Length(1, 100)
  @ApiProperty({
    description: 'URL-friendly project identifier',
    example: 'ecommerce-platform-redesign',
    maxLength: 100,
  })
  slug: string;

  /**
   * Project Status
   * 
   * Educational: Status tracking helps manage project lifecycle
   * and provides visibility into project health.
   */
  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  @IsEnum(ProjectStatus, { message: 'Please provide a valid project status' })
  @ApiProperty(EnumMetadata.ProjectStatus)
  status: ProjectStatus;

  /**
   * Project Visibility
   * 
   * Educational: Visibility controls who can see and access
   * the project, implementing different levels of privacy.
   */
  @Column({
    type: 'enum',
    enum: ProjectVisibility,
    default: ProjectVisibility.PRIVATE,
  })
  @IsEnum(ProjectVisibility, { message: 'Please provide a valid project visibility' })
  @ApiProperty(EnumMetadata.ProjectVisibility)
  visibility: ProjectVisibility;

  // ==========================================
  // Dates and Timeline
  // ==========================================

  /**
   * Project Start Date
   * 
   * Educational: Start dates help with project planning
   * and timeline visualization.
   */
  @Column({ name: 'start_date', type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Project start date',
    type: 'string',
    format: 'date',
    example: '2023-01-01',
  })
  startDate?: Date;

  /**
   * Project End Date
   * 
   * Educational: End dates provide deadlines and help
   * with resource planning and milestone tracking.
   */
  @Column({ name: 'end_date', type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Project end date',
    type: 'string',
    format: 'date',
    example: '2023-12-31',
  })
  endDate?: Date;

  /**
   * Actual Completion Date
   * 
   * Educational: Tracking actual completion helps with
   * project retrospectives and future planning.
   */
  @Column({ name: 'completed_at', nullable: true })
  @ApiPropertyOptional({
    description: 'Actual project completion date',
    type: 'string',
    format: 'date-time',
  })
  completedAt?: Date;

  // ==========================================
  // Visual and Branding
  // ==========================================

  /**
   * Project Color
   * 
   * Educational: Colors help with visual organization
   * and quick project identification in lists and dashboards.
   */
  @Column({ length: 7, nullable: true })
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Project color (hex code)',
    example: '#3498db',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  color?: string;

  /**
   * Project Icon
   * 
   * Educational: Icons provide visual identification
   * and can be emoji, font icons, or image URLs.
   */
  @Column({ length: 50, nullable: true })
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Project icon (emoji or icon name)',
    example: '🛒',
  })
  icon?: string;

  /**
   * Project Cover Image
   * 
   * Educational: Cover images provide visual appeal
   * and help distinguish projects in gallery views.
   */
  @Column({ name: 'cover_image_url', nullable: true })
  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    description: 'URL to project cover image',
    format: 'uri',
  })
  coverImageUrl?: string;

  // ==========================================
  // Progress and Metrics
  // ==========================================

  /**
   * Progress Percentage
   * 
   * Educational: Progress tracking provides quick visibility
   * into project completion status.
   */
  @Column({ name: 'progress_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  @Min(0)
  @Max(100)
  @ApiProperty({
    description: 'Project completion percentage',
    example: 65.5,
    minimum: 0,
    maximum: 100,
  })
  progressPercentage: number;

  /**
   * Estimated Hours
   * 
   * Educational: Time estimation helps with resource
   * planning and project budgeting.
   */
  @Column({ name: 'estimated_hours', nullable: true })
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({
    description: 'Estimated project hours',
    example: 480,
    minimum: 0,
  })
  estimatedHours?: number;

  /**
   * Actual Hours
   * 
   * Educational: Tracking actual time helps with
   * project retrospectives and future estimation.
   */
  @Column({ name: 'actual_hours', nullable: true })
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({
    description: 'Actual project hours',
    example: 520,
    minimum: 0,
  })
  actualHours?: number;

  // ==========================================
  // Configuration and Settings
  // ==========================================

  /**
   * Project Settings
   * 
   * Educational: JSON columns allow flexible configuration
   * without requiring schema changes for new features.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'Project configuration settings',
    type: 'object',
  })
  settings?: ProjectSettings;

  /**
   * Project Statistics
   * 
   * Educational: Cached statistics improve performance
   * for dashboard and reporting queries.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({
    description: 'Cached project statistics',
    type: 'object',
  })
  statistics?: ProjectStatistics;

  /**
   * Project Metadata
   * 
   * Educational: Metadata provides extensibility
   * for project-specific information and integrations.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'Additional project metadata',
    type: 'object',
  })
  metadata?: ProjectMetadata;

  // ==========================================
  // Ownership and Relationships
  // ==========================================

  /**
   * Project Owner ID
   * 
   * Educational: Foreign key to the User entity.
   * The owner has full control over the project.
   */
  @Column({ name: 'owner_id' })
  @ApiProperty({
    description: 'ID of the project owner',
    format: 'uuid',
  })
  ownerId: string;

  /**
   * Project Owner
   * 
   * Educational: ManyToOne relationship to User entity.
   * One user can own multiple projects.
   */
  @ManyToOne(() => User, user => user.ownedProjects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'owner_id' })
  @ApiProperty({
    description: 'Project owner',
    type: () => User,
  })
  owner: User;

  /**
   * Project Tasks
   * 
   * Educational: OneToMany relationship to Task entity.
   * Projects contain multiple tasks.
   */
  @OneToMany(() => Task, task => task.project, {
    cascade: ['soft-remove'],
  })
  @ApiPropertyOptional({
    description: 'Tasks in this project',
    type: () => [Task],
  })
  tasks?: Task[];

  /**
   * Project Categories
   * 
   * Educational: OneToMany relationship to Category entity.
   * Projects can have custom categories for organization.
   */
  @OneToMany(() => Category, category => category.project, {
    cascade: ['soft-remove'],
  })
  @ApiPropertyOptional({
    description: 'Categories in this project',
    type: () => [Category],
  })
  categories?: Category[];

  /**
   * Project Activity Logs
   * 
   * Educational: OneToMany relationship for audit trail.
   * All project-related activities are logged.
   */
  @OneToMany(() => ActivityLog, log => log.project)
  @ApiPropertyOptional({
    description: 'Activity logs for this project',
    type: () => [ActivityLog],
  })
  activityLogs?: ActivityLog[];

  /**
   * Project Members (Junction Table)
   * 
   * Educational: OneToMany relationship to ProjectMember
   * for managing team membership with roles and permissions.
   */
  @OneToMany(() => ProjectMember, member => member.project, {
    cascade: ['soft-remove'],
  })
  @ApiPropertyOptional({
    description: 'Project member relationships',
    type: () => [ProjectMember],
  })
  projectMembers?: ProjectMember[];

  /**
   * Members (Many-to-Many through ProjectMember)
   * 
   * Educational: Many-to-many relationship with User
   * through the ProjectMember junction table.
   */
  @ManyToMany(() => User, user => user.memberProjects)
  @JoinTable({
    name: 'project_members',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  @ApiPropertyOptional({
    description: 'Project members',
    type: () => [User],
  })
  members?: User[];

  // ==========================================
  // Virtual Properties
  // ==========================================

  /**
   * Is Active
   * 
   * Educational: Convenience property for checking
   * if the project is in an active state.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the project is active',
    example: true,
  })
  get isActive(): boolean {
    return this.status === ProjectStatus.ACTIVE;
  }

  /**
   * Is Completed
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the project is completed',
    example: false,
  })
  get isCompleted(): boolean {
    return this.status === ProjectStatus.COMPLETED;
  }

  /**
   * Is Overdue
   * 
   * Educational: Overdue calculation helps identify
   * projects that need attention.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the project is overdue',
    example: false,
  })
  get isOverdue(): boolean {
    if (!this.endDate || this.isCompleted) return false;
    return new Date() > this.endDate;
  }

  /**
   * Days Remaining
   * 
   * Educational: Time calculations help with
   * project planning and urgency assessment.
   */
  @Expose()
  @ApiProperty({
    description: 'Days remaining until end date',
    example: 45,
  })
  get daysRemaining(): number | null {
    if (!this.endDate || this.isCompleted) return null;
    const today = new Date();
    const diffTime = this.endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Duration in Days
   */
  @Expose()
  @ApiProperty({
    description: 'Project duration in days',
    example: 365,
  })
  get durationDays(): number | null {
    if (!this.startDate || !this.endDate) return null;
    const diffTime = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Time Efficiency
   * 
   * Educational: Efficiency metrics help evaluate
   * project performance and estimation accuracy.
   */
  @Expose()
  @ApiProperty({
    description: 'Time efficiency (estimated vs actual hours)',
    example: 0.92,
  })
  get timeEfficiency(): number | null {
    if (!this.estimatedHours || !this.actualHours) return null;
    return this.estimatedHours / this.actualHours;
  }

  /**
   * Member Count
   */
  @Expose()
  @ApiProperty({
    description: 'Number of project members',
    example: 5,
  })
  get memberCount(): number {
    return this.statistics?.totalMembers || 0;
  }

  /**
   * Task Count
   */
  @Expose()
  @ApiProperty({
    description: 'Number of tasks in project',
    example: 25,
  })
  get taskCount(): number {
    return this.statistics?.totalTasks || 0;
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

    // Generate slug if not provided
    if (!this.slug) {
      this.slug = this.generateSlug(this.name);
    }

    // Initialize default settings
    if (!this.settings) {
      this.settings = this.getDefaultSettings();
    }

    // Initialize statistics
    if (!this.statistics) {
      this.statistics = this.getInitialStatistics();
    }

    // Set default color if not provided
    if (!this.color) {
      this.color = this.generateRandomColor();
    }
  }

  /**
   * Before Update Hook
   */
  @BeforeUpdate()
  async beforeUpdate(): Promise<void> {
    super.beforeUpdate();

    // Update completion date when status changes to completed
    if (this.status === ProjectStatus.COMPLETED && !this.completedAt) {
      this.completedAt = new Date();
      this.progressPercentage = 100;
    }

    // Clear completion date if status changes from completed
    if (this.status !== ProjectStatus.COMPLETED && this.completedAt) {
      this.completedAt = null;
    }
  }

  /**
   * After Load Hook
   */
  @AfterLoad()
  afterLoad(): void {
    // Ensure settings have default values
    if (this.settings) {
      this.settings = { ...this.getDefaultSettings(), ...this.settings };
    }

    // Ensure statistics exist
    if (!this.statistics) {
      this.statistics = this.getInitialStatistics();
    }
  }

  // ==========================================
  // Business Logic Methods
  // ==========================================

  /**
   * Update Progress
   * 
   * Educational: Progress updates should be centralized
   * to ensure consistency and trigger related updates.
   */
  updateProgress(percentage: number): void {
    this.progressPercentage = Math.max(0, Math.min(100, percentage));

    // Auto-complete project when progress reaches 100%
    if (this.progressPercentage === 100 && this.status === ProjectStatus.ACTIVE) {
      this.status = ProjectStatus.COMPLETED;
      this.completedAt = new Date();
    }
  }

  /**
   * Add Time Tracking
   * 
   * Educational: Time tracking helps with project
   * budgeting and performance analysis.
   */
  addTimeTracking(hours: number): void {
    this.actualHours = (this.actualHours || 0) + hours;
  }

  /**
   * Update Statistics
   * 
   * Educational: Statistics should be updated when
   * related entities change to maintain accuracy.
   */
  updateStatistics(stats: Partial<ProjectStatistics>): void {
    this.statistics = {
      ...this.getInitialStatistics(),
      ...this.statistics,
      ...stats,
      lastActivity: new Date(),
    };

    // Update progress based on task completion
    if (stats.totalTasks && stats.completedTasks !== undefined) {
      const newProgress = (stats.completedTasks / stats.totalTasks) * 100;
      this.updateProgress(newProgress);
    }
  }

  /**
   * Check if User is Member
   * 
   * Educational: Membership checking is used for
   * authorization and access control.
   */
  isMember(userId: string): boolean {
    if (this.ownerId === userId) return true;
    return this.members?.some(member => member.id === userId) || false;
  }

  /**
   * Check if User is Owner
   */
  isOwner(userId: string): boolean {
    return this.ownerId === userId;
  }

  /**
   * Get User Role in Project
   * 
   * Educational: Role checking determines what
   * actions a user can perform in the project.
   */
  getUserRole(userId: string): string | null {
    if (this.isOwner(userId)) return 'owner';
    
    const membership = this.projectMembers?.find(member => member.userId === userId);
    return membership?.role || null;
  }

  /**
   * Can User Access Project
   * 
   * Educational: Access control based on visibility
   * and membership rules.
   */
  canUserAccess(userId: string, userRole?: string): boolean {
    // Public projects are accessible to everyone
    if (this.visibility === ProjectVisibility.PUBLIC) return true;

    // Private projects only accessible to members
    if (this.visibility === ProjectVisibility.PRIVATE) {
      return this.isMember(userId);
    }

    // Internal projects accessible to all authenticated users
    if (this.visibility === ProjectVisibility.INTERNAL) {
      return !!userId; // Just need to be authenticated
    }

    return false;
  }

  /**
   * Archive Project
   * 
   * Educational: Archiving preserves project data
   * while removing it from active views.
   */
  archive(): void {
    this.status = ProjectStatus.ARCHIVED;
    this.completedAt = this.completedAt || new Date();
  }

  /**
   * Restore Project
   */
  restore(): void {
    if (this.status === ProjectStatus.ARCHIVED) {
      this.status = this.completedAt ? ProjectStatus.COMPLETED : ProjectStatus.ACTIVE;
    }
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  /**
   * Generate random project color
   */
  private generateRandomColor(): string {
    const colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
      '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
      '#95a5a6', '#f1c40f', '#8e44ad', '#16a085',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Get default project settings
   */
  private getDefaultSettings(): ProjectSettings {
    return {
      features: {
        tasks: true,
        comments: true,
        files: true,
        timeTracking: false,
        milestones: false,
        reports: false,
        integrations: false,
      },
      permissions: {
        allowMemberInvites: true,
        allowGuestAccess: false,
        requireApprovalForTasks: false,
        allowFileUploads: true,
        maxFileSize: 10, // 10MB
      },
      notifications: {
        taskCreated: true,
        taskCompleted: true,
        taskOverdue: true,
        commentAdded: true,
        memberJoined: true,
        memberLeft: false,
      },
      workflow: {
        defaultTaskStatus: 'todo',
        allowStatusTransitions: {
          todo: ['in_progress', 'cancelled'],
          in_progress: ['in_review', 'blocked', 'cancelled'],
          in_review: ['completed', 'in_progress'],
          blocked: ['in_progress', 'cancelled'],
          completed: [],
          cancelled: ['todo'],
        },
        autoAssignTasks: false,
        requireTaskApproval: false,
      },
      integrations: {},
    };
  }

  /**
   * Get initial statistics
   */
  private getInitialStatistics(): ProjectStatistics {
    return {
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      totalMembers: 1, // Owner is always a member
      activeMembers: 1,
      totalComments: 0,
      totalFiles: 0,
      totalFileSize: 0,
      averageTaskCompletionTime: 0,
      lastActivity: new Date(),
      completionPercentage: 0,
    };
  }
}