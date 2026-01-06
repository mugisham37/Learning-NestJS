import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './todo.entity';

/**
 * TodosController
 * 
 * The controller's job is to handle HTTP requests and responses.
 * It's the entry point for all /todos routes.
 * 
 * Key Concepts:
 * 
 * 1. @Controller('todos') decorator:
 *    - Tells NestJS this class handles routes starting with /todos
 *    - It's a piece of metadata that NestJS uses to set up routing
 *    - All route decorators inside this class are relative to /todos
 * 
 * 2. Controllers should be "thin":
 *    - Controllers handle HTTP concerns (status codes, headers, etc.)
 *    - Business logic belongs in services
 *    - Controllers delegate work to services and return results
 * 
 * 3. Route Decorators (@Get, @Post, @Patch, @Delete):
 *    - Map HTTP methods to handler functions
 *    - Can include additional path segments: @Get(':id') → GET /todos/:id
 *    - The order matters! More specific routes should come before generic ones
 * 
 * 4. Parameter Decorators (@Body, @Param, @Query):
 *    - Extract data from different parts of the HTTP request
 *    - @Body() → Request body (JSON payload)
 *    - @Param('id') → Route parameter (the :id in the URL)
 *    - @Query('key') → Query string parameter (?key=value)
 */
@Controller('todos')
export class TodosController {
  /**
   * Constructor-based Dependency Injection
   * 
   * NestJS automatically injects an instance of TodosService
   * 
   * How does this work?
   * 1. TodosModule lists TodosService in its 'providers' array
   * 2. NestJS creates a TodosService instance when the app starts
   * 3. When creating TodosController, NestJS sees it needs TodosService
   * 4. NestJS injects the TodosService instance automatically
   * 
   * Why not 'new TodosService()'?
   * - NestJS manages the lifecycle (singleton pattern)
   * - Makes testing easier (we can inject a mock service)
   * - Services might have their own dependencies that NestJS also manages
   */
  constructor(private readonly todosService: TodosService) {}

  /**
   * POST /todos - Create a new todo
   * 
   * Route: POST http://localhost:3000/todos
   * Request body: { "title": "Buy milk", "description": "2% milk" }
   * Response: 201 Created with the created todo
   * 
   * Decorators explained:
   * - @Post() - This method handles POST requests to /todos
   * - @Body() - Extract and validate the JSON body as CreateTodoDto
   * 
   * How validation works:
   * 1. Client sends JSON in request body
   * 2. NestJS's ValidationPipe (configured in main.ts) kicks in
   * 3. It transforms the plain JSON object into a CreateTodoDto instance
   * 4. It runs all the class-validator decorators (@IsNotEmpty, @MaxLength, etc.)
   * 5. If validation fails → 400 Bad Request with error details
   * 6. If validation passes → the method receives the validated DTO
   * 
   * What HTTP status code is returned?
   * - 201 Created (NestJS's default for POST)
   * - If an exception is thrown, NestJS converts it (e.g., NotFoundException → 404)
   */
  @Post()
  async create(@Body() createTodoDto: CreateTodoDto): Promise<Todo> {
    return await this.todosService.create(createTodoDto);
  }

  /**
   * GET /todos - List all todos with optional filtering
   * 
   * Route: GET http://localhost:3000/todos
   * Route with filter: GET http://localhost:3000/todos?completed=true
   * Response: 200 OK with array of todos
   * 
   * Decorators explained:
   * - @Get() - This method handles GET requests to /todos
   * - @Query('completed', new ParseBoolPipe({ optional: true })) - Extract 'completed' query parameter
   * 
   * Query Parameters:
   * - Query parameters come after ? in the URL: /todos?completed=true
   * - They're optional by default (unless you add validation)
   * - @Query('key') extracts a specific parameter by name
   * - @Query() (no argument) would give you all query parameters as an object
   * 
   * ParseBoolPipe:
   * - Transforms string "true"/"false" into boolean true/false
   * - { optional: true } means the parameter can be omitted
   * - Without this pipe, 'completed' would be a string, not a boolean
   * 
   * Examples:
   * - GET /todos → completed is undefined → returns all todos
   * - GET /todos?completed=true → completed is true → returns only completed todos
   * - GET /todos?completed=false → completed is false → returns only incomplete todos
   */
  @Get()
  async findAll(
    @Query('completed', new ParseBoolPipe({ optional: true })) completed?: boolean,
  ): Promise<Todo[]> {
    return await this.todosService.findAll(completed);
  }

  /**
   * GET /todos/:id - Get a single todo by ID
   * 
   * Route: GET http://localhost:3000/todos/123e4567-e89b-12d3-a456-426614174000
   * Response: 200 OK with the todo, or 404 Not Found
   * 
   * Decorators explained:
   * - @Get(':id') - This method handles GET requests to /todos/:id
   *   - The :id is a route parameter (a placeholder in the URL path)
   * - @Param('id') - Extract the 'id' parameter from the URL
   * 
   * Route Parameters vs Query Parameters:
   * - Route parameter: /todos/123 → part of the path, usually required
   * - Query parameter: /todos?completed=true → after ?, usually optional
   * 
   * What if the todo doesn't exist?
   * - The service throws NotFoundException
   * - NestJS catches it and automatically returns 404 with the error message
   * - We don't need to handle this in the controller
   * 
   * Example:
   * - GET /todos/abc123 → returns the todo with that ID
   * - GET /todos/nonexistent → 404 with message "Todo with ID "nonexistent" not found"
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Todo> {
    return await this.todosService.findOne(id);
  }

  /**
   * PATCH /todos/:id - Update a todo
   * 
   * Route: PATCH http://localhost:3000/todos/123e4567-e89b-12d3-a456-426614174000
   * Request body: { "is_completed": true }
   * Response: 200 OK with the updated todo
   * 
   * Decorators explained:
   * - @Patch(':id') - This method handles PATCH requests to /todos/:id
   * - @Param('id') - Extract the ID from the URL
   * - @Body() - Extract and validate the JSON body as UpdateTodoDto
   * 
   * PATCH vs PUT:
   * - PATCH: Partial update - only send the fields you want to change
   * - PUT: Full replacement - send the entire resource
   * - We use PATCH because it's more flexible and common for updates
   * 
   * Examples:
   * - PATCH /todos/abc123 with { "is_completed": true } → marks todo as completed
   * - PATCH /todos/abc123 with { "title": "New title" } → updates only the title
   * - PATCH /todos/abc123 with { "title": "New title", "is_completed": true } → updates both
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Promise<Todo> {
    return await this.todosService.update(id, updateTodoDto);
  }

  /**
   * DELETE /todos/:id - Delete a todo
   * 
   * Route: DELETE http://localhost:3000/todos/123e4567-e89b-12d3-a456-426614174000
   * Response: 204 No Content (successful deletion, no body returned)
   * 
   * Decorators explained:
   * - @Delete(':id') - This method handles DELETE requests to /todos/:id
   * - @HttpCode(HttpStatus.NO_CONTENT) - Set the HTTP status to 204
   * - @Param('id') - Extract the ID from the URL
   * 
   * Why 204 No Content?
   * - 204 means "Success, but I'm not sending any data back"
   * - It's the standard for DELETE operations
   * - The client knows it worked because they got 204 instead of an error
   * - Without @HttpCode(), NestJS would return 200 by default
   * 
   * What if the todo doesn't exist?
   * - The service throws NotFoundException
   * - NestJS returns 404 instead of 204
   * 
   * Why return Promise<void>?
   * - void means "no return value"
   * - We don't need to return anything for a DELETE
   * - The HTTP status code tells the client everything they need to know
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.todosService.remove(id);
  }
}
