import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

/**
 * UpdateTodoDto (Data Transfer Object)
 * 
 * This class defines the shape and validation rules for data coming in
 * when updating an existing todo via PATCH /todos/:id
 * 
 * Key Concepts:
 * - PATCH is for partial updates - you only send the fields you want to change
 * - That's why all fields are @IsOptional() - none are required
 * - But if a field IS provided, it must pass validation
 * 
 * Example: If you only want to mark a todo as completed, you'd send:
 * { "is_completed": true }
 * 
 * You wouldn't need to send title or description again.
 */
export class UpdateTodoDto {
  /**
   * Title field - optional, but if provided must be valid
   * 
   * Note: We don't use @IsNotEmpty() here because the field itself is optional.
   * But if the client sends title: "", it will fail validation because
   * an empty string doesn't pass @IsString() validation in a meaningful way.
   * We could add @IsNotEmpty() with @IsOptional() if we want to be explicit
   * that when provided, it can't be empty.
   */
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title?: string;

  /**
   * Description field - optional, can be updated or left unchanged
   */
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  /**
   * Completion status - optional, allows toggling completed state
   * 
   * @IsBoolean() ensures the value is exactly true or false
   * (not "true" as a string, or 1/0, etc.)
   */
  @IsOptional()
  @IsBoolean({ message: 'is_completed must be a boolean value' })
  is_completed?: boolean;
}
