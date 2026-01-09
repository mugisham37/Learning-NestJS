import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export class UpdateTodoDto {
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsBoolean({ message: 'is_completed must be a boolean value' })
  is_completed?: boolean;
}
