/**
 * TypeORM Data Source Configuration
 * 
 * This file demonstrates:
 * - CLI-compatible DataSource configuration
 * - Environment-based configuration loading
 * - Migration and entity path configuration
 * - Connection options for different environments
 * 
 * Educational Notes:
 * - DataSource is used by TypeORM CLI for migrations and schema operations
 * - Separate from the NestJS module configuration for CLI independence
 * - Environment variables are loaded directly for CLI compatibility
 * - Path configurations use glob patterns for flexibility
 */

import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

/**
 * Helper function to safely parse integers from environment variables
 */
function parseIntSafe(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Helper function to safely parse booleans from environment variables
 */
function parseBooleanSafe(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Base Data Source Configuration
 * 
 * Educational: This configuration is used by TypeORM CLI for operations
 * like generating migrations, running migrations, and schema synchronization.
 */
const baseConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseIntSafe(process.env.DATABASE_PORT, 5432),
  username: process.env.DATABASE_USERNAME || 'nestjs_user',
  password: process.env.DATABASE_PASSWORD || 'nestjs_password',
  database: process.env.DATABASE_NAME || 'nestjs_learning_platform',
  
  // Entity paths for CLI operations
  entities: [
    join(__dirname, '../entities/*.entity{.ts,.js}'),
  ],
  
  // Migration configuration
  migrations: [
    join(__dirname, './migrations/*{.ts,.js}'),
  ],
  
  // Subscriber configuration
  subscribers: [
    join(__dirname, './subscribers/*{.ts,.js}'),
  ],
  
  // CLI-specific settings
  synchronize: false, // Never auto-sync in CLI operations
  logging: parseBooleanSafe(process.env.DATABASE_LOGGING, false),
  
  // SSL configuration
  ssl: parseBooleanSafe(process.env.DATABASE_SSL, false) ? {
    rejectUnauthorized: false,
  } : false,
  
  // Connection pool settings
  extra: {
    max: 10, // Smaller pool for CLI operations
    min: 1,
    idle: 10000,
    acquire: 60000,
    statement_timeout: 30000,
    query_timeout: 30000,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    application_name: 'NestJS CLI',
  },
  
  // Migration table configuration
  migrationsTableName: 'migrations',
  migrationsRun: false,
  
  // Timezone configuration
  timezone: 'UTC',
};

/**
 * Development Data Source
 * 
 * Educational: Development configuration with more verbose logging
 * and relaxed SSL requirements for local development.
 */
const developmentConfig: DataSourceOptions = {
  ...baseConfig,
  logging: true,
  synchronize: parseBooleanSafe(process.env.DATABASE_SYNCHRONIZE, true),
  ssl: false,
  extra: {
    ...baseConfig.extra,
    max: 5, // Smaller pool for development
    min: 1,
  },
};

/**
 * Production Data Source
 * 
 * Educational: Production configuration with security and performance
 * optimizations, including SSL and connection pooling.
 */
const productionConfig: DataSourceOptions = {
  ...baseConfig,
  logging: false,
  synchronize: false, // Never auto-sync in production
  ssl: {
    rejectUnauthorized: false, // Adjust based on your SSL setup
  },
  extra: {
    ...baseConfig.extra,
    max: 20, // Larger pool for production
    min: 5,
    // Production-specific optimizations
    statement_timeout: 60000, // Longer timeout for complex queries
    query_timeout: 60000,
  },
};

/**
 * Test Data Source
 * 
 * Educational: Test configuration with in-memory or separate test database
 * to avoid interfering with development data.
 */
const testConfig: DataSourceOptions = {
  ...baseConfig,
  database: process.env.DATABASE_NAME ? `${process.env.DATABASE_NAME}_test` : 'nestjs_learning_platform_test',
  synchronize: true, // Auto-sync for tests
  logging: false, // Reduce noise in test output
  dropSchema: true, // Clean slate for each test run
  ssl: false,
  extra: {
    max: 5, // Small pool for tests
    min: 1,
    idle: 1000,
    acquire: 10000,
  },
};

/**
 * Get Environment-Specific Configuration
 * 
 * Educational: This function returns the appropriate configuration
 * based on the current environment, allowing for environment-specific
 * database settings and optimizations.
 */
function getDataSourceConfig(): DataSourceOptions {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

/**
 * Main Data Source Instance
 * 
 * Educational: This is the primary DataSource instance used by TypeORM CLI.
 * It automatically selects the appropriate configuration based on the environment.
 */
export const AppDataSource = new DataSource(getDataSourceConfig());

/**
 * Named Data Source Instances
 * 
 * Educational: These are additional DataSource instances for specific purposes,
 * demonstrating how to manage multiple database connections.
 */

// Analytics database connection
export const AnalyticsDataSource = new DataSource({
  ...getDataSourceConfig(),
  name: 'analytics',
  database: process.env.DATABASE_ANALYTICS_NAME || 
    `${process.env.DATABASE_NAME || 'nestjs_learning_platform'}_analytics`,
  entities: [
    join(__dirname, '../entities/analytics/*.entity{.ts,.js}'),
  ],
  migrations: [
    join(__dirname, './migrations/analytics/*{.ts,.js}'),
  ],
});

// Logging database connection
export const LoggingDataSource = new DataSource({
  ...getDataSourceConfig(),
  name: 'logging',
  database: process.env.DATABASE_LOGGING_NAME || 
    `${process.env.DATABASE_NAME || 'nestjs_learning_platform'}_logs`,
  entities: [
    join(__dirname, '../entities/logging/*.entity{.ts,.js}'),
  ],
  migrations: [
    join(__dirname, './migrations/logging/*{.ts,.js}'),
  ],
  logging: false, // Don't log database operations to database
});

/**
 * Connection Helper Functions
 * 
 * Educational: These helper functions provide convenient ways to
 * initialize and manage database connections programmatically.
 */

/**
 * Initialize Data Source
 * 
 * Educational: This function initializes a DataSource with proper
 * error handling and logging.
 */
export async function initializeDataSource(dataSource: DataSource): Promise<void> {
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      console.log(`✅ DataSource "${dataSource.options.name || 'default'}" initialized successfully`);
    }
  } catch (error) {
    console.error(`❌ Failed to initialize DataSource "${dataSource.options.name || 'default'}":`, error);
    throw error;
  }
}

/**
 * Close Data Source
 * 
 * Educational: This function properly closes a DataSource connection
 * with error handling.
 */
export async function closeDataSource(dataSource: DataSource): Promise<void> {
  try {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log(`✅ DataSource "${dataSource.options.name || 'default'}" closed successfully`);
    }
  } catch (error) {
    console.error(`❌ Failed to close DataSource "${dataSource.options.name || 'default'}":`, error);
    throw error;
  }
}

/**
 * Test Database Connection
 * 
 * Educational: This function tests database connectivity
 * for health checks and startup validation.
 */
export async function testConnection(dataSource: DataSource): Promise<boolean> {
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    
    // Simple query to test connection
    await dataSource.query('SELECT 1 as test');
    console.log(`✅ Database connection test successful for "${dataSource.options.name || 'default'}"`);
    return true;
  } catch (error) {
    console.error(`❌ Database connection test failed for "${dataSource.options.name || 'default'}":`, error.message);
    return false;
  }
}

/**
 * Export default for TypeORM CLI
 * 
 * Educational: TypeORM CLI expects a default export of DataSource
 * for migration and schema operations.
 */
export default AppDataSource;