import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

/**
 * CreateTodoDto (Data Transfer Object)
 * 
 * This class defines the shape and validation rules for data coming in
 * when creating a new todo via POST /todos
 * 
 * Key Concepts:
 * - DTO = Data Transfer Object - a design pattern for transferring data between layers
 * - Why use DTOs?
 *   1. Type safety: TypeScript knows what properties to expect
 *   2. Validation: class-validator decorators ensure data quality
 *   3. Documentation: The DTO serves as a contract for API consumers
 *   4. Security: Only properties defined here can be set (protects against mass assignment)
 * 
 * The class-validator decorators work with NestJS's ValidationPipe to
 * automatically validate incoming requests. If validation fails, NestJS
 * returns a 400 Bad Request with detailed error messages.
 */
export class CreateTodoDto {
  /**
   * Title field - required, must be a string, max 255 characters
   * 
   * Decorators:
   * - @IsNotEmpty() - ensures the value is not empty, null, or undefined
   * - @IsString() - ensures the value is a string type
   * - @MaxLength(255) - ensures the string doesn't exceed 255 characters
   * 
   * These match our database constraints, preventing bad data from even
   * reaching the database layer.
   */
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title: string;

  /**
   * Description field - optional, must be a string if provided
   * 
   * Decorators:
   * - @IsOptional() - allows this field to be undefined or null
   * - @IsString() - if provided, it must be a string
   * 
   * Note: The validation decorators after @IsOptional() only run if
   * the field is actually provided in the request.
   */
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}
