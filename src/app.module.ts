/**
 * Root Application Module for the Comprehensive NestJS Learning Platform
 * 
 * This module demonstrates:
 * - Root module organization and imports
 * - Global module configuration
 * - Feature module imports
 * - Cross-cutting concern modules
 * - Dynamic module configuration
 * 
 * Educational Notes:
 * - @Module() decorator defines a module
 * - imports[] array contains other modules this module depends on
 * - providers[] array contains services available in this module
 * - The root module ties together all feature modules
 * - Global modules are imported once and available everywhere
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import configuration
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation.schema';

// Import core modules (will be created in subsequent tasks)
// import { DatabaseModule } from './modules/database/database.module';
// import { SharedModule } from './modules/shared/shared.module';

// Import feature modules (will be created in subsequent tasks)
// import { AuthModule } from './modules/auth/auth.module';
// import { UsersModule } from './modules/users/users.module';
// import { ProjectsModule } from './modules/projects/projects.module';
// import { TasksModule } from './modules/tasks/tasks.module';
// import { CategoriesModule } from './modules/categories/categories.module';
// import { CommentsModule } from './modules/comments/comments.module';
// import { FilesModule } from './modules/files/files.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';
// import { AnalyticsModule } from './modules/analytics/analytics.module';
// import { ReportsModule } from './modules/reports/reports.module';

// Import cross-cutting modules (will be created in subsequent tasks)
// import { LoggingModule } from './modules/logging/logging.module';
// import { CacheModule } from './modules/cache/cache.module';
// import { QueueModule } from './modules/queue/queue.module';
// import { SchedulerModule } from './modules/scheduler/scheduler.module';
// import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration Module - Global configuration management
    // Educational: ConfigModule.forRoot() makes configuration available globally
    ConfigModule.forRoot({
      // Load configuration from multiple sources
      load: [configuration],
      // Make configuration global (available in all modules without importing)
      isGlobal: true,
      // Validate configuration against Joi schema
      validationSchema,
      // Cache configuration for better performance
      cache: true,
      // Expand environment variables (e.g., ${HOME}/app -> /home/user/app)
      expandVariables: true,
    }),

    // Core Infrastructure Modules
    // Educational: These modules provide foundational services
    // DatabaseModule.forRootAsync({
    //   useFactory: (configService: ConfigService) => ({
    //     ...configService.get('database'),
    //   }),
    //   inject: [ConfigService],
    // }),
    // SharedModule, // Global utilities and common services

    // Feature Modules
    // Educational: Feature modules encapsulate related functionality
    // AuthModule,
    // UsersModule,
    // ProjectsModule,
    // TasksModule,
    // CategoriesModule,
    // CommentsModule,
    // FilesModule,
    // NotificationsModule,
    // AnalyticsModule,
    // ReportsModule,

    // Cross-Cutting Concern Modules
    // Educational: These modules provide services used across features
    // LoggingModule,
    // CacheModule,
    // QueueModule,
    // SchedulerModule,
    // HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  /**
   * Educational: Module lifecycle hooks
   * 
   * NestJS provides several lifecycle hooks for modules:
   * - onModuleInit(): Called after module initialization
   * - onApplicationBootstrap(): Called after all modules are initialized
   * - onModuleDestroy(): Called before module destruction
   * - beforeApplicationShutdown(): Called before application shutdown
   */
  
  // Uncomment to demonstrate module lifecycle hooks
  // onModuleInit() {
  //   console.log('AppModule has been initialized');
  // }
  
  // onApplicationBootstrap() {
  //   console.log('Application has been bootstrapped');
  // }
}