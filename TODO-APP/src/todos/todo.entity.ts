import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';

/**
 * Todo Entity
 * 
 * This class represents the 'todos' table in our PostgreSQL database.
 * TypeORM will automatically create this table when the app starts (with synchronize: true).
 * 
 * Key Concepts:
 * - @Entity() decorator tells TypeORM this class maps to a database table
 * - Each property with @Column() becomes a column in the table
 * - Decorators add metadata that TypeORM uses to generate SQL
 */
@Entity('todos')
export class Todo {
  /**
   * Primary key column - unique identifier for each todo
   * 
   * @PrimaryGeneratedColumn('uuid') creates a UUID (universally unique identifier)
   * Why UUID instead of auto-increment numbers?
   * - UUIDs are globally unique (safe for distributed systems)
   * - Harder to guess/enumerate (better for security)
   * - Can be generated client-side if needed
   * 
   * Tradeoff: UUIDs are larger (128 bits vs 32/64 bits) and slightly slower to index
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Title column - the main text of the todo
   * 
   * VARCHAR(255) means variable-length string up to 255 characters
   * nullable: false means this field is required (NOT NULL in SQL)
   */
  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  /**
   * Description column - optional additional details
   * 
   * TEXT type can store much larger strings than VARCHAR
   * nullable: true (default) means this field is optional
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Completion status - whether the todo is done
   * 
   * BOOLEAN type stores true/false
   * default: false means new todos start as not completed
   * The default is set at the database level
   */
  @Column({ type: 'boolean', default: false })
  is_completed: boolean;

  /**
   * Timestamp when the record was created
   * 
   * @CreateDateColumn automatically sets this to the current timestamp
   * when a new record is inserted. You don't need to set this manually.
   */
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  /**
   * Timestamp when the record was last updated
   * 
   * @UpdateDateColumn automatically updates this to the current timestamp
   * whenever the record is modified. You don't need to set this manually.
   */
  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
