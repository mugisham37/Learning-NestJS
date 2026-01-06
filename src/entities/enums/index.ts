/**
 * Entity Enums - Type-Safe Constants
 * 
 * This file demonstrates:
 * - TypeScript enums for type safety
 * - Database enum column types
 * - API documentation with enum values
 * - Consistent naming conventions
 * - Extensible enum patterns
 * 
 * Educational Notes:
 * - Enums provide type safety and prevent invalid values
 * - String enums are more readable in databases and logs
 * - Const assertions create readonly tuples for validation
 * - Enum values should be descriptive and consistent
 * - Database constraints ensure data integrity
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * User Role Enum
 * 
 * Educational: String enums are preferred over numeric enums
 * because they're more readable in databases and logs.
 */
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

/**
 * User Status Enum
 * 
 * Educational: User status helps manage account lifecycle
 * and implement features like email verification and account suspension.
 */
export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

/**
 * Project Status Enum
 * 
 * Educational: Project status tracks the lifecycle of projects
 * from planning through completion and archival.
 */
export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived',
}

/**
 * Project Visibility Enum
 * 
 * Educational: Visibility controls who can see and access projects,
 * implementing different levels of privacy and collaboration.
 */
export enum ProjectVisibility {
  PRIVATE = 'private',
  INTERNAL = 'internal',
  PUBLIC = 'public',
}

/**
 * Task Status Enum
 * 
 * Educational: Task status follows a typical workflow
 * from creation through completion, with branching for different outcomes.
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Task Priority Enum
 * 
 * Educational: Priority levels help with task organization
 * and resource allocation. Using descriptive names instead of numbers.
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

/**
 * Task Type Enum
 * 
 * Educational: Task types help categorize work and can be used
 * for reporting, filtering, and workflow automation.
 */
export enum TaskType {
  FEATURE = 'feature',
  BUG = 'bug',
  IMPROVEMENT = 'improvement',
  DOCUMENTATION = 'documentation',
  TESTING = 'testing',
  RESEARCH = 'research',
  MAINTENANCE = 'maintenance',
}

/**
 * Comment Type Enum
 * 
 * Educational: Comment types help organize different kinds
 * of feedback and communication within the system.
 */
export enum CommentType {
  COMMENT = 'comment',
  REVIEW = 'review',
  APPROVAL = 'approval',
  REJECTION = 'rejection',
  QUESTION = 'question',
  ANSWER = 'answer',
  NOTE = 'note',
}

/**
 * File Type Enum
 * 
 * Educational: File types help organize and validate uploads,
 * and can be used for different processing workflows.
 */
export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  ARCHIVE = 'archive',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other',
}

/**
 * File Storage Provider Enum
 * 
 * Educational: Storage providers allow flexibility in file storage
 * and can be used for cost optimization and feature selection.
 */
export enum FileStorageProvider {
  LOCAL = 'local',
  AWS_S3 = 'aws_s3',
  GOOGLE_CLOUD = 'google_cloud',
  AZURE_BLOB = 'azure_blob',
  CLOUDINARY = 'cloudinary',
}

/**
 * Activity Log Action Enum
 * 
 * Educational: Activity actions provide detailed audit trails
 * for all system operations and user interactions.
 */
export enum ActivityLogAction {
  // User actions
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  
  // Project actions
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_DELETED = 'project_deleted',
  PROJECT_MEMBER_ADDED = 'project_member_added',
  PROJECT_MEMBER_REMOVED = 'project_member_removed',
  
  // Task actions
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_DELETED = 'task_deleted',
  TASK_ASSIGNED = 'task_assigned',
  TASK_UNASSIGNED = 'task_unassigned',
  TASK_STATUS_CHANGED = 'task_status_changed',
  TASK_PRIORITY_CHANGED = 'task_priority_changed',
  
  // Comment actions
  COMMENT_CREATED = 'comment_created',
  COMMENT_UPDATED = 'comment_updated',
  COMMENT_DELETED = 'comment_deleted',
  
  // File actions
  FILE_UPLOADED = 'file_uploaded',
  FILE_DOWNLOADED = 'file_downloaded',
  FILE_DELETED = 'file_deleted',
  
  // Category actions
  CATEGORY_CREATED = 'category_created',
  CATEGORY_UPDATED = 'category_updated',
  CATEGORY_DELETED = 'category_deleted',
}

/**
 * Project Member Role Enum
 * 
 * Educational: Project-specific roles allow fine-grained
 * access control within individual projects.
 */
export enum ProjectMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
  GUEST = 'guest',
}

/**
 * Notification Type Enum
 * 
 * Educational: Notification types help organize different
 * kinds of system notifications and user preferences.
 */
export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_OVERDUE = 'task_overdue',
  COMMENT_ADDED = 'comment_added',
  PROJECT_INVITATION = 'project_invitation',
  PROJECT_UPDATE = 'project_update',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  SECURITY_ALERT = 'security_alert',
}

/**
 * Notification Status Enum
 * 
 * Educational: Notification status tracks the lifecycle
 * of notifications from creation to user interaction.
 */
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  DISMISSED = 'dismissed',
  FAILED = 'failed',
}

/**
 * Enum Validation Arrays
 * 
 * Educational: These arrays can be used for validation
 * in DTOs and other places where enum values need to be checked.
 */
export const USER_ROLES = Object.values(UserRole) as const;
export const USER_STATUSES = Object.values(UserStatus) as const;
export const PROJECT_STATUSES = Object.values(ProjectStatus) as const;
export const PROJECT_VISIBILITIES = Object.values(ProjectVisibility) as const;
export const TASK_STATUSES = Object.values(TaskStatus) as const;
export const TASK_PRIORITIES = Object.values(TaskPriority) as const;
export const TASK_TYPES = Object.values(TaskType) as const;
export const COMMENT_TYPES = Object.values(CommentType) as const;
export const FILE_TYPES = Object.values(FileType) as const;
export const FILE_STORAGE_PROVIDERS = Object.values(FileStorageProvider) as const;
export const ACTIVITY_LOG_ACTIONS = Object.values(ActivityLogAction) as const;
export const PROJECT_MEMBER_ROLES = Object.values(ProjectMemberRole) as const;
export const NOTIFICATION_TYPES = Object.values(NotificationType) as const;
export const NOTIFICATION_STATUSES = Object.values(NotificationStatus) as const;

/**
 * Enum Helper Functions
 * 
 * Educational: Helper functions provide convenient ways
 * to work with enums in business logic and validation.
 */

/**
 * Check if a value is a valid enum value
 */
export function isValidEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: string
): value is T[keyof T] {
  return Object.values(enumObject).includes(value as T[keyof T]);
}

/**
 * Get enum values as array
 */
export function getEnumValues<T extends Record<string, string>>(enumObject: T): T[keyof T][] {
  return Object.values(enumObject);
}

/**
 * Get enum keys as array
 */
export function getEnumKeys<T extends Record<string, string>>(enumObject: T): (keyof T)[] {
  return Object.keys(enumObject) as (keyof T)[];
}

/**
 * Convert enum value to display string
 */
export function enumToDisplayString(value: string): string {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Enum Metadata for API Documentation
 * 
 * Educational: These objects provide metadata for API documentation
 * and can be used with @ApiProperty decorators.
 */
export const EnumMetadata = {
  UserRole: {
    enum: UserRole,
    description: 'User role in the system',
    example: UserRole.USER,
  },
  UserStatus: {
    enum: UserStatus,
    description: 'Current status of the user account',
    example: UserStatus.ACTIVE,
  },
  ProjectStatus: {
    enum: ProjectStatus,
    description: 'Current status of the project',
    example: ProjectStatus.ACTIVE,
  },
  ProjectVisibility: {
    enum: ProjectVisibility,
    description: 'Visibility level of the project',
    example: ProjectVisibility.PRIVATE,
  },
  TaskStatus: {
    enum: TaskStatus,
    description: 'Current status of the task',
    example: TaskStatus.TODO,
  },
  TaskPriority: {
    enum: TaskPriority,
    description: 'Priority level of the task',
    example: TaskPriority.MEDIUM,
  },
  TaskType: {
    enum: TaskType,
    description: 'Type/category of the task',
    example: TaskType.FEATURE,
  },
  CommentType: {
    enum: CommentType,
    description: 'Type of comment or feedback',
    example: CommentType.COMMENT,
  },
  FileType: {
    enum: FileType,
    description: 'Type of uploaded file',
    example: FileType.DOCUMENT,
  },
  FileStorageProvider: {
    enum: FileStorageProvider,
    description: 'Storage provider for the file',
    example: FileStorageProvider.LOCAL,
  },
  ActivityLogAction: {
    enum: ActivityLogAction,
    description: 'Action that was performed',
    example: ActivityLogAction.TASK_CREATED,
  },
  ProjectMemberRole: {
    enum: ProjectMemberRole,
    description: 'Role of the member within the project',
    example: ProjectMemberRole.MEMBER,
  },
  NotificationType: {
    enum: NotificationType,
    description: 'Type of notification',
    example: NotificationType.TASK_ASSIGNED,
  },
  NotificationStatus: {
    enum: NotificationStatus,
    description: 'Status of the notification',
    example: NotificationStatus.PENDING,
  },
} as const;