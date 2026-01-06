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
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import our custom configuration module
import { ConfigurationModule } from './modules/configuration/configuration.module';

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
    // Configuration Module - Comprehensive configuration management
    // Educational: Our custom ConfigurationModule demonstrates dynamic module patterns
    // and provides type-safe, validated configuration access
    ConfigurationModule.forApplication(),

    // Core Infrastructure Modules
    // Educational: These modules provide foundational services
    // DatabaseModule.forRootAsync({
    //   useFactory: (configService: ConfigurationService) => ({
    //     ...configService.database,
    //   }),
    //   inject: [ConfigurationService],
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