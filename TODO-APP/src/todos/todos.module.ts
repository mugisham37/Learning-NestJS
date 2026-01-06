import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { Todo } from './todo.entity';

/**
 * TodosModule
 * 
 * Modules are NestJS's way of organizing code into cohesive blocks.
 * Think of a module as a feature or domain boundary.
 * 
 * Key Concepts:
 * 
 * 1. Why do we need modules?
 *    - Organization: Related code stays together
 *    - Encapsulation: Modules can hide internal implementation details
 *    - Reusability: Modules can be imported into other modules
 *    - Scalability: Large apps are divided into multiple feature modules
 * 
 * 2. @Module() decorator properties:
 *    - imports: Other modules this module depends on
 *    - controllers: HTTP request handlers for this module
 *    - providers: Services, repositories, and other injectable classes
 *    - exports: Things from this module that other modules can use
 * 
 * 3. Module lifecycle:
 *    - When NestJS starts, it reads all @Module() decorators
 *    - It builds a dependency graph
 *    - It creates instances of providers and injects dependencies
 *    - It sets up routes from controllers
 */
@Module({
  /**
   * imports array
   * 
   * TypeOrmModule.forFeature([Todo]) does several things:
   * 1. Tells TypeORM about the Todo entity
   * 2. Creates a Repository<Todo> and registers it with NestJS's DI container
   * 3. Makes the repository available for injection in this module
   * 
   * Why forFeature()?
   * - forRoot() is used once in AppModule to configure the database connection
   * - forFeature() is used in feature modules to register specific entities
   * - This pattern lets each module declare which entities it needs
   */
  imports: [TypeOrmModule.forFeature([Todo])],

  /**
   * controllers array
   * 
   * Lists all controllers that belong to this module.
   * NestJS will:
   * 1. Create an instance of TodosController
   * 2. Scan it for route decorators (@Get, @Post, etc.)
   * 3. Set up the routes
   * 4. Inject any dependencies the controller needs (TodosService)
   * 
   * Controllers are where HTTP requests enter your application.
   */
  controllers: [TodosController],

  /**
   * providers array
   * 
   * Lists all the services and other injectable classes this module provides.
   * NestJS will:
   * 1. Create an instance of TodosService (singleton by default)
   * 2. Make it available for injection in controllers and other services in this module
   * 
   * The provider lifecycle:
   * - Created once when the app starts
   * - Injected wherever needed via constructor parameters
   * - Destroyed when the app shuts down
   * 
   * Providers can be:
   * - Services (business logic)
   * - Repositories (database access)
   * - Factories (create complex objects)
   * - Helpers, utilities, etc.
   */
  providers: [TodosService],

  /**
   * exports array (not used here, but important to know)
   * 
   * If we wanted other modules to use TodosService, we'd add it here:
   * exports: [TodosService]
   * 
   * Then another module could:
   * @Module({
   *   imports: [TodosModule],
   *   ...
   * })
   * 
   * And inject TodosService in its own controllers/services.
   * 
   * We don't need this for our simple app, but it's crucial for larger apps
   * where modules need to share functionality.
   */
})
export class TodosModule {}
