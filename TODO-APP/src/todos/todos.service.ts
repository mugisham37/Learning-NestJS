import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

/**
 * TodosService
 * 
 * This is the business logic layer. It contains all the operations we can
 * perform on todos. The service talks to the database through TypeORM's Repository.
 * 
 * Key Concepts:
 * 
 * 1. Why separate Service from Controller?
 *    - Single Responsibility Principle: Controllers handle HTTP, Services handle business logic
 *    - Reusability: Other parts of your app can use the service without going through HTTP
 *    - Testability: You can test business logic without mocking HTTP requests
 *    - Maintainability: Changes to business logic don't affect the API interface
 * 
 * 2. @Injectable() decorator:
 *    - Marks this class as a "provider" that can be managed by NestJS's dependency injection
 *    - NestJS will create a single instance (singleton) and inject it where needed
 * 
 * 3. Repository Pattern:
 *    - TypeORM gives us a Repository<Todo> that provides methods to interact with the database
 *    - We don't write SQL directly; we use methods like find(), save(), update(), delete()
 *    - TypeORM translates these method calls into SQL queries
 */
@Injectable()
export class TodosService {
  /**
   * Constructor-based Dependency Injection
   * 
   * @InjectRepository(Todo) tells NestJS: "Inject the TypeORM repository for the Todo entity"
   * 
   * The 'private' keyword does two things:
   * 1. Declares the property this.todoRepository
   * 2. Automatically assigns the injected value to it
   * 
   * Why not use 'new Repository()'?
   * - NestJS needs to manage the lifecycle and configuration
   * - The repository needs database connection info that NestJS manages
   * - This pattern (Dependency Injection) makes testing easier - you can inject a mock repository
   * 
   * How does NestJS know what to inject?
   * - The TodosModule declares TypeOrmModule.forFeature([Todo])
   * - This registers the Todo repository with NestJS's DI container
   * - When NestJS sees @InjectRepository(Todo), it looks it up in the container
   */
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) {}

  /**
   * Create a new todo
   * 
   * Process:
   * 1. Receive validated CreateTodoDto from controller
   * 2. Create a Todo entity instance with the data
   * 3. Save it to the database
   * 4. Return the saved todo (includes generated id, timestamps)
   * 
   * TypeORM SQL equivalent:
   * INSERT INTO todos (id, title, description, is_completed, created_at, updated_at)
   * VALUES (uuid_generate_v4(), $1, $2, false, NOW(), NOW())
   * RETURNING *;
   * 
   * Why async/await?
   * - Database operations are I/O operations that take time
   * - 'async' marks the function as asynchronous - it returns a Promise
   * - 'await' pauses execution until the database operation completes
   * - This keeps our app responsive - other requests can be handled while waiting
   */
  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    // Create an entity instance from the DTO
    // this.todoRepository.create() doesn't save to DB yet - it just creates an object
    const todo = this.todoRepository.create(createTodoDto);
    
    // Save to database and return the result
    // The returned object includes the generated ID and timestamps
    return await this.todoRepository.save(todo);
  }

  /**
   * Find all todos, optionally filtered by completion status
   * 
   * @param completed - Optional filter: true (only completed), false (only incomplete), undefined (all)
   * 
   * TypeORM SQL equivalent:
   * - If completed undefined: SELECT * FROM todos;
   * - If completed true: SELECT * FROM todos WHERE is_completed = true;
   * - If completed false: SELECT * FROM todos WHERE is_completed = false;
   * 
   * The where clause is conditionally added only if completed is defined
   */
  async findAll(completed?: boolean): Promise<Todo[]> {
    // Build the query conditions
    const whereCondition = completed !== undefined ? { is_completed: completed } : {};
    
    // Find all todos matching the condition
    return await this.todoRepository.find({
      where: whereCondition,
      order: { created_at: 'DESC' }, // Most recent first
    });
  }

  /**
   * Find a single todo by ID
   * 
   * @param id - The UUID of the todo to find
   * @returns The found todo
   * @throws NotFoundException if todo doesn't exist
   * 
   * TypeORM SQL equivalent:
   * SELECT * FROM todos WHERE id = $1 LIMIT 1;
   * 
   * Why throw NotFoundException?
   * - NestJS will automatically convert this to a 404 HTTP response
   * - The exception includes a message that will be sent to the client
   * - This is better than returning null/undefined - it's explicit about the error
   */
  async findOne(id: string): Promise<Todo> {
    const todo = await this.todoRepository.findOne({ where: { id } });
    
    if (!todo) {
      // NotFoundException is a built-in NestJS exception
      // It automatically returns HTTP 404 with this message
      throw new NotFoundException(`Todo with ID "${id}" not found`);
    }
    
    return todo;
  }

  /**
   * Update a todo by ID
   * 
   * @param id - The UUID of the todo to update
   * @param updateTodoDto - The fields to update (partial update)
   * @returns The updated todo
   * @throws NotFoundException if todo doesn't exist
   * 
   * Process:
   * 1. Find the todo (throws 404 if not found)
   * 2. Merge the update data into the existing todo
   * 3. Save the changes
   * 4. Return the updated todo
   * 
   * TypeORM SQL equivalent:
   * UPDATE todos 
   * SET title = $1, description = $2, is_completed = $3, updated_at = NOW()
   * WHERE id = $4
   * RETURNING *;
   * 
   * Note: We use findOne() first to ensure the todo exists
   * This is better UX than silently failing if the ID is wrong
   */
  async update(id: string, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    // First, find the todo - this will throw NotFoundException if it doesn't exist
    const todo = await this.findOne(id);
    
    // Merge the updates into the existing todo
    // Object.assign() or spread operator {...todo, ...updateTodoDto} would also work
    // But TypeORM's merge() is the recommended approach
    const updatedTodo = this.todoRepository.merge(todo, updateTodoDto);
    
    // Save and return
    return await this.todoRepository.save(updatedTodo);
  }

  /**
   * Delete a todo by ID
   * 
   * @param id - The UUID of the todo to delete
   * @throws NotFoundException if todo doesn't exist
   * 
   * Process:
   * 1. Find the todo (throws 404 if not found)
   * 2. Delete it from the database
   * 
   * TypeORM SQL equivalent:
   * DELETE FROM todos WHERE id = $1;
   * 
   * Why return Promise<void>?
   * - DELETE operations don't need to return data
   * - The controller will return 204 No Content
   * - If there's an error, an exception will be thrown
   * 
   * Alternative approach:
   * We could use todoRepository.delete(id) which doesn't check if the record exists first.
   * But finding first gives better error messages to the user.
   */
  async remove(id: string): Promise<void> {
    // First, find the todo - this will throw NotFoundException if it doesn't exist
    const todo = await this.findOne(id);
    
    // Delete from database
    // remove() works on entity instances, delete() works on IDs
    await this.todoRepository.remove(todo);
  }
}
