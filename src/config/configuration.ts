/**
 * Main Configuration Factory
 * 
 * This configuration demonstrates:
 * - Environment-based configuration loading
 * - Type-safe configuration interfaces
 * - Configuration namespacing for different modules
 * - Default value handling
 * - Environment variable parsing and transformation
 * 
 * Educational Notes:
 * - Configuration factory functions return configuration objects
 * - Environment variables are parsed and transformed to appropriate types
 * - Namespacing helps organize related configuration values
 * - Default values ensure the application works in different environments
 * - Type safety prevents configuration errors at compile time
 */

import { registerAs } from '@nestjs/config';

/**
 * Helper function to safely parse integers from environment variables
 * 
 * Educational: Environment variables are always strings, but we often need numbers.
 * This helper provides safe parsing with fallback to default values.
 */
function parseIntSafe(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Helper function to safely parse booleans from environment variables
 * 
 * Educational: Environment variables are strings, but we need proper booleans.
 * This helper converts string representations to actual boolean values.
 */
function parseBooleanSafe(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Application Configuration Interface
 * 
 * Educational: Type-safe configuration interfaces prevent runtime errors
 * and provide better IDE support with autocomplete and type checking.
 */
export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
}

export interface DatabaseConfig {
  type: 'postgres' | 'mysql' | 'sqlite' | 'mongodb';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
  ssl: boolean;
  retryAttempts: number;
  retryDelay: number;
}

export interface MongoConfig {
  uri: string;
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export interface OAuthConfig {
  google: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
}

export interface SessionConfig {
  secret: string;
  resave: boolean;
  saveUninitialized: boolean;
  cookie: {
    maxAge: number;
    httpOnly: boolean;
    secure: boolean;
  };
}

export interface FileUploadConfig {
  destination: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface ThrottleConfig {
  ttl: number;
  limit: number;
}

export interface LoggingConfig {
  level: string;
  file: string;
  enableConsole: boolean;
  enableFile: boolean;
}

export interface HealthConfig {
  timeout: number;
}

export interface FeatureFlags {
  enableSwagger: boolean;
  enableGraphql: boolean;
  enableWebsockets: boolean;
  enableMicroservices: boolean;
  enableCaching: boolean;
  enableQueue: boolean;
}

/**
 * Main Configuration Factory
 * 
 * Educational: This factory function loads and transforms environment variables
 * into a structured configuration object. It demonstrates:
 * - Environment variable parsing
 * - Type conversion (string to number, boolean)
 * - Default value assignment
 * - Configuration organization
 */
export const configuration = () => ({
  // Application Configuration
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseIntSafe(process.env.PORT, 3000),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  } as AppConfig,

  // Database Configuration
  database: {
    type: (process.env.DATABASE_TYPE as any) || 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseIntSafe(process.env.DATABASE_PORT, 5432),
    username: process.env.DATABASE_USERNAME || 'nestjs_user',
    password: process.env.DATABASE_PASSWORD || 'nestjs_password',
    database: process.env.DATABASE_NAME || 'nestjs_learning_platform',
    synchronize: parseBooleanSafe(process.env.DATABASE_SYNCHRONIZE, false),
    logging: parseBooleanSafe(process.env.DATABASE_LOGGING, false),
    ssl: parseBooleanSafe(process.env.DATABASE_SSL, false),
    retryAttempts: parseIntSafe(process.env.DATABASE_RETRY_ATTEMPTS, 3),
    retryDelay: parseIntSafe(process.env.DATABASE_RETRY_DELAY, 3000),
  } as DatabaseConfig,

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nestjs_learning_platform',
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as MongoConfig,

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseIntSafe(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseIntSafe(process.env.REDIS_DB, 0),
    retryAttempts: parseIntSafe(process.env.REDIS_RETRY_ATTEMPTS, 3),
    retryDelay: parseIntSafe(process.env.REDIS_RETRY_DELAY, 3000),
  } as RedisConfig,

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'development-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as JwtConfig,

  // OAuth Configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback',
    },
  } as OAuthConfig,

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'development-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: parseIntSafe(process.env.SESSION_MAX_AGE, 24 * 60 * 60 * 1000), // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  } as SessionConfig,

  // File Upload Configuration
  fileUpload: {
    destination: process.env.UPLOAD_DEST || './uploads',
    maxFileSize: parseIntSafe(process.env.MAX_FILE_SIZE, 10 * 1024 * 1024), // 10MB
    allowedMimeTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
    ],
  } as FileUploadConfig,

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseIntSafe(process.env.SMTP_PORT, 587),
    secure: parseBooleanSafe(process.env.SMTP_SECURE, false),
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.SMTP_FROM || 'noreply@nestjs-learning-platform.com',
  } as EmailConfig,

  // Rate Limiting Configuration
  throttle: {
    ttl: parseIntSafe(process.env.THROTTLE_TTL, 60),
    limit: parseIntSafe(process.env.THROTTLE_LIMIT, 10),
  } as ThrottleConfig,

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    file: process.env.LOG_FILE || 'logs/application.log',
    enableConsole: parseBooleanSafe(process.env.LOG_ENABLE_CONSOLE, true),
    enableFile: parseBooleanSafe(process.env.LOG_ENABLE_FILE, false),
  } as LoggingConfig,

  // Health Check Configuration
  health: {
    timeout: parseIntSafe(process.env.HEALTH_CHECK_TIMEOUT, 5000),
  } as HealthConfig,

  // Feature Flags
  features: {
    enableSwagger: parseBooleanSafe(process.env.ENABLE_SWAGGER, true),
    enableGraphql: parseBooleanSafe(process.env.ENABLE_GRAPHQL, true),
    enableWebsockets: parseBooleanSafe(process.env.ENABLE_WEBSOCKETS, true),
    enableMicroservices: parseBooleanSafe(process.env.ENABLE_MICROSERVICES, false),
    enableCaching: parseBooleanSafe(process.env.ENABLE_CACHING, true),
    enableQueue: parseBooleanSafe(process.env.ENABLE_QUEUE, true),
  } as FeatureFlags,
});

/**
 * Namespaced Configuration Registrations
 * 
 * Educational: registerAs() creates namespaced configuration that can be
 * injected independently. This is useful for feature-specific configuration
 * that doesn't need access to the entire configuration object.
 */

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseIntSafe(process.env.PORT, 3000),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
}));

export const databaseConfig = registerAs('database', () => ({
  type: (process.env.DATABASE_TYPE as any) || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseIntSafe(process.env.DATABASE_PORT, 5432),
  username: process.env.DATABASE_USERNAME || 'nestjs_user',
  password: process.env.DATABASE_PASSWORD || 'nestjs_password',
  database: process.env.DATABASE_NAME || 'nestjs_learning_platform',
  synchronize: parseBooleanSafe(process.env.DATABASE_SYNCHRONIZE, false),
  logging: parseBooleanSafe(process.env.DATABASE_LOGGING, false),
  ssl: parseBooleanSafe(process.env.DATABASE_SSL, false),
  retryAttempts: parseIntSafe(process.env.DATABASE_RETRY_ATTEMPTS, 3),
  retryDelay: parseIntSafe(process.env.DATABASE_RETRY_DELAY, 3000),
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'development-jwt-secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseIntSafe(process.env.REDIS_PORT, 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseIntSafe(process.env.REDIS_DB, 0),
  retryAttempts: parseIntSafe(process.env.REDIS_RETRY_ATTEMPTS, 3),
  retryDelay: parseIntSafe(process.env.REDIS_RETRY_DELAY, 3000),
}));