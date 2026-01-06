/**
 * File Entity - Comprehensive File Management System
 * 
 * This entity demonstrates:
 * - File metadata and storage information
 * - Multiple storage provider support
 * - File processing and transformation tracking
 * - Security features (virus scanning, access control)
 * - File versioning and history
 * - Usage analytics and statistics
 * - Integration with external storage services
 * 
 * Educational Notes:
 * - Files are managed separately from their usage contexts
 * - Storage abstraction allows multiple providers
 * - Metadata enables rich file management features
 * - Security scanning protects against malicious uploads
 * - Versioning supports file evolution and rollback
 * - Analytics help with storage optimization
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
  IsNumber,
  Min,
  IsBoolean,
  IsObject,
  ValidateNested,
  IsUUID,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseEntity } from './base.entity';
import { FileType, FileStorageProvider, EnumMetadata } from './enums';
import { User } from './user.entity';
import { TaskAttachment } from './task-attachment.entity';

/**
 * File Processing Status Enum
 * 
 * Educational: Processing status tracks the lifecycle
 * of file processing operations like virus scanning.
 */
export enum FileProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

/**
 * File Security Scan Result Interface
 * 
 * Educational: Security scan results provide detailed
 * information about file safety and threats.
 */
export interface FileSecurityScan {
  scannedAt: Date;
  scanProvider: string;
  status: 'clean' | 'infected' | 'suspicious' | 'error';
  threats?: {
    name: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  scanDuration: number; // in milliseconds
  scanVersion: string;
}

/**
 * File Processing Result Interface
 * 
 * Educational: Processing results track transformations
 * and optimizations applied to files.
 */
export interface FileProcessingResult {
  processedAt: Date;
  processor: string;
  operation: string;
  status: FileProcessingStatus;
  inputSize: number;
  outputSize?: number;
  duration: number; // in milliseconds
  parameters?: Record<string, any>;
  error?: string;
}

/**
 * File Metadata Interface
 * 
 * Educational: Metadata provides extensible storage
 * for file-specific information and properties.
 */
export interface FileMetadata {
  // Image metadata
  image?: {
    width: number;
    height: number;
    format: string;
    colorSpace: string;
    hasAlpha: boolean;
    dpi?: number;
  };
  
  // Document metadata
  document?: {
    pageCount?: number;
    author?: string;
    title?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
  
  // Video metadata
  video?: {
    duration: number; // in seconds
    width: number;
    height: number;
    frameRate: number;
    bitrate: number;
    codec: string;
    hasAudio: boolean;
  };
  
  // Audio metadata
  audio?: {
    duration: number; // in seconds
    bitrate: number;
    sampleRate: number;
    channels: number;
    codec: string;
    title?: string;
    artist?: string;
    album?: string;
  };
  
  // Custom metadata
  custom?: Record<string, any>;
}

/**
 * File Statistics Interface
 * 
 * Educational: Statistics track file usage and
 * help with storage optimization decisions.
 */
export interface FileStatistics {
  downloadCount: number;
  viewCount: number;
  attachmentCount: number;
  lastAccessed?: Date;
  lastDownloaded?: Date;
  uniqueUsers: string[]; // User IDs who accessed the file
  popularityScore: number; // Calculated score based on usage
}

/**
 * File Entity
 * 
 * Educational: This entity demonstrates comprehensive file management
 * with security, processing, and analytics capabilities.
 */
@Entity('files')
@Index(['originalName'])
@Index(['mimeType'])
@Index(['fileType'])
@Index(['storageProvider'])
@Index(['uploadedBy'])
@Index(['sizeBytes'])
@Index(['createdAt'])
@Index(['checksum'])
@Index(['isProcessed'])
@Index(['isSecure'])
export class File extends BaseEntity {
  // ==========================================
  // File Identity and Names
  // ==========================================

  /**
   * Original File Name
   * 
   * Educational: Original name preserves the user's
   * intended filename for display and download purposes.
   */
  @Column({ name: 'original_name', length: 255 })
  @IsString()
  @Length(1, 255, { message: 'Original name must be between 1 and 255 characters' })
  @ApiProperty({
    description: 'Original filename as uploaded by user',
    example: 'project-requirements.pdf',
    maxLength: 255,
  })
  originalName!: string;

  /**
   * Stored File Name
   * 
   * Educational: Stored name is the actual filename
   * in the storage system, often UUID-based for security.
   */
  @Column({ name: 'stored_name', length: 255 })
  @IsString()
  @Length(1, 255)
  @ApiProperty({
    description: 'Filename as stored in the storage system',
    example: '123e4567-e89b-12d3-a456-426614174000.pdf',
    maxLength: 255,
  })
  storedName!: string;

  /**
   * File Extension
   * 
   * Educational: Extension helps with file type detection
   * and appropriate handling by client applications.
   */
  @Column({ length: 10, nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  @ApiPropertyOptional({
    description: 'File extension',
    example: 'pdf',
    maxLength: 10,
  })
  extension?: string;

  // ==========================================
  // File Type and Content
  // ==========================================

  /**
   * MIME Type
   * 
   * Educational: MIME type provides precise content type
   * information for proper handling and security.
   */
  @Column({ name: 'mime_type', length: 100 })
  @IsString()
  @Length(1, 100)
  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
    maxLength: 100,
  })
  mimeType!: string;

  /**
   * File Type Category
   * 
   * Educational: Type category provides high-level
   * classification for UI and processing decisions.
   */
  @Column({
    name: 'file_type',
    type: 'enum',
    enum: FileType,
    default: FileType.OTHER,
  })
  @IsEnum(FileType, { message: 'Please provide a valid file type' })
  @ApiProperty(EnumMetadata.FileType)
  fileType!: FileType;

  /**
   * File Size in Bytes
   * 
   * Educational: Size tracking helps with storage
   * management and upload validation.
   */
  @Column({ name: 'size_bytes', type: 'bigint' })
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'File size in bytes',
    example: 1048576,
    minimum: 0,
  })
  sizeBytes!: number;

  /**
   * File Checksum
   * 
   * Educational: Checksums ensure file integrity
   * and enable deduplication.
   */
  @Column({ length: 64 })
  @IsString()
  @Length(64, 64)
  @ApiProperty({
    description: 'SHA-256 checksum of the file',
    example: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    minLength: 64,
    maxLength: 64,
  })
  checksum!: string;

  // ==========================================
  // Storage Information
  // ==========================================

  /**
   * Storage Provider
   * 
   * Educational: Provider information enables
   * multi-cloud storage strategies.
   */
  @Column({
    name: 'storage_provider',
    type: 'enum',
    enum: FileStorageProvider,
    default: FileStorageProvider.LOCAL,
  })
  @IsEnum(FileStorageProvider, { message: 'Please provide a valid storage provider' })
  @ApiProperty(EnumMetadata.FileStorageProvider)
  storageProvider!: FileStorageProvider;

  /**
   * Storage Path
   * 
   * Educational: Storage path provides the location
   * within the storage provider's system.
   */
  @Column({ name: 'storage_path', length: 500 })
  @IsString()
  @Length(1, 500)
  @ApiProperty({
    description: 'Path to the file in the storage system',
    example: '/uploads/2023/12/123e4567-e89b-12d3-a456-426614174000.pdf',
    maxLength: 500,
  })
  storagePath!: string;

  /**
   * Storage Bucket
   * 
   * Educational: Bucket information is used for
   * cloud storage providers like S3.
   */
  @Column({ name: 'storage_bucket', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @ApiPropertyOptional({
    description: 'Storage bucket name (for cloud providers)',
    example: 'my-app-files',
    maxLength: 100,
  })
  storageBucket?: string;

  /**
   * Storage Region
   * 
   * Educational: Region information helps with
   * performance optimization and compliance.
   */
  @Column({ name: 'storage_region', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  @ApiPropertyOptional({
    description: 'Storage region (for cloud providers)',
    example: 'us-east-1',
    maxLength: 50,
  })
  storageRegion?: string;

  /**
   * Public URL
   * 
   * Educational: Public URLs enable direct access
   * for publicly accessible files.
   */
  @Column({ name: 'public_url', length: 1000, nullable: true })
  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    description: 'Public URL for direct file access',
    format: 'uri',
    maxLength: 1000,
  })
  publicUrl?: string;

  // ==========================================
  // Processing and Security
  // ==========================================

  /**
   * Is Processed
   * 
   * Educational: Processing flag indicates whether
   * file processing operations have completed.
   */
  @Column({ name: 'is_processed', default: false })
  @IsBoolean()
  @ApiProperty({
    description: 'Whether the file has been processed',
    example: true,
  })
  isProcessed!: boolean;

  /**
   * Is Secure
   * 
   * Educational: Security flag indicates whether
   * the file has passed security scans.
   */
  @Column({ name: 'is_secure', default: false })
  @IsBoolean()
  @ApiProperty({
    description: 'Whether the file has passed security scans',
    example: true,
  })
  isSecure!: boolean;

  /**
   * Processing Status
   * 
   * Educational: Processing status tracks the current
   * state of file processing operations.
   */
  @Column({
    name: 'processing_status',
    type: 'enum',
    enum: FileProcessingStatus,
    default: FileProcessingStatus.PENDING,
  })
  @IsEnum(FileProcessingStatus)
  @ApiProperty({
    enum: FileProcessingStatus,
    description: 'Current processing status',
    example: FileProcessingStatus.COMPLETED,
  })
  processingStatus!: FileProcessingStatus;

  // ==========================================
  // Ownership and Access
  // ==========================================

  /**
   * Uploaded By
   * 
   * Educational: Uploader tracking helps with
   * permissions and audit trails.
   */
  @Column({ name: 'uploaded_by' })
  @IsUUID()
  @ApiProperty({
    description: 'ID of the user who uploaded the file',
    format: 'uuid',
  })
  uploadedBy!: string;

  /**
   * Uploader
   * 
   * Educational: ManyToOne relationship to User entity
   * for the person who uploaded the file.
   */
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'uploaded_by' })
  @ApiProperty({
    description: 'User who uploaded the file',
    type: () => User,
  })
  uploader!: User;

  /**
   * Is Public
   * 
   * Educational: Public flag controls whether the file
   * can be accessed without authentication.
   */
  @Column({ name: 'is_public', default: false })
  @IsBoolean()
  @ApiProperty({
    description: 'Whether the file is publicly accessible',
    example: false,
  })
  isPublic!: boolean;

  /**
   * Expires At
   * 
   * Educational: Expiration enables temporary file
   * sharing and automatic cleanup.
   */
  @Column({ name: 'expires_at', nullable: true })
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Expiration timestamp for temporary files',
    type: 'string',
    format: 'date-time',
  })
  expiresAt?: Date | null;

  // ==========================================
  // Relationships
  // ==========================================

  /**
   * Task Attachments
   * 
   * Educational: OneToMany relationship to TaskAttachment
   * for tracking where this file is used.
   */
  @OneToMany(() => TaskAttachment, attachment => attachment.file)
  @ApiPropertyOptional({
    description: 'Task attachments using this file',
    type: () => [TaskAttachment],
  })
  taskAttachments?: TaskAttachment[];

  // ==========================================
  // Extended Data (JSON Columns)
  // ==========================================

  /**
   * File Metadata
   * 
   * Educational: JSON column for storing file-specific
   * metadata extracted during processing.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'File metadata and properties',
    type: 'object',
  })
  metadata?: FileMetadata;

  /**
   * Security Scan Results
   * 
   * Educational: JSON column for storing security
   * scan results and threat information.
   */
  @Column({ name: 'security_scan', type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @Exclude() // Don't expose security details in API
  securityScan?: FileSecurityScan;

  /**
   * Processing Results
   * 
   * Educational: JSON column for storing processing
   * operation results and history.
   */
  @Column({ name: 'processing_results', type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'File processing results',
    type: 'object',
  })
  processingResults?: FileProcessingResult[];

  /**
   * File Statistics
   * 
   * Educational: JSON column for tracking usage
   * statistics and analytics.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiPropertyOptional({
    description: 'File usage statistics',
    type: 'object',
  })
  statistics?: FileStatistics;

  // ==========================================
  // Virtual Properties
  // ==========================================

  /**
   * File Size Formatted
   * 
   * Educational: Formatted size provides human-readable
   * file size information for UI display.
   */
  @Expose()
  @ApiProperty({
    description: 'Human-readable file size',
    example: '1.5 MB',
  })
  get fileSizeFormatted(): string {
    const bytes = this.sizeBytes;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    
    return `${size.toFixed(1)} ${sizes[i]}`;
  }

  /**
   * Is Image
   * 
   * Educational: Type checking helps with UI rendering
   * and feature availability decisions.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the file is an image',
    example: false,
  })
  get isImage(): boolean {
    return this.fileType === FileType.IMAGE;
  }

  /**
   * Is Document
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the file is a document',
    example: true,
  })
  get isDocument(): boolean {
    return this.fileType === FileType.DOCUMENT;
  }

  /**
   * Is Video
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the file is a video',
    example: false,
  })
  get isVideo(): boolean {
    return this.fileType === FileType.VIDEO;
  }

  /**
   * Is Audio
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the file is an audio file',
    example: false,
  })
  get isAudio(): boolean {
    return this.fileType === FileType.AUDIO;
  }

  /**
   * Is Expired
   * 
   * Educational: Expiration checking helps with
   * automatic cleanup and access control.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the file has expired',
    example: false,
  })
  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  /**
   * Download Count
   * 
   * Educational: Usage statistics help understand
   * file popularity and importance.
   */
  @Expose()
  @ApiProperty({
    description: 'Number of times the file has been downloaded',
    example: 25,
  })
  get downloadCount(): number {
    return this.statistics?.downloadCount || 0;
  }

  /**
   * View Count
   */
  @Expose()
  @ApiProperty({
    description: 'Number of times the file has been viewed',
    example: 150,
  })
  get viewCount(): number {
    return this.statistics?.viewCount || 0;
  }

  /**
   * Attachment Count
   */
  @Expose()
  @ApiProperty({
    description: 'Number of times the file has been attached to tasks',
    example: 3,
  })
  get attachmentCount(): number {
    return this.statistics?.attachmentCount || 0;
  }

  /**
   * Age in Days
   * 
   * Educational: Age calculation helps with
   * file lifecycle management and cleanup.
   */
  @Expose()
  @ApiProperty({
    description: 'Age of the file in days',
    example: 45,
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

    // Extract file extension from original name
    if (!this.extension && this.originalName) {
      const lastDotIndex = this.originalName.lastIndexOf('.');
      if (lastDotIndex > 0) {
        this.extension = this.originalName.substring(lastDotIndex + 1).toLowerCase();
      }
    }

    // Initialize statistics
    if (!this.statistics) {
      this.statistics = {
        downloadCount: 0,
        viewCount: 0,
        attachmentCount: 0,
        uniqueUsers: [],
        popularityScore: 0,
      };
    }

    // Initialize processing results array
    if (!this.processingResults) {
      this.processingResults = [];
    }
  }

  /**
   * Before Update Hook
   */
  @BeforeUpdate()
  override async beforeUpdate(): Promise<void> {
    super.beforeUpdate();

    // Update popularity score based on usage
    if (this.statistics) {
      this.statistics.popularityScore = this.calculatePopularityScore();
    }
  }

  /**
   * After Load Hook
   */
  @AfterLoad()
  afterLoad(): void {
    // Ensure statistics exist
    if (!this.statistics) {
      this.statistics = {
        downloadCount: 0,
        viewCount: 0,
        attachmentCount: 0,
        uniqueUsers: [],
        popularityScore: 0,
      };
    }

    // Ensure processing results array exists
    if (!this.processingResults) {
      this.processingResults = [];
    }
  }

  // ==========================================
  // Business Logic Methods
  // ==========================================

  /**
   * Record Download
   * 
   * Educational: Download tracking should update statistics
   * and handle unique user counting.
   */
  recordDownload(userId: string): void {
    if (!this.statistics) {
      this.statistics = {
        downloadCount: 0,
        viewCount: 0,
        attachmentCount: 0,
        uniqueUsers: [],
        popularityScore: 0,
      };
    }

    this.statistics.downloadCount++;
    this.statistics.lastDownloaded = new Date();

    // Track unique users
    if (!this.statistics.uniqueUsers.includes(userId)) {
      this.statistics.uniqueUsers.push(userId);
    }

    // Update popularity score
    this.statistics.popularityScore = this.calculatePopularityScore();
  }

  /**
   * Record View
   * 
   * Educational: View tracking should update statistics
   * and handle unique user counting.
   */
  recordView(userId: string): void {
    if (!this.statistics) {
      this.statistics = {
        downloadCount: 0,
        viewCount: 0,
        attachmentCount: 0,
        uniqueUsers: [],
        popularityScore: 0,
      };
    }

    this.statistics.viewCount++;

    // Track unique users
    if (!this.statistics.uniqueUsers.includes(userId)) {
      this.statistics.uniqueUsers.push(userId);
    }

    // Update popularity score
    this.statistics.popularityScore = this.calculatePopularityScore();
  }

  /**
   * Record Attachment
   * 
   * Educational: Attachment tracking helps understand
   * file usage patterns and importance.
   */
  recordAttachment(): void {
    if (!this.statistics) {
      this.statistics = {
        downloadCount: 0,
        viewCount: 0,
        attachmentCount: 0,
        uniqueUsers: [],
        popularityScore: 0,
      };
    }

    this.statistics.attachmentCount++;
    this.statistics.popularityScore = this.calculatePopularityScore();
  }

  /**
   * Add Processing Result
   * 
   * Educational: Processing results provide audit trails
   * for file transformations and operations.
   */
  addProcessingResult(result: FileProcessingResult): void {
    if (!this.processingResults) {
      this.processingResults = [];
    }

    this.processingResults.push(result);

    // Update processing status based on latest result
    if (result.status === FileProcessingStatus.COMPLETED) {
      this.isProcessed = true;
      this.processingStatus = FileProcessingStatus.COMPLETED;
    } else if (result.status === FileProcessingStatus.FAILED) {
      this.processingStatus = FileProcessingStatus.FAILED;
    }
  }

  /**
   * Set Security Scan Result
   * 
   * Educational: Security scan results should update
   * the security status and provide detailed information.
   */
  setSecurityScanResult(result: FileSecurityScan): void {
    this.securityScan = result;
    this.isSecure = result.status === 'clean';
  }

  /**
   * Update Metadata
   * 
   * Educational: Metadata updates should merge with
   * existing metadata to avoid losing information.
   */
  updateMetadata(newMetadata: Partial<FileMetadata>): void {
    this.metadata = {
      ...this.metadata,
      ...newMetadata,
    };
  }

  /**
   * Set Expiration
   * 
   * Educational: Expiration management enables
   * temporary file sharing and automatic cleanup.
   */
  setExpiration(expiresAt: Date): void {
    this.expiresAt = expiresAt;
  }

  /**
   * Clear Expiration
   */
  clearExpiration(): void {
    this.expiresAt = null;
  }

  /**
   * Make Public
   * 
   * Educational: Public access should be carefully
   * controlled and audited for security.
   */
  makePublic(): void {
    this.isPublic = true;
  }

  /**
   * Make Private
   */
  makePrivate(): void {
    this.isPublic = false;
  }

  /**
   * Can User Access
   * 
   * Educational: Access control should consider file
   * permissions, expiration, and user roles.
   */
  canUserAccess(userId: string, userRole?: string): boolean {
    // Check if file is expired
    if (this.isExpired) return false;

    // Public files are accessible to everyone
    if (this.isPublic) return true;

    // Uploader can always access
    if (this.uploadedBy === userId) return true;

    // Admin users can access
    if (userRole === 'admin' || userRole === 'super_admin') return true;

    // Check if user has access through task attachments
    // This would typically be done by the service layer
    
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
    // Uploader can delete (if no attachments exist)
    if (this.uploadedBy === userId && this.attachmentCount === 0) return true;

    // Admin users can delete
    if (userRole === 'admin' || userRole === 'super_admin') return true;

    return false;
  }

  /**
   * Get File URL
   * 
   * Educational: URL generation should consider storage
   * provider and access control requirements.
   */
  getFileUrl(signed: boolean = false): string {
    // Return public URL if available and not requiring signed access
    if (this.publicUrl && !signed) {
      return this.publicUrl;
    }

    // Generate provider-specific URL
    switch (this.storageProvider) {
      case FileStorageProvider.LOCAL:
        return `/files/${this.id}`;
      
      case FileStorageProvider.AWS_S3:
        const bucket = this.storageBucket || 'default';
        const region = this.storageRegion || 'us-east-1';
        return `https://${bucket}.s3.${region}.amazonaws.com/${this.storagePath}`;
      
      default:
        return `/files/${this.id}`;
    }
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  /**
   * Calculate Popularity Score
   * 
   * Educational: Popularity scoring helps identify
   * important files and optimize storage strategies.
   */
  private calculatePopularityScore(): number {
    const stats = this.statistics;
    if (!stats) return 0;

    // Weight different metrics
    const downloadWeight = 3;
    const viewWeight = 1;
    const attachmentWeight = 5;
    const uniqueUserWeight = 2;

    // Calculate age factor (newer files get slight boost)
    const ageInDays = this.ageInDays;
    const ageFactor = Math.max(0.1, 1 - (ageInDays / 365)); // Decay over a year

    const score = (
      (stats.downloadCount * downloadWeight) +
      (stats.viewCount * viewWeight) +
      (stats.attachmentCount * attachmentWeight) +
      (stats.uniqueUsers.length * uniqueUserWeight)
    ) * ageFactor;

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }
}