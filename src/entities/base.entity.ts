/**
 * Base Entity - Common Fields and Functionality
 * 
 * This base entity demonstrates:
 * - Common fields shared across all entities
 * - Automatic timestamp management
 * - UUID primary keys for security and scalability
 * - Soft delete functionality
 * - Version control for optimistic locking
 * - Entity lifecycle hooks
 * 
 * Educational Notes:
 * - Base entities reduce code duplication
 * - UUIDs are more secure than auto-incrementing integers
 * - Timestamps are essential for auditing and debugging
 * - Soft deletes preserve data while hiding it from queries
 * - Version fields prevent concurrent update conflicts
 * - Entity listeners provide hooks for business logic
 */

import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Abstract Base Entity
 * 
 * Educational: Abstract classes cannot be instantiated directly
 * but provide common functionality to derived classes.
 */
export abstract class BaseEntity {
  /**
   * Primary Key - UUID
   * 
   * Educational: UUIDs provide several advantages:
   * - Globally unique across databases and systems
   * - No sequential enumeration (security benefit)
   * - Can be generated client-side
   * - Better for distributed systems
   */
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Unique identifier',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  /**
   * Creation Timestamp
   * 
   * Educational: @CreateDateColumn automatically sets the timestamp
   * when the entity is first saved to the database.
   */
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    comment: 'Timestamp when the record was created',
  })
  @ApiProperty({
    description: 'Timestamp when the record was created',
    type: 'string',
    format: 'date-time',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  /**
   * Last Update Timestamp
   * 
   * Educational: @UpdateDateColumn automatically updates the timestamp
   * whenever the entity is saved (created or updated).
   */
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    comment: 'Timestamp when the record was last updated',
  })
  @ApiProperty({
    description: 'Timestamp when the record was last updated',
    type: 'string',
    format: 'date-time',
    example: '2023-01-01T12:00:00.000Z',
  })
  updatedAt: Date;

  /**
   * Soft Delete Timestamp
   * 
   * Educational: @DeleteDateColumn enables soft deletes.
   * When set, the record is hidden from normal queries but preserved in the database.
   * This is useful for audit trails and data recovery.
   */
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Timestamp when the record was soft deleted',
  })
  @Exclude() // Don't include in API responses
  deletedAt?: Date;

  /**
   * Version Column for Optimistic Locking
   * 
   * Educational: @VersionColumn provides optimistic locking to prevent
   * concurrent update conflicts. The version is automatically incremented
   * on each update, and updates fail if the version doesn't match.
   */
  @VersionColumn({
    comment: 'Version number for optimistic locking',
  })
  @ApiProperty({
    description: 'Version number for optimistic locking',
    type: 'number',
    example: 1,
  })
  version: number;

  /**
   * Virtual Properties
   * 
   * Educational: Virtual properties are computed at runtime
   * and not stored in the database. They're useful for
   * derived values and business logic.
   */

  /**
   * Check if entity is soft deleted
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the record is soft deleted',
    type: 'boolean',
    example: false,
  })
  get isDeleted(): boolean {
    return !!this.deletedAt;
  }

  /**
   * Get age of the record in milliseconds
   */
  @Expose()
  @ApiProperty({
    description: 'Age of the record in milliseconds',
    type: 'number',
    example: 86400000,
  })
  get age(): number {
    return Date.now() - this.createdAt.getTime();
  }

  /**
   * Get time since last update in milliseconds
   */
  @Expose()
  @ApiProperty({
    description: 'Time since last update in milliseconds',
    type: 'number',
    example: 3600000,
  })
  get timeSinceUpdate(): number {
    return Date.now() - this.updatedAt.getTime();
  }

  /**
   * Entity Lifecycle Hooks
   * 
   * Educational: Entity listeners allow you to execute code
   * before or after certain database operations.
   */

  /**
   * Before Insert Hook
   * 
   * Educational: This hook runs before the entity is inserted
   * into the database. Useful for validation, data transformation,
   * or setting default values.
   */
  @BeforeInsert()
  beforeInsert(): void {
    // Ensure timestamps are set (TypeORM usually handles this)
    if (!this.createdAt) {
      this.createdAt = new Date();
    }
    if (!this.updatedAt) {
      this.updatedAt = new Date();
    }
    
    // Initialize version if not set
    if (this.version === undefined) {
      this.version = 1;
    }
  }

  /**
   * Before Update Hook
   * 
   * Educational: This hook runs before the entity is updated
   * in the database. Useful for validation, audit logging,
   * or computed field updates.
   */
  @BeforeUpdate()
  beforeUpdate(): void {
    // Ensure updated timestamp is current
    this.updatedAt = new Date();
  }

  /**
   * Utility Methods
   * 
   * Educational: Utility methods provide common functionality
   * that can be used across all entities.
   */

  /**
   * Convert entity to plain object
   * 
   * Educational: This method creates a plain JavaScript object
   * from the entity, useful for serialization and logging.
   */
  toJSON(): Record<string, any> {
    const obj: Record<string, any> = {};
    
    // Copy all enumerable properties
    for (const key in this) {
      if (this.hasOwnProperty(key)) {
        obj[key] = this[key];
      }
    }
    
    // Add virtual properties
    obj.isDeleted = this.isDeleted;
    obj.age = this.age;
    obj.timeSinceUpdate = this.timeSinceUpdate;
    
    return obj;
  }

  /**
   * Create a copy of the entity
   * 
   * Educational: This method creates a shallow copy of the entity,
   * useful for creating similar entities or backup copies.
   */
  clone(): this {
    const cloned = Object.create(Object.getPrototypeOf(this));
    Object.assign(cloned, this);
    
    // Reset fields that should be unique
    cloned.id = undefined;
    cloned.createdAt = undefined;
    cloned.updatedAt = undefined;
    cloned.deletedAt = undefined;
    cloned.version = undefined;
    
    return cloned;
  }

  /**
   * Check if entity has been modified since creation
   * 
   * Educational: This method compares timestamps to determine
   * if the entity has been modified after creation.
   */
  isModified(): boolean {
    if (!this.createdAt || !this.updatedAt) {
      return false;
    }
    
    // Allow for small timestamp differences (1 second)
    const timeDiff = Math.abs(this.updatedAt.getTime() - this.createdAt.getTime());
    return timeDiff > 1000;
  }

  /**
   * Soft delete the entity
   * 
   * Educational: This method performs a soft delete by setting
   * the deletedAt timestamp. The entity will be hidden from
   * normal queries but preserved in the database.
   */
  softDelete(): void {
    this.deletedAt = new Date();
  }

  /**
   * Restore a soft deleted entity
   * 
   * Educational: This method restores a soft deleted entity
   * by clearing the deletedAt timestamp.
   */
  restore(): void {
    this.deletedAt = undefined;
  }
}

/**
 * Auditable Entity Base
 * 
 * Educational: This extended base entity adds audit fields
 * to track who created and modified records.
 */
export abstract class AuditableEntity extends BaseEntity {
  /**
   * User who created the record
   * 
   * Educational: Audit fields help track data changes
   * for compliance and debugging purposes.
   */
  @ApiProperty({
    description: 'ID of the user who created the record',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  createdBy?: string;

  /**
   * User who last updated the record
   */
  @ApiProperty({
    description: 'ID of the user who last updated the record',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  updatedBy?: string;

  /**
   * IP address of the client who created the record
   */
  @ApiProperty({
    description: 'IP address of the client who created the record',
    example: '192.168.1.1',
    required: false,
  })
  createdFromIp?: string;

  /**
   * IP address of the client who last updated the record
   */
  @ApiProperty({
    description: 'IP address of the client who last updated the record',
    example: '192.168.1.1',
    required: false,
  })
  updatedFromIp?: string;

  /**
   * Set audit information for creation
   */
  setCreatedBy(userId: string, ipAddress?: string): void {
    this.createdBy = userId;
    if (ipAddress) {
      this.createdFromIp = ipAddress;
    }
  }

  /**
   * Set audit information for updates
   */
  setUpdatedBy(userId: string, ipAddress?: string): void {
    this.updatedBy = userId;
    if (ipAddress) {
      this.updatedFromIp = ipAddress;
    }
  }
}