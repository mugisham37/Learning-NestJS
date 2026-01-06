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
    port: parseInt(process.env.PORT, 10) || 3000,
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  } as AppConfig,

  // Database Configuration
  database: {
    type: (process.env.DATABASE_TYPE as any) || 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME || 'nestjs_user',
    password: process.env.DATABASE_PASSWORD || 'nestjs_password',
    database: process.env.DATABASE_NAME || 'nestjs_learning_platform',
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    logging: process.env.DATABASE_LOGGING === 'true',
    ssl: process.env.DATABASE_SSL === 'true',
    retryAttempts: parseInt(process.env.DATABASE_RETRY_ATTEMPTS, 10) || 3,
    retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY, 10) || 3000,
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
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    retryAttempts: parseInt(process.env.REDIS_RETRY_ATTEMPTS, 10) || 3,
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY, 10) || 3000,
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
      maxAge: parseInt(process.env.SESSION_MAX_AGE, 10) || 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  } as SessionConfig,

  // File Upload Configuration
  fileUpload: {
    destination: process.env.UPLOAD_DEST || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
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
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.SMTP_FROM || 'noreply@nestjs-learning-platform.com',
  } as EmailConfig,

  // Rate Limiting Configuration
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 10,
  } as ThrottleConfig,

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    file: process.env.LOG_FILE || 'logs/application.log',
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE === 'true',
  } as LoggingConfig,

  // Health Check Configuration
  health: {
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT, 10) || 5000,
  } as HealthConfig,

  // Feature Flags
  features: {
    enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
    enableGraphql: process.env.ENABLE_GRAPHQL !== 'false',
    enableWebsockets: process.env.ENABLE_WEBSOCKETS !== 'false',
    enableMicroservices: process.env.ENABLE_MICROSERVICES === 'true',
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    enableQueue: process.env.ENABLE_QUEUE !== 'false',
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
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
}));

export const databaseConfig = registerAs('database', () => ({
  type: (process.env.DATABASE_TYPE as any) || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || 'nestjs_user',
  password: process.env.DATABASE_PASSWORD || 'nestjs_password',
  database: process.env.DATABASE_NAME || 'nestjs_learning_platform',
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  logging: process.env.DATABASE_LOGGING === 'true',
  ssl: process.env.DATABASE_SSL === 'true',
  retryAttempts: parseInt(process.env.DATABASE_RETRY_ATTEMPTS, 10) || 3,
  retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY, 10) || 3000,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'development-jwt-secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  retryAttempts: parseInt(process.env.REDIS_RETRY_ATTEMPTS, 10) || 3,
  retryDelay: parseInt(process.env.REDIS_RETRY_DELAY, 10) || 3000,
}));