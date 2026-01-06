/**
 * Activity Log Entity - Comprehensive Audit Trail System
 * 
 * This entity demonstrates:
 * - Complete audit trail for all system activities
 * - Polymorphic relationships to multiple entity types
 * - JSON metadata for flexible activity data
 * - IP address and user agent tracking
 * - Activity categorization and filtering
 * - Performance optimization for large datasets
 * 
 * Educational Notes:
 * - Activity logs provide transparency and debugging capabilities
 * - Polymorphic relationships allow logging activities across entity types
 * - JSON columns store flexible activity-specific data
 * - Indexes optimize queries for common access patterns
 * - Retention policies manage storage costs for large datasets
 */

import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import {
  IsString,
  Length,
  IsOptional,
  IsEnum,
  IsObject,
  ValidateNested,
  IsUUID,
  IsIP,
  IsUrl,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseEntity } from './base.entity';
import { ActivityLogAction, EnumMetadata } from './enums';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Task } from './task.entity';

/**
 * Activity Metadata Interface
 * 
 * Educational: Metadata provides flexible storage for
 * activity-specific information and context.
 */
export interface ActivityMetadata {
  // Changed values for update operations
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  
  // Additional context information
  context?: {
    userAgent?: string;
    referer?: string;
    sessionId?: string;
    requestId?: string;
  };
  
  // Activity-specific data
  data?: Record<string, any>;
  
  // Performance metrics
  performance?: {
    duration?: number; // in milliseconds
    memoryUsage?: number; // in bytes
    queryCount?: number;
  };
  
  // Error information (for failed activities)
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * Activity Log Entity
 * 
 * Educational: This entity demonstrates comprehensive activity logging
 * with polymorphic relationships and flexible metadata storage.
 */
@Entity('activity_logs')
@Index(['action'])
@Index(['userId'])
@Index(['entityType', 'entityId'])
@Index(['projectId'])
@Index(['taskId'])
@Index(['createdAt'])
@Index(['ipAddress'])
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['entityType', 'entityId', 'createdAt'])
export class ActivityLog extends BaseEntity {
  // ==========================================
  // Activity Information
  // ==========================================

  /**
   * Activity Action
   * 
   * Educational: Actions provide specific categorization
   * of what operation was performed.
   */
  @Column({
    type: 'enum',
    enum: ActivityLogAction,
  })
  @IsEnum(ActivityLogAction, { message: 'Please provide a valid activity action' })
  @ApiProperty(EnumMetadata.ActivityLogAction)
  action: ActivityLogAction;

  /**
   * Activity Description
   * 
   * Educational: Human-readable description provides
   * context for the activity in audit reports.
   */
  @Column({ type: 'text' })
  @IsString()
  @Length(1, 1000, { message: 'Description must be between 1 and 1000 characters' })
  @ApiProperty({
    description: 'Human-readable description of the activity',
    example: 'User updated task status from "In Progress" to "Completed"',
    maxLength: 1000,
  })
  description: string;

  // ==========================================
  // Polymorphic Entity References
  // ==========================================

  /**
   * Entity Type
   * 
   * Educational: Entity type enables polymorphic relationships
   * where activities can reference different entity types.
   */
  @Column({ name: 'entity_type', length: 50 })
  @IsString()
  @Length(1, 50)
  @ApiProperty({
    description: 'Type of entity the activity relates to',
    example: 'Task',
    maxLength: 50,
  })
  entityType: string;

  /**
   * Entity ID
   * 
   * Educational: Entity ID provides the specific reference
   * to the entity instance involved in the activity.
   */
  @Column({ name: 'entity_id' })
  @IsUUID()
  @ApiProperty({
    description: 'ID of the entity the activity relates to',
    format: 'uuid',
  })
  entityId: string;

  // ==========================================
  // User and Context Information
  // ==========================================

  /**
   * User ID
   * 
   * Educational: User ID tracks who performed the activity.
   * Can be null for system-generated activities.
   */
  @Column({ name: 'user_id', nullable: true })
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: 'ID of the user who performed the activity',
    format: 'uuid',
  })
  userId?: string;

  /**
   * User
   * 
   * Educational: ManyToOne relationship to User entity.
   * Multiple activities can be performed by one user.
   */
  @ManyToOne(() => User, user => user.activityLogs, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  @ApiPropertyOptional({
    description: 'User who performed the activity',
    type: () => User,
  })
  user?: User;

  /**
   * IP Address
   * 
   * Educational: IP address tracking helps with security
   * monitoring and geographic analysis.
   */
  @Column({ name: 'ip_address', length: 45, nullable: true })
  @IsOptional()
  @IsIP()
  @ApiPropertyOptional({
    description: 'IP address of the client',
    example: '192.168.1.1',
  })
  ipAddress?: string;

  /**
   * User Agent
   * 
   * Educational: User agent helps identify client applications
   * and can be useful for debugging and analytics.
   */
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'User agent string of the client',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  userAgent?: string;

  // ==========================================
  // Related Entity References
  // ==========================================

  /**
   * Project ID
   * 
   * Educational: Project context helps filter activities
   * by project scope for project-specific audit trails.
   */
  @Column({ name: 'project_id', nullable: true })
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: 'ID of the related project',
    format: 'uuid',
  })
  projectId?: string;

  /**
   * Project
   * 
   * Educational: ManyToOne relationship to Project entity
   * for project-scoped activity filtering.
   */
  @ManyToOne(() => Project, project => project.activityLogs, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  @ApiPropertyOptional({
    description: 'Related project',
    type: () => Project,
  })
  project?: Project;

  /**
   * Task ID
   * 
   * Educational: Task context provides granular activity
   * tracking for task-specific operations.
   */
  @Column({ name: 'task_id', nullable: true })
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: 'ID of the related task',
    format: 'uuid',
  })
  taskId?: string;

  /**
   * Task
   * 
   * Educational: ManyToOne relationship to Task entity
   * for task-specific activity tracking.
   */
  @ManyToOne(() => Task, task => task.activityLogs, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  @ApiPropertyOptional({
    description: 'Related task',
    type: () => Task,
  })
  task?: Task;

  // ==========================================
  // Extended Data (JSON Column)
  // ==========================================

  /**
   * Activity Metadata
   * 
   * Educational: JSON column for flexible activity-specific
   * data including changes, context, and performance metrics.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'Additional activity metadata and context',
    type: 'object',
  })
  metadata?: ActivityMetadata;

  // ==========================================
  // Virtual Properties
  // ==========================================

  /**
   * Is System Activity
   * 
   * Educational: System activities are generated automatically
   * without direct user interaction.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether this is a system-generated activity',
    example: false,
  })
  get isSystemActivity(): boolean {
    return !this.userId;
  }

  /**
   * Has Changes
   * 
   * Educational: Change tracking helps identify which
   * activities modified data versus read-only operations.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the activity included data changes',
    example: true,
  })
  get hasChanges(): boolean {
    return !!(this.metadata?.changes && this.metadata.changes.length > 0);
  }

  /**
   * Change Count
   */
  @Expose()
  @ApiProperty({
    description: 'Number of fields changed in the activity',
    example: 3,
  })
  get changeCount(): number {
    return this.metadata?.changes?.length || 0;
  }

  /**
   * Has Error
   * 
   * Educational: Error tracking helps identify failed
   * operations and system issues.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the activity resulted in an error',
    example: false,
  })
  get hasError(): boolean {
    return !!this.metadata?.error;
  }

  /**
   * Duration
   * 
   * Educational: Performance tracking helps identify
   * slow operations and optimization opportunities.
   */
  @Expose()
  @ApiProperty({
    description: 'Duration of the activity in milliseconds',
    example: 150,
  })
  get duration(): number | null {
    return this.metadata?.performance?.duration || null;
  }

  /**
   * Activity Summary
   * 
   * Educational: Summary provides a concise overview
   * for activity lists and notifications.
   */
  @Expose()
  @ApiProperty({
    description: 'Concise summary of the activity',
    example: 'Updated task status',
  })
  get summary(): string {
    // Extract action type for summary
    const actionParts = this.action.split('_');
    const verb = actionParts[1] || actionParts[0];
    const entity = actionParts[0];
    
    return `${verb.charAt(0).toUpperCase() + verb.slice(1)} ${entity.toLowerCase()}`;
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

    // Initialize metadata if not provided
    if (!this.metadata) {
      this.metadata = {};
    }

    // Set default context if not provided
    if (!this.metadata.context) {
      this.metadata.context = {};
    }
  }

  // ==========================================
  // Static Factory Methods
  // ==========================================

  /**
   * Create User Activity
   * 
   * Educational: Factory methods provide convenient ways
   * to create activities with proper context and metadata.
   */
  static createUserActivity(
    action: ActivityLogAction,
    description: string,
    userId: string,
    entityType: string,
    entityId: string,
    options?: {
      projectId?: string;
      taskId?: string;
      ipAddress?: string;
      userAgent?: string;
      changes?: ActivityMetadata['changes'];
      data?: Record<string, any>;
    }
  ): ActivityLog {
    const activity = new ActivityLog();
    activity.action = action;
    activity.description = description;
    activity.userId = userId;
    activity.entityType = entityType;
    activity.entityId = entityId;
    
    if (options) {
      activity.projectId = options.projectId;
      activity.taskId = options.taskId;
      activity.ipAddress = options.ipAddress;
      activity.userAgent = options.userAgent;
      
      activity.metadata = {
        changes: options.changes,
        data: options.data,
        context: {
          userAgent: options.userAgent,
        },
      };
    }
    
    return activity;
  }

  /**
   * Create System Activity
   * 
   * Educational: System activities track automated operations
   * and background processes.
   */
  static createSystemActivity(
    action: ActivityLogAction,
    description: string,
    entityType: string,
    entityId: string,
    options?: {
      projectId?: string;
      taskId?: string;
      data?: Record<string, any>;
      performance?: ActivityMetadata['performance'];
    }
  ): ActivityLog {
    const activity = new ActivityLog();
    activity.action = action;
    activity.description = description;
    activity.entityType = entityType;
    activity.entityId = entityId;
    
    if (options) {
      activity.projectId = options.projectId;
      activity.taskId = options.taskId;
      
      activity.metadata = {
        data: options.data,
        performance: options.performance,
      };
    }
    
    return activity;
  }

  // ==========================================
  // Business Logic Methods
  // ==========================================

  /**
   * Add Change Record
   * 
   * Educational: Change tracking should be detailed enough
   * for audit purposes but not overly verbose.
   */
  addChange(field: string, oldValue: any, newValue: any): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    
    if (!this.metadata.changes) {
      this.metadata.changes = [];
    }
    
    this.metadata.changes.push({
      field,
      oldValue,
      newValue,
    });
  }

  /**
   * Set Performance Metrics
   * 
   * Educational: Performance tracking helps identify
   * bottlenecks and optimization opportunities.
   */
  setPerformanceMetrics(duration: number, memoryUsage?: number, queryCount?: number): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    
    this.metadata.performance = {
      duration,
      memoryUsage,
      queryCount,
    };
  }

  /**
   * Set Error Information
   * 
   * Educational: Error tracking should include enough
   * information for debugging without exposing sensitive data.
   */
  setError(message: string, stack?: string, code?: string): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    
    this.metadata.error = {
      message,
      stack,
      code,
    };
  }

  /**
   * Add Context Data
   * 
   * Educational: Context data provides additional information
   * about the circumstances of the activity.
   */
  addContextData(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    
    if (!this.metadata.data) {
      this.metadata.data = {};
    }
    
    this.metadata.data[key] = value;
  }

  /**
   * Get Change Summary
   * 
   * Educational: Change summaries provide human-readable
   * descriptions of what was modified.
   */
  getChangeSummary(): string {
    if (!this.hasChanges) {
      return 'No changes recorded';
    }
    
    const changes = this.metadata!.changes!;
    if (changes.length === 1) {
      return `Changed ${changes[0].field}`;
    }
    
    return `Changed ${changes.length} fields: ${changes.map(c => c.field).join(', ')}`;
  }

  /**
   * Check if Activity Relates to Entity
   * 
   * Educational: Entity relationship checking helps
   * filter activities by context and scope.
   */
  relatesTo(entityType: string, entityId: string): boolean {
    return this.entityType === entityType && this.entityId === entityId;
  }

  /**
   * Check if Activity is in Project Context
   */
  isInProject(projectId: string): boolean {
    return this.projectId === projectId;
  }

  /**
   * Check if Activity is for Task
   */
  isForTask(taskId: string): boolean {
    return this.taskId === taskId;
  }
}