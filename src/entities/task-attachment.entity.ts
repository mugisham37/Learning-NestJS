/**
 * Task Attachment Entity - File Association Management
 * 
 * This entity demonstrates:
 * - Junction table between tasks and files
 * - File metadata and context tracking
 * - Upload and access control
 * - File versioning and history
 * - Attachment-specific permissions
 * - Usage analytics and tracking
 * 
 * Educational Notes:
 * - Junction tables can store relationship-specific metadata
 * - File associations enable rich document management
 * - Context tracking helps understand file usage
 * - Permission inheritance from parent entities
 * - Soft deletes preserve attachment history
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
  IsString,
  Length,
  IsOptional,
  IsBoolean,
  IsObject,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseEntity } from './base.entity';
import { Task } from './task.entity';
import { File } from './file.entity';
import { User } from './user.entity';

/**
 * Attachment Context Interface
 * 
 * Educational: Context provides information about
 * how and why the file was attached to the task.
 */
export interface AttachmentContext {
  // Upload context
  uploadReason?: string;
  uploadSource?: 'drag_drop' | 'file_picker' | 'paste' | 'api';
  
  // File relationship
  isMainAttachment?: boolean;
  category?: 'document' | 'image' | 'reference' | 'deliverable' | 'other';
  
  // Display preferences
  displayName?: string;
  description?: string;
  tags?: string[];
  
  // Access control
  isPublic?: boolean;
  requiresApproval?: boolean;
  
  // Version information
  version?: string;
  replaces?: string; // ID of attachment this replaces
}

/**
 * Attachment Statistics Interface
 * 
 * Educational: Statistics track file usage and
 * help with storage optimization decisions.
 */
export interface AttachmentStatistics {
  downloadCount: number;
  viewCount: number;
  lastAccessed?: Date;
  lastDownloaded?: Date;
  uniqueViewers: string[]; // User IDs
  uniqueDownloaders: string[]; // User IDs
}

/**
 * Task Attachment Entity
 * 
 * Educational: This entity demonstrates a junction table with rich
 * metadata for managing file attachments to tasks.
 */
@Entity('task_attachments')
@Unique(['taskId', 'fileId'])
@Index(['taskId'])
@Index(['fileId'])
@Index(['uploadedBy'])
@Index(['createdAt'])
@Index(['isActive'])
@Index(['taskId', 'isActive'])
@Index(['fileId', 'isActive'])
export class TaskAttachment extends BaseEntity {
  // ==========================================
  // Foreign Key Relationships
  // ==========================================

  /**
   * Task ID
   * 
   * Educational: Foreign key to the Task entity.
   * Part of the composite unique constraint.
   */
  @Column({ name: 'task_id' })
  @IsUUID()
  @ApiProperty({
    description: 'ID of the task this attachment belongs to',
    format: 'uuid',
  })
  taskId!: string;

  /**
   * Task
   * 
   * Educational: ManyToOne relationship to Task entity.
   * Multiple attachments can belong to one task.
   */
  @ManyToOne(() => Task, task => task.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  @ApiProperty({
    description: 'Task this attachment belongs to',
    type: () => Task,
  })
  task!: Task;

  /**
   * File ID
   * 
   * Educational: Foreign key to the File entity.
   * Part of the composite unique constraint.
   */
  @Column({ name: 'file_id' })
  @IsUUID()
  @ApiProperty({
    description: 'ID of the attached file',
    format: 'uuid',
  })
  fileId!: string;

  /**
   * File
   * 
   * Educational: ManyToOne relationship to File entity.
   * One file can be attached to multiple tasks.
   */
  @ManyToOne(() => File, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'file_id' })
  @ApiProperty({
    description: 'Attached file',
    type: () => File,
  })
  file!: File;

  /**
   * Uploaded By
   * 
   * Educational: Tracking who attached the file helps
   * with permissions and audit trails.
   */
  @Column({ name: 'uploaded_by' })
  @IsUUID()
  @ApiProperty({
    description: 'ID of the user who attached the file',
    format: 'uuid',
  })
  uploadedBy!: string;

  /**
   * Uploader
   * 
   * Educational: ManyToOne relationship to User entity
   * for the person who attached the file to the task.
   */
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'uploaded_by' })
  @ApiProperty({
    description: 'User who attached the file',
    type: () => User,
  })
  uploader!: User;

  // ==========================================
  // Attachment Information
  // ==========================================

  /**
   * Display Name
   * 
   * Educational: Display name allows customization of
   * how the attachment appears in the task context.
   */
  @Column({ name: 'display_name', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  @ApiPropertyOptional({
    description: 'Custom display name for the attachment',
    example: 'Requirements Document v2.1',
    maxLength: 255,
  })
  displayName?: string;

  /**
   * Description
   * 
   * Educational: Description provides context about
   * the attachment's purpose and content.
   */
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Description of the attachment',
    example: 'Updated requirements document with client feedback incorporated',
  })
  description?: string | undefined;

  /**
   * Sort Order
   * 
   * Educational: Sort order allows custom arrangement
   * of attachments within the task.
   */
  @Column({ name: 'sort_order', default: 0 })
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'Sort order for attachment display',
    example: 1,
    minimum: 0,
  })
  sortOrder!: number;

  /**
   * Is Active
   * 
   * Educational: Active flag allows attachments to be
   * hidden without deleting the relationship.
   */
  @Column({ name: 'is_active', default: true })
  @IsBoolean()
  @ApiProperty({
    description: 'Whether the attachment is active',
    example: true,
  })
  isActive!: boolean;

  /**
   * Is Pinned
   * 
   * Educational: Pinned attachments are highlighted
   * and shown prominently in the task interface.
   */
  @Column({ name: 'is_pinned', default: false })
  @IsBoolean()
  @ApiProperty({
    description: 'Whether the attachment is pinned',
    example: false,
  })
  isPinned!: boolean;

  // ==========================================
  // Extended Data (JSON Columns)
  // ==========================================

  /**
   * Attachment Context
   * 
   * Educational: JSON column for storing attachment-specific
   * metadata and context information.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'Additional context and metadata for the attachment',
    type: 'object',
  })
  context?: AttachmentContext;

  /**
   * Attachment Statistics
   * 
   * Educational: JSON column for tracking usage statistics
   * and access patterns.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'Usage statistics for the attachment',
    type: 'object',
  })
  statistics?: AttachmentStatistics;

  // ==========================================
  // Virtual Properties
  // ==========================================

  /**
   * Effective Display Name
   * 
   * Educational: Provides fallback to file name
   * when no custom display name is set.
   */
  @Expose()
  @ApiProperty({
    description: 'Display name or file name if display name is not set',
    example: 'Requirements Document v2.1',
  })
  get effectiveDisplayName(): string {
    return this.displayName || this.file?.originalName || 'Unnamed Attachment';
  }

  /**
   * File Size
   * 
   * Educational: Convenience property for accessing
   * file size through the relationship.
   */
  @Expose()
  @ApiProperty({
    description: 'Size of the attached file in bytes',
    example: 1048576,
  })
  get fileSize(): number {
    return this.file?.sizeBytes || 0;
  }

  /**
   * File Type
   * 
   * Educational: Convenience property for accessing
   * file type through the relationship.
   */
  @Expose()
  @ApiProperty({
    description: 'MIME type of the attached file',
    example: 'application/pdf',
  })
  get fileType(): string {
    return this.file?.mimeType || 'application/octet-stream';
  }

  /**
   * Download Count
   * 
   * Educational: Usage statistics help understand
   * attachment popularity and importance.
   */
  @Expose()
  @ApiProperty({
    description: 'Number of times the attachment has been downloaded',
    example: 15,
  })
  get downloadCount(): number {
    return this.statistics?.downloadCount || 0;
  }

  /**
   * View Count
   */
  @Expose()
  @ApiProperty({
    description: 'Number of times the attachment has been viewed',
    example: 42,
  })
  get viewCount(): number {
    return this.statistics?.viewCount || 0;
  }

  /**
   * Is Image
   * 
   * Educational: Type checking helps with UI rendering
   * and feature availability decisions.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the attachment is an image file',
    example: false,
  })
  get isImage(): boolean {
    return this.fileType.startsWith('image/');
  }

  /**
   * Is Document
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the attachment is a document file',
    example: true,
  })
  get isDocument(): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];
    return documentTypes.includes(this.fileType);
  }

  /**
   * Last Accessed
   * 
   * Educational: Access tracking helps identify
   * frequently used attachments.
   */
  @Expose()
  @ApiProperty({
    description: 'Timestamp when the attachment was last accessed',
    type: 'string',
    format: 'date-time',
  })
  get lastAccessed(): Date | null {
    return this.statistics?.lastAccessed || null;
  }

  /**
   * Age in Days
   * 
   * Educational: Age calculation helps with
   * attachment lifecycle management.
   */
  @Expose()
  @ApiProperty({
    description: 'Age of the attachment in days',
    example: 30,
  })
  get ageInDays(): number {
    const diffTime = Date.now() - this.createdAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // ==========================================
  // Entity Lifecycle Hooks
  // ==========================================

  /**
   * Before Insert Hook
   */
  @BeforeInsert()
  override async beforeInsert(): Promise<void> {
    super.beforeInsert();

    // Initialize context if not provided
    if (!this.context) {
      this.context = {
        category: 'other',
        isPublic: false,
        requiresApproval: false,
      };
    }

    // Initialize statistics
    if (!this.statistics) {
      this.statistics = {
        downloadCount: 0,
        viewCount: 0,
        uniqueViewers: [],
        uniqueDownloaders: [],
      };
    }

    // Set display name from file if not provided
    if (!this.displayName && this.file?.originalName) {
      this.displayName = this.file.originalName;
    }
  }

  /**
   * Before Update Hook
   */
  @BeforeUpdate()
  override async beforeUpdate(): Promise<void> {
    super.beforeUpdate();
  }

  // ==========================================
  // Business Logic Methods
  // ==========================================

  /**
   * Record View
   * 
   * Educational: View tracking should update statistics
   * and handle unique viewer counting.
   */
  recordView(userId: string): void {
    if (!this.statistics) {
      this.statistics = {
        downloadCount: 0,
        viewCount: 0,
        uniqueViewers: [],
        uniqueDownloaders: [],
      };
    }

    this.statistics.viewCount++;
    this.statistics.lastAccessed = new Date();

    // Track unique viewers
    if (!this.statistics.uniqueViewers.includes(userId)) {
      this.statistics.uniqueViewers.push(userId);
    }
  }

  /**
   * Record Download
   * 
   * Educational: Download tracking should update statistics
   * and handle unique downloader counting.
   */
  recordDownload(userId: string): void {
    if (!this.statistics) {
      this.statistics = {
        downloadCount: 0,
        viewCount: 0,
        uniqueViewers: [],
        uniqueDownloaders: [],
      };
    }

    this.statistics.downloadCount++;
    this.statistics.lastDownloaded = new Date();
    this.statistics.lastAccessed = new Date();

    // Track unique downloaders
    if (!this.statistics.uniqueDownloaders.includes(userId)) {
      this.statistics.uniqueDownloaders.push(userId);
    }

    // Also count as a view
    if (!this.statistics.uniqueViewers.includes(userId)) {
      this.statistics.uniqueViewers.push(userId);
    }
  }

  /**
   * Update Display Name
   * 
   * Educational: Display name updates should validate
   * length and handle special characters appropriately.
   */
  updateDisplayName(newName: string): void {
    if (newName.length === 0 || newName.length > 255) {
      throw new Error('Display name must be between 1 and 255 characters');
    }
    
    this.displayName = newName.trim();
  }

  /**
   * Update Description
   */
  updateDescription(newDescription: string): void {
    this.description = newDescription.trim() || undefined;
  }

  /**
   * Pin Attachment
   * 
   * Educational: Pinning should be limited to prevent
   * UI clutter and maintain visual hierarchy.
   */
  pin(): void {
    this.isPinned = true;
    
    // Update context
    if (!this.context) {
      this.context = {};
    }
    this.context.isMainAttachment = true;
  }

  /**
   * Unpin Attachment
   */
  unpin(): void {
    this.isPinned = false;
    
    // Update context
    if (this.context) {
      this.context.isMainAttachment = false;
    }
  }

  /**
   * Deactivate Attachment
   * 
   * Educational: Deactivation hides the attachment
   * without deleting the relationship or statistics.
   */
  deactivate(): void {
    this.isActive = false;
  }

  /**
   * Reactivate Attachment
   */
  reactivate(): void {
    this.isActive = true;
  }

  /**
   * Update Sort Order
   * 
   * Educational: Sort order management should handle
   * conflicts and maintain consistent ordering.
   */
  updateSortOrder(newOrder: number): void {
    this.sortOrder = Math.max(0, newOrder);
  }

  /**
   * Set Category
   * 
   * Educational: Category management helps organize
   * attachments and enables filtering.
   */
  setCategory(category: AttachmentContext['category']): void {
    if (!this.context) {
      this.context = {};
    }
    this.context.category = category || 'other';
  }

  /**
   * Add Tag
   * 
   * Educational: Tag management enables flexible
   * organization and search capabilities.
   */
  addTag(tag: string): void {
    if (!this.context) {
      this.context = {};
    }
    
    if (!this.context.tags) {
      this.context.tags = [];
    }
    
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !this.context.tags.includes(normalizedTag)) {
      this.context.tags.push(normalizedTag);
    }
  }

  /**
   * Remove Tag
   */
  removeTag(tag: string): void {
    if (!this.context?.tags) return;
    
    const normalizedTag = tag.trim().toLowerCase();
    this.context.tags = this.context.tags.filter(t => t !== normalizedTag);
  }

  /**
   * Has Tag
   */
  hasTag(tag: string): boolean {
    if (!this.context?.tags) return false;
    
    const normalizedTag = tag.trim().toLowerCase();
    return this.context.tags.includes(normalizedTag);
  }

  /**
   * Can User Access
   * 
   * Educational: Access control should consider attachment
   * permissions, task permissions, and user roles.
   */
  canUserAccess(userId: string, userRole?: string): boolean {
    // Uploader can always access
    if (this.uploadedBy === userId) return true;
    
    // Check if attachment is public
    if (this.context?.isPublic) return true;
    
    // Check task access (would typically be done by service layer)
    // For now, assume task access is checked separately
    
    // Admin users can access
    if (userRole === 'admin' || userRole === 'super_admin') return true;
    
    return false;
  }

  /**
   * Can User Edit
   * 
   * Educational: Edit permissions should be more restrictive
   * than view permissions.
   */
  canUserEdit(userId: string, userRole?: string): boolean {
    // Uploader can edit
    if (this.uploadedBy === userId) return true;
    
    // Admin users can edit
    if (userRole === 'admin' || userRole === 'super_admin') return true;
    
    return false;
  }

  /**
   * Can User Delete
   */
  canUserDelete(userId: string, userRole?: string): boolean {
    // Uploader can delete
    if (this.uploadedBy === userId) return true;
    
    // Admin users can delete
    if (userRole === 'admin' || userRole === 'super_admin') return true;
    
    return false;
  }

  /**
   * Get Usage Summary
   * 
   * Educational: Usage summaries provide insights
   * for attachment management and optimization.
   */
  getUsageSummary(): {
    totalViews: number;
    totalDownloads: number;
    uniqueViewers: number;
    uniqueDownloaders: number;
    lastAccessed: Date | null;
    ageInDays: number;
    isPopular: boolean;
  } {
    const stats = this.statistics || {
      downloadCount: 0,
      viewCount: 0,
      uniqueViewers: [],
      uniqueDownloaders: [],
    };

    return {
      totalViews: stats.viewCount,
      totalDownloads: stats.downloadCount,
      uniqueViewers: stats.uniqueViewers.length,
      uniqueDownloaders: stats.uniqueDownloaders.length,
      lastAccessed: stats.lastAccessed || null,
      ageInDays: this.ageInDays,
      isPopular: stats.viewCount > 10 || stats.downloadCount > 5,
    };
  }
}