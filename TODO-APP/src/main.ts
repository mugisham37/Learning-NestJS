import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * main.ts - Application Bootstrap
 * 
 * This is the entry point of the NestJS application.
 * When you run 'npm start', this file is executed first.
 * 
 * It creates the NestJS application instance and starts the HTTP server.
 */

/**
 * bootstrap() function
 * 
 * This async function sets up and starts the application.
 * 
 * Key Concepts:
 * 
 * 1. Why async?
 *    - Creating the app and starting the server are asynchronous operations
 *    - await lets us wait for each step to complete
 *    - If any step fails, the error will be caught and logged
 * 
 * 2. Top-level execution:
 *    - At the bottom of the file, we call bootstrap()
 *    - .catch() handles any startup errors
 */
async function bootstrap() {
  /**
   * Create the NestJS application instance
   * 
   * NestFactory.create(AppModule) does a lot:
   * 1. Reads the @Module() decorator on AppModule
   * 2. Recursively imports all modules in the imports array
   * 3. Creates instances of all controllers and providers
   * 4. Resolves all dependencies and injects them
   * 5. Sets up all routes from controllers
   * 6. Returns an application instance ready to listen for requests
   * 
   * This is where NestJS's "magic" happens - reading decorators and
   * building the dependency injection container.
   */
  const app = await NestFactory.create(AppModule);

  /**
   * Enable global validation
   * 
   * app.useGlobalPipes(new ValidationPipe({ ... }))
   * 
   * ValidationPipe is a built-in NestJS pipe that:
   * 1. Automatically validates all incoming request data
   * 2. Uses class-validator decorators from your DTOs
   * 3. Returns 400 Bad Request if validation fails
   * 4. Transforms plain objects to class instances
   * 
   * Options explained:
   * 
   * - whitelist: true
   *   Strips properties that don't have decorators in the DTO
   *   Example: If client sends { "title": "Test", "hacker": "payload" }
   *   The "hacker" property is removed because it's not in CreateTodoDto
   *   This protects against mass assignment vulnerabilities
   * 
   * - forbidNonWhitelisted: true
   *   Instead of silently stripping unknown properties, throw an error
   *   Returns 400 with message: "property hacker should not exist"
   *   Helps API consumers know they're sending wrong data
   * 
   * - transform: true
   *   Automatically transforms payloads to DTO instances
   *   Also transforms primitive types (string to number, string to boolean, etc.)
   *   Example: Route parameter ":id" is transformed from string to number if needed
   *   This is why @Query() parameters can be transformed by pipes
   * 
   * Why use these options?
   * - Security: Prevents unwanted data from reaching your business logic
   * - Type safety: Ensures data matches your TypeScript types
   * - Better errors: Gives clear feedback when data is wrong
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * Start the HTTP server
   * 
   * app.listen(3000) starts the server on port 3000
   * 
   * You could also use an environment variable:
   * const port = process.env.PORT || 3000;
   * await app.listen(port);
   * 
   * Once this completes, the server is running and ready to accept requests:
   * - POST http://localhost:3000/todos
   * - GET http://localhost:3000/todos
   * - GET http://localhost:3000/todos/:id
   * - PATCH http://localhost:3000/todos/:id
   * - DELETE http://localhost:3000/todos/:id
   */
  await app.listen(3000);

  console.log(`Application is running on: http://localhost:3000`);
  console.log(`API endpoints:`);
  console.log(`  POST   http://localhost:3000/todos`);
  console.log(`  GET    http://localhost:3000/todos`);
  console.log(`  GET    http://localhost:3000/todos/:id`);
  console.log(`  PATCH  http://localhost:3000/todos/:id`);
  console.log(`  DELETE http://localhost:3000/todos/:id`);
}

/**
 * Start the application
 * 
 * Call bootstrap() and catch any errors
 * If something goes wrong during startup (e.g., can't connect to database),
 * the error is logged and the process exits
 */
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
