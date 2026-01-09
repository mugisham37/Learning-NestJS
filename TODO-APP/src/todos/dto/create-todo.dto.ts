import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateTodoDto {
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}
