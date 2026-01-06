import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodosModule } from './todos/todos.module';
import { Todo } from './todos/todo.entity';

/**
 * AppModule - The Root Module
 * 
 * Every NestJS application has a root module. This is it.
 * NestJS starts here and discovers the rest of the app through imports.
 * 
 * Key Concepts:
 * 
 * 1. Root module:
 *    - The entry point of the module system
 *    - Imports all feature modules (like TodosModule)
 *    - Configures app-wide concerns (database, config, etc.)
 * 
 * 2. Module composition:
 *    - Modules can import other modules
 *    - This creates a module tree with AppModule at the root
 *    - NestJS traverses this tree to set up the entire application
 */
@Module({
  imports: [
    /**
     * ConfigModule - Environment variable configuration
     * 
     * ConfigModule.forRoot() loads environment variables from .env file
     * 
     * Options:
     * - isGlobal: true → Makes ConfigService available everywhere without importing
     * - No need to add ConfigModule to imports in other modules
     * 
     * This lets us use environment variables for configuration:
     * - Database credentials
     * - API keys
     * - Port numbers
     * - Different settings for dev/staging/production
     * 
     * ConfigService can read these variables safely and with type checking.
     */
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    /**
     * TypeOrmModule - Database connection
     * 
     * TypeOrmModule.forRootAsync() configures the database connection
     * 
     * Why forRootAsync()?
     * - We need to wait for ConfigModule to load environment variables
     * - 'Async' means we can inject ConfigService to read the .env file
     * - 'forRoot' means this is the main database configuration (done once)
     * 
     * Alternative: forRoot() with hardcoded values
     * But using ConfigService + .env is better because:
     * - Keeps secrets out of source code
     * - Easy to change settings without recompiling
     * - Different .env files for different environments
     */
    TypeOrmModule.forRootAsync({
      /**
       * Dependency injection for the configuration
       * 
       * inject: [ConfigService] tells NestJS we need ConfigService
       * useFactory: async (configService: ConfigService) => {...}
       * 
       * The factory function receives ConfigService and returns the config object.
       * This is called once when the app starts.
       */
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        /**
         * Database configuration object
         * 
         * This tells TypeORM how to connect to PostgreSQL
         */
        type: 'postgres', // We're using PostgreSQL
        host: configService.get<string>('DB_HOST'), // Usually 'localhost' in dev
        port: configService.get<number>('DB_PORT'), // Usually 5432 for PostgreSQL
        username: configService.get<string>('DB_USERNAME'), // Database user
        password: configService.get<string>('DB_PASSWORD'), // Database password
        database: configService.get<string>('DB_DATABASE'), // Database name

        /**
         * entities array
         * 
         * Lists all entity classes (our @Entity() decorated classes)
         * TypeORM needs to know about these to create tables and manage data
         * 
         * For now we only have Todo, but you'd add more as you expand:
         * entities: [Todo, User, Comment, ...]
         */
        entities: [Todo],

        /**
         * synchronize: true/false
         * 
         * When true, TypeORM automatically creates/updates database tables
         * to match your entities on every app startup.
         * 
         * IMPORTANT:
         * - ✅ Perfect for development - automatic schema updates
         * - ❌ NEVER use in production - can cause data loss!
         * 
         * In production, use migrations instead:
         * - Migrations are version-controlled SQL scripts
         * - They track database schema changes over time
         * - They can be reviewed, tested, and rolled back
         * 
         * For this learning project, synchronize: true is fine.
         * But remember: in real apps, use migrations.
         */
        synchronize: true,

        /**
         * logging: true/false
         * 
         * When true, TypeORM logs all SQL queries to the console
         * This is incredibly useful for learning!
         * 
         * You'll see:
         * - What SQL is generated for each operation
         * - How your TypeORM code translates to SQL
         * - Query performance (slow queries will be visible)
         * 
         * In production, you'd typically:
         * - Set logging: false for performance
         * - Or use logging: ['error'] to only log errors
         * - Or use a proper logging system for SQL queries
         */
        logging: true,
      }),
    }),

    /**
     * Feature modules
     * 
     * Import all feature modules here.
     * TodosModule brings in:
     * - TodosController (routes)
     * - TodosService (business logic)
     * - Todo entity (already listed in TypeORM entities array)
     * 
     * As your app grows, you'd add more modules:
     * imports: [ConfigModule, TypeOrmModule, TodosModule, UsersModule, AuthModule, ...]
     */
    TodosModule,
  ],

  /**
   * controllers and providers arrays
   * 
   * The root module usually doesn't have its own controllers/providers.
   * Those belong in feature modules like TodosModule.
   * 
   * You might add app-wide middleware, guards, or interceptors here,
   * but for a simple app, leaving these empty is fine.
   */
  controllers: [],
  providers: [],
})
export class AppModule {}
