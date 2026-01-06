/**
 * Database Module - Comprehensive Database Integration
 * 
 * This module demonstrates:
 * - TypeORM configuration with PostgreSQL
 * - Multiple database connection management
 * - Connection pooling and performance optimization
 * - Environment-based configuration
 * - Async module configuration patterns
 * - Connection retry logic and error handling
 * 
 * Educational Notes:
 * - Dynamic modules allow flexible configuration
 * - forRoot/forRootAsync patterns provide sync/async configuration options
 * - Connection pooling improves performance under load
 * - Retry logic handles temporary connection failures
 * - Multiple connections support different databases for different purposes
 */

import { Module, DynamicModule, Logger } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

// Import all entities (will be created in next subtask)
import { User } from '../entities/user.entity';
import { Project } from '../entities/project.entity';
import { Task } from '../entities/task.entity';
import { Category } from '../entities/category.entity';
import { Comment } from '../entities/comment.entity';
import { File } from '../entities/file.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { ProjectMember } from '../entities/project-member.entity';
import { TaskAttachment } from '../entities/task-attachment.entity';
import { TaskCategory } from '../entities/task-category.entity';

/**
 * Database Configuration Interface
 * 
 * Educational: Type-safe configuration interfaces prevent runtime errors
 * and provide better IDE support with autocomplete and type checking.
 */
export interface DatabaseModuleOptions {
  connectionName?: string;
  retryAttempts?: number;
  retryDelay?: number;
  autoLoadEntities?: boolean;
  synchronize?: boolean;
  logging?: boolean;
  ssl?: boolean;
  extra?: Record<string, any>;
}

/**
 * Async Database Configuration Interface
 * 
 * Educational: Async configuration allows loading configuration from
 * external sources like databases, APIs, or configuration services.
 */
export interface DatabaseModuleAsyncOptions {
  imports?: any[];
  useFactory?: (...args: any[]) => Promise<DatabaseModuleOptions> | DatabaseModuleOptions;
  inject?: any[];
  connectionName?: string;
}

/**
 * Database Module
 * 
 * Educational: This module demonstrates comprehensive database integration
 * with TypeORM, including multiple connection patterns, performance optimization,
 * and proper error handling.
 */
@Module({})
export class DatabaseModule {
  private static readonly logger = new Logger(DatabaseModule.name);

  /**
   * Synchronous Module Configuration
   * 
   * Educational: forRoot() provides a simple way to configure the module
   * with static options. This is useful when configuration is known at compile time.
   */
  static forRoot(options: DatabaseModuleOptions = {}): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRoot({
          ...this.createTypeOrmOptions(),
          ...options,
        }),
      ],
      exports: [TypeOrmModule],
      global: true,
    };
  }

  /**
   * Asynchronous Module Configuration
   * 
   * Educational: forRootAsync() allows configuration to be loaded asynchronously,
   * which is essential when configuration depends on external services or
   * environment variables that need to be validated.
   */
  static forRootAsync(options: DatabaseModuleAsyncOptions = {}): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        ...(options.imports || []),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => {
            const dbConfig = configService.get('database');
            const customOptions = options.useFactory 
              ? await options.useFactory(configService)
              : {};

            const typeOrmOptions = {
              ...this.createTypeOrmOptions(configService),
              ...customOptions,
            };

            this.logger.log(`Connecting to database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
            
            return typeOrmOptions;
          },
          inject: [ConfigService, ...(options.inject || [])],
        }),
      ],
      exports: [TypeOrmModule],
      global: true,
    };
  }

  /**
   * Multiple Database Connections
   * 
   * Educational: This method demonstrates how to configure multiple database
   * connections for different purposes (e.g., read/write splitting, different databases).
   */
  static forMultipleConnections(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        // Primary PostgreSQL connection
        TypeOrmModule.forRootAsync({
          name: 'default',
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            ...this.createTypeOrmOptions(configService),
            name: 'default',
          }),
          inject: [ConfigService],
        }),
        
        // Secondary read-only connection for analytics
        TypeOrmModule.forRootAsync({
          name: 'analytics',
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => {
            const dbConfig = configService.get('database');
            return {
              ...this.createTypeOrmOptions(configService),
              name: 'analytics',
              host: dbConfig.analyticsHost || dbConfig.host,
              database: dbConfig.analyticsDatabase || `${dbConfig.database}_analytics`,
              // Read-only configuration
              extra: {
                ...dbConfig.extra,
                readonly: true,
              },
            };
          },
          inject: [ConfigService],
        }),

        // Logging database connection
        TypeOrmModule.forRootAsync({
          name: 'logging',
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => {
            const dbConfig = configService.get('database');
            return {
              type: 'postgres',
              host: dbConfig.loggingHost || dbConfig.host,
              port: dbConfig.port,
              username: dbConfig.username,
              password: dbConfig.password,
              database: `${dbConfig.database}_logs`,
              entities: [], // Only logging entities
              synchronize: false, // Never auto-sync logging database
              logging: false, // Don't log database logs to database
              name: 'logging',
            };
          },
          inject: [ConfigService],
        }),
      ],
      exports: [TypeOrmModule],
      global: true,
    };
  }

  /**
   * Create TypeORM Configuration Options
   * 
   * Educational: This method creates comprehensive TypeORM configuration
   * with performance optimizations, connection pooling, and error handling.
   */
  private static createTypeOrmOptions(configService?: ConfigService): TypeOrmModuleOptions {
    const dbConfig = configService?.get('database') || {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'nestjs_user',
      password: 'nestjs_password',
      database: 'nestjs_learning_platform',
      synchronize: false,
      logging: false,
      ssl: false,
      retryAttempts: 3,
      retryDelay: 3000,
    };

    return {
      type: 'postgres',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      
      // Entity Configuration
      entities: [
        User,
        Project,
        Task,
        Category,
        Comment,
        File,
        ActivityLog,
        ProjectMember,
        TaskAttachment,
        TaskCategory,
      ],
      
      // Development vs Production Settings
      synchronize: dbConfig.synchronize, // Never use in production
      logging: dbConfig.logging,
      
      // SSL Configuration
      ssl: dbConfig.ssl ? {
        rejectUnauthorized: false, // For self-signed certificates
      } : false,
      
      // Connection Pool Configuration
      extra: {
        // Connection pool settings for performance
        max: 20, // Maximum number of connections
        min: 5,  // Minimum number of connections
        idle: 10000, // Close connections after 10 seconds of inactivity
        acquire: 60000, // Maximum time to get connection
        evict: 1000, // Check for idle connections every second
        
        // Performance optimizations
        statement_timeout: 30000, // 30 second query timeout
        query_timeout: 30000,
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        
        // Additional PostgreSQL-specific settings
        application_name: 'NestJS Learning Platform',
        ...dbConfig.extra,
      },
      
      // Migration Configuration
      migrations: ['dist/database/migrations/*.js'],
      migrationsTableName: 'migrations',
      migrationsRun: false, // Run migrations manually
      
      // Subscriber Configuration
      subscribers: ['dist/database/subscribers/*.js'],
      
      // Connection Retry Configuration
      retryAttempts: dbConfig.retryAttempts || 3,
      retryDelay: dbConfig.retryDelay || 3000,
      
      // Auto-load entities (useful for development)
      autoLoadEntities: true,
      
      // Timezone configuration
      timezone: 'UTC',
      
      // Cache configuration
      cache: {
        type: 'redis',
        options: configService?.get('redis') || {
          host: 'localhost',
          port: 6379,
        },
        duration: 30000, // 30 seconds default cache
      },
    };
  }

  /**
   * Create Data Source for CLI Operations
   * 
   * Educational: This method creates a DataSource instance that can be used
   * by TypeORM CLI for migrations, schema generation, and other operations.
   */
  static createDataSource(configService?: ConfigService): DataSource {
    const options = this.createTypeOrmOptions(configService) as DataSourceOptions;
    
    return new DataSource({
      ...options,
      // CLI-specific overrides
      entities: ['src/entities/*.entity.ts'],
      migrations: ['src/database/migrations/*.ts'],
      subscribers: ['src/database/subscribers/*.ts'],
    });
  }

  /**
   * Health Check Method
   * 
   * Educational: This method provides a way to check database connectivity
   * for health monitoring and startup validation.
   */
  static async checkConnection(dataSource: DataSource): Promise<boolean> {
    try {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }
      
      // Simple query to test connection
      await dataSource.query('SELECT 1');
      
      this.logger.log('Database connection successful');
      return true;
    } catch (error) {
      this.logger.error('Database connection failed:', error.message);
      return false;
    }
  }

  /**
   * Connection Event Handlers
   * 
   * Educational: These handlers demonstrate how to monitor database
   * connection events for logging and debugging purposes.
   */
  static setupConnectionEventHandlers(dataSource: DataSource): void {
    dataSource.manager.connection.on('connect', () => {
      this.logger.log('Database connected successfully');
    });

    dataSource.manager.connection.on('disconnect', () => {
      this.logger.warn('Database disconnected');
    });

    dataSource.manager.connection.on('error', (error) => {
      this.logger.error('Database connection error:', error);
    });

    dataSource.manager.connection.on('reconnect', () => {
      this.logger.log('Database reconnected');
    });
  }
}

/**
 * Database Configuration Factory
 * 
 * Educational: This factory function provides a convenient way to create
 * database configuration for different environments and use cases.
 */
export function createDatabaseConfig(
  configService: ConfigService,
  connectionName?: string
): TypeOrmModuleOptions {
  const dbConfig = configService.get('database');
  
  return {
    name: connectionName,
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
    synchronize: dbConfig.synchronize,
    logging: dbConfig.logging,
    ssl: dbConfig.ssl,
    retryAttempts: dbConfig.retryAttempts,
    retryDelay: dbConfig.retryDelay,
    autoLoadEntities: true,
  };
}

/**
 * Database Connection Tokens
 * 
 * Educational: These tokens can be used for dependency injection
 * when working with multiple database connections.
 */
export const DATABASE_CONNECTION_TOKENS = {
  DEFAULT: 'default',
  ANALYTICS: 'analytics',
  LOGGING: 'logging',
} as const;

export type DatabaseConnectionToken = typeof DATABASE_CONNECTION_TOKENS[keyof typeof DATABASE_CONNECTION_TOKENS];