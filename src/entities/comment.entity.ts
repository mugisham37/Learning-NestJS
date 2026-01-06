/**
 * Comment Entity - Discussion and Collaboration System
 * 
 * This entity demonstrates:
 * - Hierarchical comment structures with threading
 * - Rich text content with mentions and formatting
 * - Comment types for different kinds of feedback
 * - Edit history and audit trails
 * - Reaction and voting systems
 * - Moderation and approval workflows
 * 
 * Educational Notes:
 * - Comments enable collaboration and discussion on tasks
 * - Self-referencing relationships create threaded conversations
 * - Rich content supports formatted text and mentions
 * - Edit tracking maintains transparency and audit trails
 * - Reaction systems provide lightweight feedback mechanisms
 */

import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from 'typeorm';
import {
  IsString,
  Length,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  ValidateNested,
  IsUUID,
  IsArray,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseEntity } from './base.entity';
import { CommentType, EnumMetadata } from './enums';
import { User } from './user.entity';
import { Task } from './task.entity';

/**
 * Comment Reactions Interface
 * 
 * Educational: Reactions provide lightweight feedback
 * without requiring full comment responses.
 */
export interface CommentReactions {
  [emoji: string]: {
    count: number;
    users: string[]; // User IDs who reacted
  };
}

/**
 * Comment Mentions Interface
 * 
 * Educational: Mentions enable user notifications
 * and create connections between users and content.
 */
export interface CommentMentions {
  users: {
    id: string;
    username: string;
    displayName: string;
    position: number; // Position in content where mentioned
  }[];
  teams?: {
    id: string;
    name: string;
    position: number;
  }[];
}

/**
 * Comment Edit History Interface
 * 
 * Educational: Edit history maintains transparency
 * and provides audit trails for content changes.
 */
export interface CommentEditHistory {
  editedAt: Date;
  editedBy: string;
  previousContent: string;
  reason?: string;
}

/**
 * Comment Metadata Interface
 * 
 * Educational: Metadata provides extensibility
 * for comment-specific features and integrations.
 */
export interface CommentMetadata {
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  formatting?: {
    bold: { start: number; end: number }[];
    italic: { start: number; end: number }[];
    code: { start: number; end: number }[];
    links: { start: number; end: number; url: string }[];
  };
  source?: {
    platform: string;
    id: string;
    url?: string;
  };
  flags?: {
    pinned: boolean;
    resolved: boolean;
    spam: boolean;
    inappropriate: boolean;
  };
}

/**
 * Comment Entity
 * 
 * Educational: This entity demonstrates comprehensive comment management
 * with threading, reactions, mentions, and rich content support.
 */
@Entity('comments')
@Index(['taskId'])
@Index(['authorId'])
@Index(['parentId'])
@Index(['type'])
@Index(['createdAt'])
@Index(['isEdited'])
@Index(['taskId', 'createdAt'])
@Index(['authorId', 'createdAt'])
export class Comment extends BaseEntity {
  // ==========================================
  // Basic Information
  // ==========================================

  /**
   * Comment Content
   * 
   * Educational: Content supports rich text formatting
   * and can include mentions, links, and other markup.
   */
  @Column({ type: 'text' })
  @IsString()
  @Length(1, 10000, { message: 'Comment content must be between 1 and 10000 characters' })
  @ApiProperty({
    description: 'Comment content (supports rich text)',
    example: 'This looks great! @johndoe what do you think about the implementation?',
    maxLength: 10000,
  })
  content: string;

  /**
   * Comment Type
   * 
   * Educational: Types help categorize different kinds
   * of feedback and enable specialized workflows.
   */
  @Column({
    type: 'enum',
    enum: CommentType,
    default: CommentType.COMMENT,
  })
  @IsEnum(CommentType, { message: 'Please provide a valid comment type' })
  @ApiProperty(EnumMetadata.CommentType)
  type: CommentType;

  /**
   * Is Edited Flag
   * 
   * Educational: Edit tracking provides transparency
   * about content modifications.
   */
  @Column({ name: 'is_edited', default: false })
  @IsBoolean()
  @ApiProperty({
    description: 'Whether the comment has been edited',
    example: false,
  })
  isEdited: boolean;

  /**
   * Last Edited At
   * 
   * Educational: Edit timestamps help users understand
   * when content was last modified.
   */
  @Column({ name: 'last_edited_at', nullable: true })
  @ApiPropertyOptional({
    description: 'Timestamp when comment was last edited',
    type: 'string',
    format: 'date-time',
  })
  lastEditedAt?: Date;

  /**
   * Is Pinned
   * 
   * Educational: Pinned comments stay at the top
   * of discussions for important information.
   */
  @Column({ name: 'is_pinned', default: false })
  @IsBoolean()
  @ApiProperty({
    description: 'Whether the comment is pinned',
    example: false,
  })
  isPinned: boolean;

  /**
   * Is Resolved
   * 
   * Educational: Resolution status helps track
   * which discussions have been addressed.
   */
  @Column({ name: 'is_resolved', default: false })
  @IsBoolean()
  @ApiProperty({
    description: 'Whether the comment thread is resolved',
    example: false,
  })
  isResolved: boolean;

  // ==========================================
  // Relationships
  // ==========================================

  /**
   * Task ID
   * 
   * Educational: Foreign key to the Task entity.
   * Comments belong to specific tasks.
   */
  @Column({ name: 'task_id' })
  @IsUUID()
  @ApiProperty({
    description: 'ID of the task this comment belongs to',
    format: 'uuid',
  })
  taskId: string;

  /**
   * Task
   * 
   * Educational: ManyToOne relationship to Task entity.
   * Multiple comments can belong to one task.
   */
  @ManyToOne(() => Task, task => task.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  @ApiProperty({
    description: 'Task this comment belongs to',
    type: () => Task,
  })
  task: Task;

  /**
   * Author ID
   * 
   * Educational: Foreign key to the User entity.
   * Every comment has an author.
   */
  @Column({ name: 'author_id' })
  @IsUUID()
  @ApiProperty({
    description: 'ID of the comment author',
    format: 'uuid',
  })
  authorId: string;

  /**
   * Author
   * 
   * Educational: ManyToOne relationship to User entity.
   * Multiple comments can be authored by one user.
   */
  @ManyToOne(() => User, user => user.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'author_id' })
  @ApiProperty({
    description: 'Comment author',
    type: () => User,
  })
  author: User;

  /**
   * Parent Comment ID
   * 
   * Educational: Self-referencing foreign key enables
   * threaded comment discussions.
   */
  @Column({ name: 'parent_id', nullable: true })
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: 'ID of the parent comment (for threading)',
    format: 'uuid',
  })
  parentId?: string;

  /**
   * Parent Comment
   * 
   * Educational: Self-referencing ManyToOne relationship
   * creates threaded comment structures.
   */
  @ManyToOne(() => Comment, comment => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  @ApiPropertyOptional({
    description: 'Parent comment (for threading)',
    type: () => Comment,
  })
  parent?: Comment;

  /**
   * Reply Comments
   * 
   * Educational: OneToMany relationship provides access
   * to all replies in the comment thread.
   */
  @OneToMany(() => Comment, comment => comment.parent)
  @ApiPropertyOptional({
    description: 'Reply comments',
    type: () => [Comment],
  })
  replies?: Comment[];

  // ==========================================
  // Extended Data (JSON Columns)
  // ==========================================

  /**
   * Reactions
   * 
   * Educational: JSON column for storing emoji reactions
   * and user engagement data.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({
    description: 'Comment reactions (emoji and user counts)',
    type: 'object',
    example: {
      '👍': { count: 5, users: ['user1', 'user2'] },
      '❤️': { count: 2, users: ['user3', 'user4'] },
    },
  })
  reactions?: CommentReactions;

  /**
   * Mentions
   * 
   * Educational: JSON column for storing user and team
   * mentions within the comment content.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'Users and teams mentioned in the comment',
    type: 'object',
  })
  mentions?: CommentMentions;

  /**
   * Edit History
   * 
   * Educational: JSON column for tracking all edits
   * made to the comment content.
   */
  @Column({ name: 'edit_history', type: 'jsonb', nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  @Exclude() // Don't expose edit history in API by default
  editHistory?: CommentEditHistory[];

  /**
   * Metadata
   * 
   * Educational: JSON column for extensible comment
   * features and additional information.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'Additional comment metadata',
    type: 'object',
  })
  metadata?: CommentMetadata;

  // ==========================================
  // Virtual Properties
  // ==========================================

  /**
   * Reply Count
   * 
   * Educational: Reply count helps users understand
   * the level of discussion activity.
   */
  @Expose()
  @ApiProperty({
    description: 'Number of replies to this comment',
    example: 3,
  })
  get replyCount(): number {
    return this.replies?.length || 0;
  }

  /**
   * Has Replies
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the comment has replies',
    example: true,
  })
  get hasReplies(): boolean {
    return this.replyCount > 0;
  }

  /**
   * Is Thread Root
   * 
   * Educational: Root comments start new discussion threads
   * and don't have parent comments.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether this is a root comment (not a reply)',
    example: true,
  })
  get isThreadRoot(): boolean {
    return !this.parentId;
  }

  /**
   * Thread Depth
   * 
   * Educational: Thread depth indicates how nested
   * the comment is in the discussion hierarchy.
   */
  @Expose()
  @ApiProperty({
    description: 'Depth level in comment thread',
    example: 2,
  })
  get threadDepth(): number {
    let depth = 0;
    let current = this.parent;
    
    while (current) {
      depth++;
      current = current.parent;
    }
    
    return depth;
  }

  /**
   * Total Reactions
   * 
   * Educational: Total reaction count provides
   * a quick measure of engagement.
   */
  @Expose()
  @ApiProperty({
    description: 'Total number of reactions',
    example: 7,
  })
  get totalReactions(): number {
    if (!this.reactions) return 0;
    
    return Object.values(this.reactions).reduce(
      (total, reaction) => total + reaction.count,
      0
    );
  }

  /**
   * Mention Count
   */
  @Expose()
  @ApiProperty({
    description: 'Number of users mentioned',
    example: 2,
  })
  get mentionCount(): number {
    return this.mentions?.users?.length || 0;
  }

  /**
   * Content Preview
   * 
   * Educational: Content preview provides a truncated
   * version for lists and notifications.
   */
  @Expose()
  @ApiProperty({
    description: 'Truncated content preview',
    example: 'This looks great! @johndoe what do you...',
  })
  get contentPreview(): string {
    const maxLength = 100;
    if (this.content.length <= maxLength) {
      return this.content;
    }
    return this.content.substring(0, maxLength) + '...';
  }

  /**
   * Age in Hours
   * 
   * Educational: Age calculation helps with
   * sorting and relevance determination.
   */
  @Expose()
  @ApiProperty({
    description: 'Comment age in hours',
    example: 24,
  })
  get ageInHours(): number {
    return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60));
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

    // Extract mentions from content
    this.extractMentions();

    // Initialize reactions if not provided
    if (!this.reactions) {
      this.reactions = {};
    }

    // Initialize metadata if not provided
    if (!this.metadata) {
      this.metadata = {
        flags: {
          pinned: false,
          resolved: false,
          spam: false,
          inappropriate: false,
        },
      };
    }
  }

  /**
   * Before Update Hook
   */
  @BeforeUpdate()
  async beforeUpdate(): Promise<void> {
    super.beforeUpdate();

    // Track edit history if content changed
    if (this.isEdited) {
      this.lastEditedAt = new Date();
      // Edit history would be managed by the service layer
    }

    // Re-extract mentions if content changed
    this.extractMentions();
  }

  /**
   * After Load Hook
   */
  @AfterLoad()
  afterLoad(): void {
    // Ensure reactions object exists
    if (!this.reactions) {
      this.reactions = {};
    }

    // Ensure metadata has default values
    if (!this.metadata) {
      this.metadata = {
        flags: {
          pinned: false,
          resolved: false,
          spam: false,
          inappropriate: false,
        },
      };
    }
  }

  // ==========================================
  // Business Logic Methods
  // ==========================================

  /**
   * Add Reaction
   * 
   * Educational: Reaction management should prevent
   * duplicates and maintain accurate counts.
   */
  addReaction(emoji: string, userId: string): void {
    if (!this.reactions) {
      this.reactions = {};
    }

    if (!this.reactions[emoji]) {
      this.reactions[emoji] = { count: 0, users: [] };
    }

    // Prevent duplicate reactions from same user
    if (!this.reactions[emoji].users.includes(userId)) {
      this.reactions[emoji].users.push(userId);
      this.reactions[emoji].count++;
    }
  }

  /**
   * Remove Reaction
   */
  removeReaction(emoji: string, userId: string): void {
    if (!this.reactions?.[emoji]) return;

    const userIndex = this.reactions[emoji].users.indexOf(userId);
    if (userIndex > -1) {
      this.reactions[emoji].users.splice(userIndex, 1);
      this.reactions[emoji].count--;

      // Remove emoji if no users have reacted
      if (this.reactions[emoji].count === 0) {
        delete this.reactions[emoji];
      }
    }
  }

  /**
   * Toggle Reaction
   * 
   * Educational: Toggle functionality provides
   * convenient reaction management for users.
   */
  toggleReaction(emoji: string, userId: string): void {
    if (this.hasUserReacted(emoji, userId)) {
      this.removeReaction(emoji, userId);
    } else {
      this.addReaction(emoji, userId);
    }
  }

  /**
   * Check if User Has Reacted
   */
  hasUserReacted(emoji: string, userId: string): boolean {
    return this.reactions?.[emoji]?.users.includes(userId) || false;
  }

  /**
   * Edit Content
   * 
   * Educational: Content editing should track history
   * and maintain audit trails.
   */
  editContent(newContent: string, editedBy: string, reason?: string): void {
    // Store previous content in edit history
    if (!this.editHistory) {
      this.editHistory = [];
    }

    this.editHistory.push({
      editedAt: new Date(),
      editedBy,
      previousContent: this.content,
      reason,
    });

    // Update content and flags
    this.content = newContent;
    this.isEdited = true;
    this.lastEditedAt = new Date();

    // Re-extract mentions from new content
    this.extractMentions();
  }

  /**
   * Pin Comment
   * 
   * Educational: Pinning should be restricted to
   * authorized users and limited in quantity.
   */
  pin(): void {
    this.isPinned = true;
    if (!this.metadata) {
      this.metadata = { flags: { pinned: true, resolved: false, spam: false, inappropriate: false } };
    } else {
      this.metadata.flags = { ...this.metadata.flags, pinned: true };
    }
  }

  /**
   * Unpin Comment
   */
  unpin(): void {
    this.isPinned = false;
    if (this.metadata?.flags) {
      this.metadata.flags.pinned = false;
    }
  }

  /**
   * Resolve Thread
   * 
   * Educational: Resolution should cascade to
   * child comments in the thread.
   */
  resolve(): void {
    this.isResolved = true;
    if (!this.metadata) {
      this.metadata = { flags: { pinned: false, resolved: true, spam: false, inappropriate: false } };
    } else {
      this.metadata.flags = { ...this.metadata.flags, resolved: true };
    }

    // Optionally resolve all replies
    if (this.replies) {
      this.replies.forEach(reply => reply.resolve());
    }
  }

  /**
   * Unresolve Thread
   */
  unresolve(): void {
    this.isResolved = false;
    if (this.metadata?.flags) {
      this.metadata.flags.resolved = false;
    }
  }

  /**
   * Flag as Spam
   * 
   * Educational: Moderation flags help maintain
   * content quality and community standards.
   */
  flagAsSpam(): void {
    if (!this.metadata) {
      this.metadata = { flags: { pinned: false, resolved: false, spam: true, inappropriate: false } };
    } else {
      this.metadata.flags = { ...this.metadata.flags, spam: true };
    }
  }

  /**
   * Flag as Inappropriate
   */
  flagAsInappropriate(): void {
    if (!this.metadata) {
      this.metadata = { flags: { pinned: false, resolved: false, spam: false, inappropriate: true } };
    } else {
      this.metadata.flags = { ...this.metadata.flags, inappropriate: true };
    }
  }

  /**
   * Can User Edit Comment
   * 
   * Educational: Edit permissions should consider
   * authorship, time limits, and user roles.
   */
  canUserEdit(userId: string, userRole?: string): boolean {
    // Comment author can edit (within time limit)
    if (this.authorId === userId) {
      // Allow editing within 24 hours
      const editTimeLimit = 24 * 60 * 60 * 1000; // 24 hours
      const timeSinceCreation = Date.now() - this.createdAt.getTime();
      return timeSinceCreation < editTimeLimit;
    }

    // Admin users can edit
    if (userRole === 'admin' || userRole === 'super_admin') return true;

    // Moderators can edit
    if (userRole === 'moderator') return true;

    return false;
  }

  /**
   * Can User Delete Comment
   */
  canUserDelete(userId: string, userRole?: string): boolean {
    // Comment author can delete
    if (this.authorId === userId) return true;

    // Admin users can delete
    if (userRole === 'admin' || userRole === 'super_admin') return true;

    // Moderators can delete
    if (userRole === 'moderator') return true;

    return false;
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  /**
   * Extract Mentions from Content
   * 
   * Educational: Mention extraction should handle
   * various mention formats and update notification lists.
   */
  private extractMentions(): void {
    const mentionRegex = /@(\w+)/g;
    const matches = [...this.content.matchAll(mentionRegex)];
    
    if (matches.length > 0) {
      this.mentions = {
        users: matches.map((match, index) => ({
          id: '', // Would be resolved by service layer
          username: match[1],
          displayName: match[1],
          position: match.index || 0,
        })),
      };
    } else {
      this.mentions = { users: [] };
    }
  }
}