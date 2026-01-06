/**
 * Task Entity - Core Task Management with Complex Relationships
 * 
 * This entity demonstrates:
 * - Complex business logic and state management
 * - Multiple relationship types (OneToMany, ManyToOne, ManyToMany)
 * - Advanced validation and constraints
 * - Time tracking and progress monitoring
 * - Hierarchical task structures (subtasks)
 * - Rich metadata and custom fields
 * - Performance optimization with indexes
 * - Entity lifecycle management
 * 
 * Educational Notes:
 * - Tasks are the core work items in the project management system
 * - Self-referencing relationships enable task hierarchies
 * - JSON columns provide flexibility for task-specific data
 * - Computed properties derive business logic from stored data
 * - Lifecycle hooks maintain data consistency
 * - Indexes optimize common query patterns
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
  Tree,
  TreeParent,
  TreeChildren,
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
  IsNumber,
  Min,
  Max,
  IsObject,
  ValidateNested,
  IsArray,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Exclude, Expose, Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseEntity } from './base.entity';
import { TaskStatus, TaskPriority, TaskType, EnumMetadata } from './enums';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Category } from './category.entity';
import { Comment } from './comment.entity';
import { ActivityLog } from './activity-log.entity';
import { TaskAttachment } from './task-attachment.entity';

/**
 * Task Time Tracking Interface
 * 
 * Educational: Time tracking provides detailed
 * work logging and productivity analysis.
 */
export interface TaskTimeTracking {
  estimatedHours: number;
  actualHours: number;
  remainingHours: number;
  timeEntries: {
    id: string;
    userId: string;
    startTime: Date;
    endTime: Date;
    duration: number; // in minutes
    description: string;
    billable: boolean;
  }[];
  totalBillableHours: number;
  efficiency: number; // actual vs estimated
}

/**
 * Task Dependencies Interface
 * 
 * Educational: Dependencies define task relationships
 * and help with project scheduling and planning.
 */
export interface TaskDependencies {
  blockedBy: string[]; // Task IDs that must complete first
  blocking: string[]; // Task IDs that depend on this task
  relatedTasks: string[]; // Related but not dependent tasks
  milestones: string[]; // Milestone IDs this task contributes to
}

/**
 * Task Metadata Interface
 * 
 * Educational: Metadata provides extensibility
 * for task-specific information and integrations.
 */
export interface TaskMetadata {
  labels: string[];
  customFields: Record<string, any>;
  externalIds: {
    jira?: string;
    github?: string;
    trello?: string;
    asana?: string;
  };
  automation: {
    autoAssign: boolean;
    autoTransition: boolean;
    notifyOnChange: boolean;
    escalationRules: {
      overdueDays: number;
      escalateTo: string;
      action: 'notify' | 'reassign' | 'escalate';
    }[];
  };
  checklist: {
    id: string;
    text: string;
    completed: boolean;
    completedBy?: string;
    completedAt?: Date;
  }[];
}

/**
 * Task Recurrence Interface
 * 
 * Educational: Recurrence patterns enable
 * automated task creation for recurring work.
 */
export interface TaskRecurrence {
  enabled: boolean;
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // Every N days/weeks/months
  daysOfWeek?: number[]; // For weekly pattern (0=Sunday)
  dayOfMonth?: number; // For monthly pattern
  endDate?: Date;
  maxOccurrences?: number;
  lastGenerated?: Date;
  nextDue?: Date;
}

/**
 * Task Entity
 * 
 * Educational: This entity demonstrates comprehensive task management
 * with complex relationships, business logic, and extensible metadata.
 */
@Entity('tasks')
@Tree('closure-table')
@Index(['title'])
@Index(['status'])
@Index(['priority'])
@Index(['projectId'])
@Index(['assigneeId'])
@Index(['dueDate'])
@Index(['createdAt'])
@Index(['status', 'priority'])
@Index(['projectId', 'status'])
@Index(['assigneeId', 'status'])
@Index(['dueDate', 'status'])
export class Task extends BaseEntity {
  // ==========================================
  // Basic Information
  // ==========================================

  /**
   * Task Title
   * 
   * Educational: Titles should be descriptive and concise
   * to help team members quickly understand the task.
   */
  @Column({ length: 255 })
  @IsString()
  @Length(1, 255, { message: 'Task title must be between 1 and 255 characters' })
  @ApiProperty({
    description: 'Task title',
    example: 'Implement user authentication system',
    maxLength: 255,
  })
  title: string;

  /**
   * Task Description
   * 
   * Educational: Rich text descriptions provide detailed
   * requirements and context for task completion.
   */
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Detailed task description',
    example: 'Implement a secure user authentication system with JWT tokens, password hashing, and email verification.',
  })
  description?: string;

  /**
   * Task Status
   * 
   * Educational: Status tracking enables workflow management
   * and progress monitoring across the task lifecycle.
   */
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  @IsEnum(TaskStatus, { message: 'Please provide a valid task status' })
  @ApiProperty(EnumMetadata.TaskStatus)
  status: TaskStatus;

  /**
   * Task Priority
   * 
   * Educational: Priority levels help with resource allocation
   * and work prioritization across the team.
   */
  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  @IsEnum(TaskPriority, { message: 'Please provide a valid task priority' })
  @ApiProperty(EnumMetadata.TaskPriority)
  priority: TaskPriority;

  /**
   * Task Type
   * 
   * Educational: Task types help categorize work and
   * can be used for reporting and workflow automation.
   */
  @Column({
    type: 'enum',
    enum: TaskType,
    default: TaskType.FEATURE,
  })
  @IsEnum(TaskType, { message: 'Please provide a valid task type' })
  @ApiProperty(EnumMetadata.TaskType)
  type: TaskType;

  // ==========================================
  // Dates and Timeline
  // ==========================================

  /**
   * Due Date
   * 
   * Educational: Due dates help with deadline management
   * and workload planning across team members.
   */
  @Column({ name: 'due_date', nullable: true })
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Task due date',
    type: 'string',
    format: 'date-time',
    example: '2023-12-31T23:59:59.000Z',
  })
  dueDate?: Date;

  /**
   * Start Date
   * 
   * Educational: Start dates help with task scheduling
   * and dependency management.
   */
  @Column({ name: 'start_date', nullable: true })
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Task start date',
    type: 'string',
    format: 'date-time',
  })
  startDate?: Date;

  /**
   * Completed Date
   * 
   * Educational: Completion tracking helps with
   * performance analysis and reporting.
   */
  @Column({ name: 'completed_at', nullable: true })
  @ApiPropertyOptional({
    description: 'Task completion date',
    type: 'string',
    format: 'date-time',
  })
  completedAt?: Date;

  // ==========================================
  // Progress and Effort
  // ==========================================

  /**
   * Estimated Hours
   * 
   * Educational: Time estimation helps with project
   * planning and resource allocation.
   */
  @Column({ name: 'estimated_hours', type: 'decimal', precision: 8, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({
    description: 'Estimated hours to complete the task',
    example: 8.5,
    minimum: 0,
  })
  estimatedHours?: number;

  /**
   * Actual Hours
   * 
   * Educational: Actual time tracking helps with
   * performance analysis and future estimation.
   */
  @Column({ name: 'actual_hours', type: 'decimal', precision: 8, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({
    description: 'Actual hours spent on the task',
    example: 9.25,
    minimum: 0,
  })
  actualHours?: number;

  /**
   * Progress Percentage
   * 
   * Educational: Progress tracking provides granular
   * visibility into task completion status.
   */
  @Column({ name: 'progress_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  @Min(0)
  @Max(100)
  @ApiProperty({
    description: 'Task completion percentage',
    example: 75.5,
    minimum: 0,
    maximum: 100,
  })
  progressPercentage: number;

  /**
   * Story Points
   * 
   * Educational: Story points provide relative sizing
   * for agile development and sprint planning.
   */
  @Column({ name: 'story_points', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({
    description: 'Story points for agile estimation',
    example: 5,
    minimum: 0,
    maximum: 100,
  })
  storyPoints?: number;

  // ==========================================
  // Relationships and Hierarchy
  // ==========================================

  /**
   * Project ID
   * 
   * Educational: Foreign key to the Project entity.
   * Every task belongs to exactly one project.
   */
  @Column({ name: 'project_id' })
  @IsUUID()
  @ApiProperty({
    description: 'ID of the project this task belongs to',
    format: 'uuid',
  })
  projectId: string;

  /**
   * Project
   * 
   * Educational: ManyToOne relationship to Project entity.
   * Multiple tasks can belong to one project.
   */
  @ManyToOne(() => Project, project => project.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  @ApiProperty({
    description: 'Project this task belongs to',
    type: () => Project,
  })
  project: Project;

  /**
   * Assignee ID
   * 
   * Educational: Foreign key to the User entity.
   * Tasks can be assigned to team members.
   */
  @Column({ name: 'assignee_id', nullable: true })
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: 'ID of the user assigned to this task',
    format: 'uuid',
  })
  assigneeId?: string;

  /**
   * Assignee
   * 
   * Educational: ManyToOne relationship to User entity.
   * Multiple tasks can be assigned to one user.
   */
  @ManyToOne(() => User, user => user.assignedTasks, {
    nullable: true,
  })
  @JoinColumn({ name: 'assignee_id' })
  @ApiPropertyOptional({
    description: 'User assigned to this task',
    type: () => User,
  })
  assignee?: User;

  /**
   * Reporter ID
   * 
   * Educational: The user who created or reported the task.
   * This is different from the assignee.
   */
  @Column({ name: 'reporter_id', nullable: true })
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: 'ID of the user who reported this task',
    format: 'uuid',
  })
  reporterId?: string;

  /**
   * Reporter
   * 
   * Educational: ManyToOne relationship to User entity
   * for the person who created the task.
   */
  @ManyToOne(() => User, {
    nullable: true,
  })
  @JoinColumn({ name: 'reporter_id' })
  @ApiPropertyOptional({
    description: 'User who reported this task',
    type: () => User,
  })
  reporter?: User;

  // ==========================================
  // Hierarchical Relationships (Tree Structure)
  // ==========================================

  /**
   * Parent Task
   * 
   * Educational: TreeParent enables hierarchical task structures
   * where tasks can have subtasks for better organization.
   */
  @TreeParent()
  @ApiPropertyOptional({
    description: 'Parent task (for subtasks)',
    type: () => Task,
  })
  parent?: Task;

  /**
   * Child Tasks (Subtasks)
   * 
   * Educational: TreeChildren provides access to all subtasks
   * in the hierarchical structure.
   */
  @TreeChildren()
  @ApiPropertyOptional({
    description: 'Child tasks (subtasks)',
    type: () => [Task],
  })
  children?: Task[];

  // ==========================================
  // Many-to-Many Relationships
  // ==========================================

  /**
   * Categories
   * 
   * Educational: ManyToMany relationship with Category entity.
   * Tasks can belong to multiple categories for organization.
   */
  @ManyToMany(() => Category, category => category.tasks)
  @JoinTable({
    name: 'task_categories',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  @ApiPropertyOptional({
    description: 'Categories this task belongs to',
    type: () => [Category],
  })
  categories?: Category[];

  /**
   * Watchers
   * 
   * Educational: ManyToMany relationship with User entity
   * for users who want to receive notifications about the task.
   */
  @ManyToMany(() => User)
  @JoinTable({
    name: 'task_watchers',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  @ApiPropertyOptional({
    description: 'Users watching this task for notifications',
    type: () => [User],
  })
  watchers?: User[];

  // ==========================================
  // One-to-Many Relationships
  // ==========================================

  /**
   * Comments
   * 
   * Educational: OneToMany relationship to Comment entity.
   * Tasks can have multiple comments for discussion.
   */
  @OneToMany(() => Comment, comment => comment.task, {
    cascade: ['soft-remove'],
  })
  @ApiPropertyOptional({
    description: 'Comments on this task',
    type: () => [Comment],
  })
  comments?: Comment[];

  /**
   * Attachments
   * 
   * Educational: OneToMany relationship to TaskAttachment entity.
   * Tasks can have multiple file attachments.
   */
  @OneToMany(() => TaskAttachment, attachment => attachment.task, {
    cascade: ['soft-remove'],
  })
  @ApiPropertyOptional({
    description: 'File attachments for this task',
    type: () => [TaskAttachment],
  })
  attachments?: TaskAttachment[];

  /**
   * Activity Logs
   * 
   * Educational: OneToMany relationship for audit trail.
   * All task-related activities are logged.
   */
  @OneToMany(() => ActivityLog, log => log.task)
  @ApiPropertyOptional({
    description: 'Activity logs for this task',
    type: () => [ActivityLog],
  })
  activityLogs?: ActivityLog[];

  // ==========================================
  // Extended Data (JSON Columns)
  // ==========================================

  /**
   * Time Tracking Data
   * 
   * Educational: JSON column for detailed time tracking
   * information and work log entries.
   */
  @Column({ name: 'time_tracking', type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'Detailed time tracking information',
    type: 'object',
  })
  timeTracking?: TaskTimeTracking;

  /**
   * Dependencies
   * 
   * Educational: JSON column for task dependencies
   * and relationships with other tasks.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'Task dependencies and relationships',
    type: 'object',
  })
  dependencies?: TaskDependencies;

  /**
   * Metadata
   * 
   * Educational: JSON column for extensible task metadata
   * including custom fields and external integrations.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'Additional task metadata and custom fields',
    type: 'object',
  })
  metadata?: TaskMetadata;

  /**
   * Recurrence Settings
   * 
   * Educational: JSON column for recurring task configuration
   * and automated task generation.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'Recurrence settings for recurring tasks',
    type: 'object',
  })
  recurrence?: TaskRecurrence;

  // ==========================================
  // Virtual Properties
  // ==========================================

  /**
   * Is Completed
   * 
   * Educational: Convenience property for checking
   * if the task is in a completed state.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the task is completed',
    example: false,
  })
  get isCompleted(): boolean {
    return this.status === TaskStatus.COMPLETED;
  }

  /**
   * Is Overdue
   * 
   * Educational: Overdue calculation helps identify
   * tasks that need immediate attention.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the task is overdue',
    example: false,
  })
  get isOverdue(): boolean {
    if (!this.dueDate || this.isCompleted) return false;
    return new Date() > this.dueDate;
  }

  /**
   * Is Blocked
   * 
   * Educational: Blocked status indicates tasks
   * that cannot proceed due to dependencies.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the task is blocked',
    example: false,
  })
  get isBlocked(): boolean {
    return this.status === TaskStatus.BLOCKED;
  }

  /**
   * Days Until Due
   * 
   * Educational: Time calculations help with
   * prioritization and workload planning.
   */
  @Expose()
  @ApiProperty({
    description: 'Days until due date',
    example: 5,
  })
  get daysUntilDue(): number | null {
    if (!this.dueDate || this.isCompleted) return null;
    const today = new Date();
    const diffTime = this.dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Time Efficiency
   * 
   * Educational: Efficiency metrics help evaluate
   * estimation accuracy and performance.
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
   * Has Subtasks
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the task has subtasks',
    example: true,
  })
  get hasSubtasks(): boolean {
    return (this.children?.length || 0) > 0;
  }

  /**
   * Subtask Count
   */
  @Expose()
  @ApiProperty({
    description: 'Number of subtasks',
    example: 3,
  })
  get subtaskCount(): number {
    return this.children?.length || 0;
  }

  /**
   * Completed Subtasks Count
   */
  @Expose()
  @ApiProperty({
    description: 'Number of completed subtasks',
    example: 2,
  })
  get completedSubtasksCount(): number {
    return this.children?.filter(child => child.isCompleted).length || 0;
  }

  /**
   * Subtask Progress Percentage
   */
  @Expose()
  @ApiProperty({
    description: 'Progress percentage based on subtask completion',
    example: 66.67,
  })
  get subtaskProgressPercentage(): number {
    if (!this.hasSubtasks) return 0;
    return (this.completedSubtasksCount / this.subtaskCount) * 100;
  }

  /**
   * Comment Count
   */
  @Expose()
  @ApiProperty({
    description: 'Number of comments on this task',
    example: 5,
  })
  get commentCount(): number {
    return this.comments?.length || 0;
  }

  /**
   * Attachment Count
   */
  @Expose()
  @ApiProperty({
    description: 'Number of file attachments',
    example: 2,
  })
  get attachmentCount(): number {
    return this.attachments?.length || 0;
  }

  /**
   * Watcher Count
   */
  @Expose()
  @ApiProperty({
    description: 'Number of users watching this task',
    example: 3,
  })
  get watcherCount(): number {
    return this.watchers?.length || 0;
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

    // Set reporter to current user if not set
    // (This would typically be set by the service layer)
    
    // Initialize time tracking if estimated hours are provided
    if (this.estimatedHours && !this.timeTracking) {
      this.timeTracking = {
        estimatedHours: this.estimatedHours,
        actualHours: 0,
        remainingHours: this.estimatedHours,
        timeEntries: [],
        totalBillableHours: 0,
        efficiency: 0,
      };
    }

    // Initialize metadata if not provided
    if (!this.metadata) {
      this.metadata = {
        labels: [],
        customFields: {},
        externalIds: {},
        automation: {
          autoAssign: false,
          autoTransition: false,
          notifyOnChange: true,
          escalationRules: [],
        },
        checklist: [],
      };
    }
  }

  /**
   * Before Update Hook
   */
  @BeforeUpdate()
  async beforeUpdate(): Promise<void> {
    super.beforeUpdate();

    // Set completion date when status changes to completed
    if (this.status === TaskStatus.COMPLETED && !this.completedAt) {
      this.completedAt = new Date();
      this.progressPercentage = 100;
    }

    // Clear completion date if status changes from completed
    if (this.status !== TaskStatus.COMPLETED && this.completedAt) {
      this.completedAt = null;
    }

    // Update time tracking
    if (this.timeTracking && this.actualHours !== undefined) {
      this.timeTracking.actualHours = this.actualHours;
      this.timeTracking.remainingHours = Math.max(0, 
        this.timeTracking.estimatedHours - this.actualHours
      );
      
      if (this.timeTracking.estimatedHours > 0) {
        this.timeTracking.efficiency = 
          this.timeTracking.estimatedHours / this.actualHours;
      }
    }
  }

  /**
   * After Load Hook
   */
  @AfterLoad()
  afterLoad(): void {
    // Ensure metadata has default values
    if (!this.metadata) {
      this.metadata = {
        labels: [],
        customFields: {},
        externalIds: {},
        automation: {
          autoAssign: false,
          autoTransition: false,
          notifyOnChange: true,
          escalationRules: [],
        },
        checklist: [],
      };
    }
  }

  // ==========================================
  // Business Logic Methods
  // ==========================================

  /**
   * Update Status
   * 
   * Educational: Status updates should be centralized
   * to ensure business rules and side effects are applied.
   */
  updateStatus(newStatus: TaskStatus, userId?: string): void {
    const oldStatus = this.status;
    this.status = newStatus;

    // Handle status-specific logic
    if (newStatus === TaskStatus.COMPLETED) {
      this.completedAt = new Date();
      this.progressPercentage = 100;
    } else if (oldStatus === TaskStatus.COMPLETED) {
      this.completedAt = null;
    }

    // Update time tracking
    if (newStatus === TaskStatus.IN_PROGRESS && !this.startDate) {
      this.startDate = new Date();
    }
  }

  /**
   * Update Progress
   * 
   * Educational: Progress updates should validate ranges
   * and trigger related status changes.
   */
  updateProgress(percentage: number): void {
    this.progressPercentage = Math.max(0, Math.min(100, percentage));

    // Auto-complete task when progress reaches 100%
    if (this.progressPercentage === 100 && this.status !== TaskStatus.COMPLETED) {
      this.updateStatus(TaskStatus.COMPLETED);
    }

    // Auto-start task when progress is first updated
    if (this.progressPercentage > 0 && this.status === TaskStatus.TODO) {
      this.updateStatus(TaskStatus.IN_PROGRESS);
    }
  }

  /**
   * Add Time Entry
   * 
   * Educational: Time tracking should be centralized
   * to maintain consistency and update related fields.
   */
  addTimeEntry(
    userId: string,
    duration: number,
    description: string,
    billable: boolean = false
  ): void {
    if (!this.timeTracking) {
      this.timeTracking = {
        estimatedHours: this.estimatedHours || 0,
        actualHours: 0,
        remainingHours: this.estimatedHours || 0,
        timeEntries: [],
        totalBillableHours: 0,
        efficiency: 0,
      };
    }

    const timeEntry = {
      id: this.generateId(),
      userId,
      startTime: new Date(),
      endTime: new Date(Date.now() + duration * 60 * 1000),
      duration,
      description,
      billable,
    };

    this.timeTracking.timeEntries.push(timeEntry);
    
    const hoursToAdd = duration / 60;
    this.actualHours = (this.actualHours || 0) + hoursToAdd;
    this.timeTracking.actualHours = this.actualHours;
    
    if (billable) {
      this.timeTracking.totalBillableHours += hoursToAdd;
    }

    this.timeTracking.remainingHours = Math.max(0,
      this.timeTracking.estimatedHours - this.timeTracking.actualHours
    );

    if (this.timeTracking.estimatedHours > 0) {
      this.timeTracking.efficiency = 
        this.timeTracking.estimatedHours / this.timeTracking.actualHours;
    }
  }

  /**
   * Add Watcher
   * 
   * Educational: Watcher management should prevent
   * duplicates and handle notifications.
   */
  addWatcher(user: User): void {
    if (!this.watchers) {
      this.watchers = [];
    }

    // Prevent duplicate watchers
    if (!this.watchers.some(watcher => watcher.id === user.id)) {
      this.watchers.push(user);
    }
  }

  /**
   * Remove Watcher
   */
  removeWatcher(userId: string): void {
    if (this.watchers) {
      this.watchers = this.watchers.filter(watcher => watcher.id !== userId);
    }
  }

  /**
   * Check if User is Watcher
   */
  isWatcher(userId: string): boolean {
    return this.watchers?.some(watcher => watcher.id === userId) || false;
  }

  /**
   * Add to Category
   * 
   * Educational: Category management should prevent
   * duplicates and maintain relationships.
   */
  addCategory(category: Category): void {
    if (!this.categories) {
      this.categories = [];
    }

    // Prevent duplicate categories
    if (!this.categories.some(cat => cat.id === category.id)) {
      this.categories.push(category);
    }
  }

  /**
   * Remove from Category
   */
  removeCategory(categoryId: string): void {
    if (this.categories) {
      this.categories = this.categories.filter(cat => cat.id !== categoryId);
    }
  }

  /**
   * Update Checklist Item
   * 
   * Educational: Checklist management provides
   * granular progress tracking within tasks.
   */
  updateChecklistItem(itemId: string, completed: boolean, userId?: string): void {
    if (!this.metadata?.checklist) return;

    const item = this.metadata.checklist.find(item => item.id === itemId);
    if (item) {
      item.completed = completed;
      if (completed) {
        item.completedBy = userId;
        item.completedAt = new Date();
      } else {
        item.completedBy = undefined;
        item.completedAt = undefined;
      }

      // Update overall progress based on checklist completion
      const totalItems = this.metadata.checklist.length;
      const completedItems = this.metadata.checklist.filter(item => item.completed).length;
      const checklistProgress = (completedItems / totalItems) * 100;
      
      // Update task progress if it's based on checklist
      if (totalItems > 0) {
        this.updateProgress(checklistProgress);
      }
    }
  }

  /**
   * Can User Edit Task
   * 
   * Educational: Permission checking should be centralized
   * and consider various authorization scenarios.
   */
  canUserEdit(userId: string, userRole?: string): boolean {
    // Task assignee can edit
    if (this.assigneeId === userId) return true;
    
    // Task reporter can edit
    if (this.reporterId === userId) return true;
    
    // Project owner can edit
    if (this.project?.ownerId === userId) return true;
    
    // Admin users can edit
    if (userRole === 'admin' || userRole === 'super_admin') return true;
    
    return false;
  }

  /**
   * Can User View Task
   * 
   * Educational: View permissions are typically more
   * permissive than edit permissions.
   */
  canUserView(userId: string, userRole?: string): boolean {
    // Anyone who can edit can also view
    if (this.canUserEdit(userId, userRole)) return true;
    
    // Project members can view
    if (this.project?.isMember(userId)) return true;
    
    // Watchers can view
    if (this.isWatcher(userId)) return true;
    
    return false;
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  /**
   * Generate unique ID for time entries and checklist items
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}