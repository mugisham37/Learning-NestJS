/**
 * Task Category Entity - Many-to-Many Junction Table
 * 
 * This entity demonstrates:
 * - Pure junction table for many-to-many relationships
 * - Composite primary key with foreign keys
 * - Minimal junction table without additional attributes
 * - Proper indexing for performance
 * - Cascade delete behavior
 * 
 * Educational Notes:
 * - Junction tables connect entities in many-to-many relationships
 * - This is a simple junction table without additional attributes
 * - TypeORM can auto-generate these, but explicit entities provide more control
 * - Composite primary keys ensure uniqueness of relationships
 * - Proper indexing improves query performance
 */

import {
  Entity,
  PrimaryColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { Task } from './task.entity';
import { Category } from './category.entity';

/**
 * Task Category Junction Entity
 * 
 * Educational: This entity represents the many-to-many relationship
 * between tasks and categories. It's a pure junction table without
 * additional attributes beyond the foreign keys.
 */
@Entity('task_categories')
@Index(['taskId', 'categoryId'], { unique: true })
@Index(['taskId'])
@Index(['categoryId'])
export class TaskCategory {
  /**
   * Task ID
   * 
   * Educational: Primary key component and foreign key to Task entity.
   * Part of the composite primary key.
   */
  @PrimaryColumn({ name: 'task_id' })
  @IsUUID()
  @ApiProperty({
    description: 'ID of the task',
    format: 'uuid',
  })
  taskId!: string;

  /**
   * Task
   * 
   * Educational: ManyToOne relationship to Task entity.
   * The task side of the many-to-many relationship.
   */
  @ManyToOne(() => Task, task => task.categories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  @ApiProperty({
    description: 'Task in the relationship',
    type: () => Task,
  })
  task!: Task;

  /**
   * Category ID
   * 
   * Educational: Primary key component and foreign key to Category entity.
   * Part of the composite primary key.
   */
  @PrimaryColumn({ name: 'category_id' })
  @IsUUID()
  @ApiProperty({
    description: 'ID of the category',
    format: 'uuid',
  })
  categoryId!: string;

  /**
   * Category
   * 
   * Educational: ManyToOne relationship to Category entity.
   * The category side of the many-to-many relationship.
   */
  @ManyToOne(() => Category, category => category.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  @ApiProperty({
    description: 'Category in the relationship',
    type: () => Category,
  })
  category!: Category;
}