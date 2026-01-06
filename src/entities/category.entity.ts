/**
 * Category Entity - Hierarchical Organization System
 * 
 * This entity demonstrates:
 * - Hierarchical category structures with self-referencing relationships
 * - Many-to-many relationships with tasks
 * - Color coding and visual organization
 * - Sorting and ordering capabilities
 * - Project-scoped categories
 * - Category statistics and usage tracking
 * 
 * Educational Notes:
 * - Categories provide organizational structure for tasks
 * - Self-referencing relationships enable category hierarchies
 * - Many-to-many relationships allow tasks to belong to multiple categories
 * - Sorting orders enable custom category arrangement
 * - Color coding improves visual organization and user experience
 */

import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import {
  IsString,
  Length,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsHexColor,
  IsUUID,
} from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { Task } from './task.entity';

/**
 * Category Entity
 * 
 * Educational: This entity demonstrates hierarchical organization
 * with self-referencing relationships and many-to-many task associations.
 */
@Entity('categories')
@Index(['name'])
@Index(['projectId'])
@Index(['parentId'])
@Index(['sortOrder'])
@Index(['isActive'])
@Index(['projectId', 'parentId'])
@Index(['projectId', 'isActive'])
export class Category extends BaseEntity {
  // ==========================================
  // Basic Information
  // ==========================================

  /**
   * Category Name
   * 
   * Educational: Category names should be descriptive
   * and help users quickly understand the categorization.
   */
  @Column({ length: 100 })
  @IsString()
  @Length(1, 100, { message: 'Category name must be between 1 and 100 characters' })
  @ApiProperty({
    description: 'Category name',
    example: 'Frontend Development',
    maxLength: 100,
  })
  name: string;

  /**
   * Category Description
   * 
   * Educational: Descriptions provide additional context
   * about when and how to use the category.
   */
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Tasks related to frontend user interface development',
  })
  description?: string;

  /**
   * Category Color
   * 
   * Educational: Colors provide visual distinction
   * and help with quick identification in lists and boards.
   */
  @Column({ length: 7, nullable: true })
  @IsOptional()
  @IsHexColor({ message: 'Color must be a valid hex color code' })
  @ApiPropertyOptional({
    description: 'Category color (hex code)',
    example: '#3498db',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  color?: string;

  /**
   * Category Icon
   * 
   * Educational: Icons provide visual identification
   * and can be emoji, font icons, or icon names.
   */
  @Column({ length: 50, nullable: true })
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Category icon (emoji or icon name)',
    example: '💻',
  })
  icon?: string;

  // ==========================================
  // Organization and Sorting
  // ==========================================

  /**
   * Sort Order
   * 
   * Educational: Sort order allows custom arrangement
   * of categories in lists and navigation menus.
   */
  @Column({ name: 'sort_order', default: 0 })
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'Sort order for category display',
    example: 10,
    minimum: 0,
  })
  sortOrder: number;

  /**
   * Is Active
   * 
   * Educational: Active flag allows categories to be
   * disabled without deleting them and their associations.
   */
  @Column({ name: 'is_active', default: true })
  @IsBoolean()
  @ApiProperty({
    description: 'Whether the category is active',
    example: true,
  })
  isActive: boolean;

  /**
   * Is Default
   * 
   * Educational: Default categories are automatically
   * applied to new tasks or used as fallbacks.
   */
  @Column({ name: 'is_default', default: false })
  @IsBoolean()
  @ApiProperty({
    description: 'Whether this is a default category',
    example: false,
  })
  isDefault: boolean;

  // ==========================================
  // Relationships
  // ==========================================

  /**
   * Project ID
   * 
   * Educational: Foreign key to the Project entity.
   * Categories are scoped to specific projects.
   */
  @Column({ name: 'project_id' })
  @IsUUID()
  @ApiProperty({
    description: 'ID of the project this category belongs to',
    format: 'uuid',
  })
  projectId: string;

  /**
   * Project
   * 
   * Educational: ManyToOne relationship to Project entity.
   * Multiple categories can belong to one project.
   */
  @ManyToOne(() => Project, project => project.categories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  @ApiProperty({
    description: 'Project this category belongs to',
    type: () => Project,
  })
  project: Project;

  /**
   * Parent Category ID
   * 
   * Educational: Self-referencing foreign key enables
   * hierarchical category structures.
   */
  @Column({ name: 'parent_id', nullable: true })
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    description: 'ID of the parent category',
    format: 'uuid',
  })
  parentId?: string;

  /**
   * Parent Category
   * 
   * Educational: Self-referencing ManyToOne relationship
   * creates a tree structure for category hierarchies.
   */
  @ManyToOne(() => Category, category => category.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  @ApiPropertyOptional({
    description: 'Parent category',
    type: () => Category,
  })
  parent?: Category;

  /**
   * Child Categories
   * 
   * Educational: OneToMany relationship provides access
   * to all subcategories in the hierarchy.
   */
  @OneToMany(() => Category, category => category.parent)
  @ApiPropertyOptional({
    description: 'Child categories',
    type: () => [Category],
  })
  children?: Category[];

  /**
   * Tasks
   * 
   * Educational: ManyToMany relationship with Task entity.
   * Categories can contain multiple tasks, and tasks can belong to multiple categories.
   */
  @ManyToMany(() => Task, task => task.categories)
  @ApiPropertyOptional({
    description: 'Tasks in this category',
    type: () => [Task],
  })
  tasks?: Task[];

  // ==========================================
  // Virtual Properties
  // ==========================================

  /**
   * Full Path
   * 
   * Educational: Full path shows the complete hierarchy
   * from root to current category for navigation.
   */
  @Expose()
  @ApiProperty({
    description: 'Full category path from root',
    example: 'Development > Frontend > React',
  })
  get fullPath(): string {
    const buildPath = (category: Category, path: string[] = []): string[] => {
      path.unshift(category.name);
      if (category.parent) {
        return buildPath(category.parent, path);
      }
      return path;
    };

    return buildPath(this).join(' > ');
  }

  /**
   * Depth Level
   * 
   * Educational: Depth level indicates how deep
   * the category is in the hierarchy.
   */
  @Expose()
  @ApiProperty({
    description: 'Depth level in category hierarchy',
    example: 2,
  })
  get depthLevel(): number {
    let depth = 0;
    let current = this.parent;
    
    while (current) {
      depth++;
      current = current.parent;
    }
    
    return depth;
  }

  /**
   * Has Children
   * 
   * Educational: Convenience property for checking
   * if the category has subcategories.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the category has child categories',
    example: true,
  })
  get hasChildren(): boolean {
    return (this.children?.length || 0) > 0;
  }

  /**
   * Child Count
   */
  @Expose()
  @ApiProperty({
    description: 'Number of child categories',
    example: 3,
  })
  get childCount(): number {
    return this.children?.length || 0;
  }

  /**
   * Task Count
   * 
   * Educational: Task count helps users understand
   * category usage and importance.
   */
  @Expose()
  @ApiProperty({
    description: 'Number of tasks in this category',
    example: 15,
  })
  get taskCount(): number {
    return this.tasks?.length || 0;
  }

  /**
   * Is Root Category
   * 
   * Educational: Root categories are top-level
   * categories without parent categories.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether this is a root category',
    example: false,
  })
  get isRoot(): boolean {
    return !this.parentId;
  }

  /**
   * Is Leaf Category
   * 
   * Educational: Leaf categories are bottom-level
   * categories without child categories.
   */
  @Expose()
  @ApiProperty({
    description: 'Whether this is a leaf category',
    example: true,
  })
  get isLeaf(): boolean {
    return !this.hasChildren;
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

    // Set default color if not provided
    if (!this.color) {
      this.color = this.generateRandomColor();
    }

    // Set sort order to end of list if not provided
    if (this.sortOrder === undefined || this.sortOrder === 0) {
      // This would typically be calculated based on existing categories
      // For now, we'll use a timestamp-based approach
      this.sortOrder = Date.now() % 1000000;
    }
  }

  /**
   * Before Update Hook
   */
  @BeforeUpdate()
  async beforeUpdate(): Promise<void> {
    super.beforeUpdate();

    // Prevent circular references in parent-child relationships
    if (this.parentId === this.id) {
      throw new Error('Category cannot be its own parent');
    }

    // Additional validation could check for deeper circular references
    // This would typically be done in the service layer
  }

  // ==========================================
  // Business Logic Methods
  // ==========================================

  /**
   * Move to Parent
   * 
   * Educational: Moving categories should validate
   * hierarchy rules and prevent circular references.
   */
  moveToParent(newParent: Category | null): void {
    // Validate that new parent is not a descendant
    if (newParent && this.isAncestorOf(newParent)) {
      throw new Error('Cannot move category to its own descendant');
    }

    this.parent = newParent;
    this.parentId = newParent?.id || null;
  }

  /**
   * Check if this category is an ancestor of another
   * 
   * Educational: Hierarchy validation prevents
   * circular references and maintains tree integrity.
   */
  isAncestorOf(category: Category): boolean {
    let current = category.parent;
    
    while (current) {
      if (current.id === this.id) {
        return true;
      }
      current = current.parent;
    }
    
    return false;
  }

  /**
   * Check if this category is a descendant of another
   */
  isDescendantOf(category: Category): boolean {
    return category.isAncestorOf(this);
  }

  /**
   * Get All Ancestors
   * 
   * Educational: Ancestor collection is useful for
   * breadcrumb navigation and permission inheritance.
   */
  getAllAncestors(): Category[] {
    const ancestors: Category[] = [];
    let current = this.parent;
    
    while (current) {
      ancestors.unshift(current);
      current = current.parent;
    }
    
    return ancestors;
  }

  /**
   * Get All Descendants
   * 
   * Educational: Descendant collection is useful for
   * bulk operations and permission propagation.
   */
  getAllDescendants(): Category[] {
    const descendants: Category[] = [];
    
    const collectDescendants = (category: Category) => {
      if (category.children) {
        for (const child of category.children) {
          descendants.push(child);
          collectDescendants(child);
        }
      }
    };
    
    collectDescendants(this);
    return descendants;
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
   * Toggle Active Status
   * 
   * Educational: Status changes should consider
   * impact on child categories and associated tasks.
   */
  toggleActive(): void {
    this.isActive = !this.isActive;
    
    // Optionally cascade to children
    if (!this.isActive && this.children) {
      this.children.forEach(child => {
        child.isActive = false;
      });
    }
  }

  /**
   * Set as Default
   * 
   * Educational: Default category management should
   * ensure only one default per project/context.
   */
  setAsDefault(): void {
    this.isDefault = true;
    // Note: Service layer should handle unsetting other defaults
  }

  /**
   * Can Be Deleted
   * 
   * Educational: Deletion validation should check
   * for dependencies and business rules.
   */
  canBeDeleted(): boolean {
    // Cannot delete if it has tasks
    if (this.taskCount > 0) return false;
    
    // Cannot delete if it has children
    if (this.hasChildren) return false;
    
    // Cannot delete if it's the default category
    if (this.isDefault) return false;
    
    return true;
  }

  /**
   * Get Category Statistics
   * 
   * Educational: Statistics provide insights into
   * category usage and help with organization decisions.
   */
  getStatistics(): {
    taskCount: number;
    childCount: number;
    depthLevel: number;
    isActive: boolean;
    isDefault: boolean;
    lastUsed?: Date;
  } {
    return {
      taskCount: this.taskCount,
      childCount: this.childCount,
      depthLevel: this.depthLevel,
      isActive: this.isActive,
      isDefault: this.isDefault,
      // lastUsed would be calculated from task associations
    };
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  /**
   * Generate random category color
   * 
   * Educational: Default colors should be visually
   * distinct and provide good contrast.
   */
  private generateRandomColor(): string {
    const colors = [
      '#3498db', // Blue
      '#e74c3c', // Red
      '#2ecc71', // Green
      '#f39c12', // Orange
      '#9b59b6', // Purple
      '#1abc9c', // Turquoise
      '#34495e', // Dark Gray
      '#e67e22', // Carrot
      '#95a5a6', // Silver
      '#f1c40f', // Yellow
      '#8e44ad', // Violet
      '#16a085', // Green Sea
      '#2c3e50', // Midnight Blue
      '#d35400', // Pumpkin
      '#7f8c8d', // Asbestos
      '#27ae60', // Nephritis
      '#c0392b', // Alizarin
      '#8e44ad', // Amethyst
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }
}