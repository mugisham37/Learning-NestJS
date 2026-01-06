/**
 * Configuration Validation Schema
 * 
 * This schema demonstrates:
 * - Environment variable validation with Joi
 * - Type coercion and transformation
 * - Required vs optional configuration
 * - Default value assignment
 * - Custom validation rules
 * 
 * Educational Notes:
 * - Joi schemas validate and transform environment variables at startup
 * - Validation failures prevent application startup with clear error messages
 * - Type coercion converts strings to appropriate types (number, boolean)
 * - Default values are applied when environment variables are missing
 * - Custom validation rules can enforce business constraints
 */

import * as Joi from 'joi';

/**
 * Main Configuration Validation Schema
 * 
 * Educational: This Joi schema validates all environment variables used by the application.
 * It ensures that:
 * 1. Required variables are present
 * 2. Variables have correct types and formats
 * 3. Variables fall within acceptable ranges
 * 4. Default values are applied consistently
 */
export const validationSchema = Joi.object({
  // Application Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development')
    .description('Application environment'),
  
  PORT: Joi.number()
    .port()
    .default(3000)
    .description('Application port number'),
  
  API_PREFIX: Joi.string()
    .default('api/v1')
    .description('API route prefix'),
  
  CORS_ORIGINS: Joi.string()
    .default('http://localhost:3000')
    .description('Comma-separated list of allowed CORS origins'),

  // Database Configuration
  DATABASE_TYPE: Joi.string()
    .valid('postgres', 'mysql', 'sqlite', 'mongodb')
    .default('postgres')
    .description('Database type'),
  
  DATABASE_HOST: Joi.string()
    .hostname()
    .default('localhost')
    .description('Database host'),
  
  DATABASE_PORT: Joi.number()
    .port()
    .default(5432)
    .description('Database port'),
  
  DATABASE_USERNAME: Joi.string()
    .min(1)
    .default('nestjs_user')
    .description('Database username'),
  
  DATABASE_PASSWORD: Joi.string()
    .min(1)
    .default('nestjs_password')
    .description('Database password'),
  
  DATABASE_NAME: Joi.string()
    .min(1)
    .default('nestjs_learning_platform')
    .description('Database name'),
  
  DATABASE_SYNCHRONIZE: Joi.boolean()
    .default(false)
    .description('Enable TypeORM synchronization (use only in development)'),
  
  DATABASE_LOGGING: Joi.boolean()
    .default(false)
    .description('Enable database query logging'),
  
  DATABASE_SSL: Joi.boolean()
    .default(false)
    .description('Enable SSL connection to database'),
  
  DATABASE_RETRY_ATTEMPTS: Joi.number()
    .min(0)
    .max(10)
    .default(3)
    .description('Number of database connection retry attempts'),
  
  DATABASE_RETRY_DELAY: Joi.number()
    .min(1000)
    .max(30000)
    .default(3000)
    .description('Delay between database connection retry attempts (ms)'),

  // MongoDB Configuration
  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .default('mongodb://localhost:27017/nestjs_learning_platform')
    .description('MongoDB connection URI'),

  // Redis Configuration
  REDIS_HOST: Joi.string()
    .hostname()
    .default('localhost')
    .description('Redis host'),
  
  REDIS_PORT: Joi.number()
    .port()
    .default(6379)
    .description('Redis port'),
  
  REDIS_PASSWORD: Joi.string()
    .allow('')
    .optional()
    .description('Redis password (optional)'),
  
  REDIS_DB: Joi.number()
    .min(0)
    .max(15)
    .default(0)
    .description('Redis database number'),
  
  REDIS_RETRY_ATTEMPTS: Joi.number()
    .min(0)
    .max(10)
    .default(3)
    .description('Number of Redis connection retry attempts'),
  
  REDIS_RETRY_DELAY: Joi.number()
    .min(1000)
    .max(30000)
    .default(3000)
    .description('Delay between Redis connection retry attempts (ms)'),

  // JWT Configuration
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT signing secret (minimum 32 characters)'),
  
  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^(\d+[smhd]|\d+)$/)
    .default('1h')
    .description('JWT expiration time (e.g., 1h, 30m, 7d)'),
  
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT refresh token signing secret (minimum 32 characters)'),
  
  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .pattern(/^(\d+[smhd]|\d+)$/)
    .default('7d')
    .description('JWT refresh token expiration time'),

  // OAuth Configuration
  GOOGLE_CLIENT_ID: Joi.string()
    .allow('')
    .optional()
    .description('Google OAuth client ID'),
  
  GOOGLE_CLIENT_SECRET: Joi.string()
    .allow('')
    .optional()
    .description('Google OAuth client secret'),
  
  GOOGLE_CALLBACK_URL: Joi.string()
    .uri()
    .default('http://localhost:3000/api/v1/auth/google/callback')
    .description('Google OAuth callback URL'),

  // Session Configuration
  SESSION_SECRET: Joi.string()
    .min(32)
    .required()
    .description('Session signing secret (minimum 32 characters)'),
  
  SESSION_MAX_AGE: Joi.number()
    .min(60000) // 1 minute minimum
    .max(7 * 24 * 60 * 60 * 1000) // 7 days maximum
    .default(24 * 60 * 60 * 1000) // 24 hours default
    .description('Session maximum age in milliseconds'),

  // File Upload Configuration
  UPLOAD_DEST: Joi.string()
    .default('./uploads')
    .description('File upload destination directory'),
  
  MAX_FILE_SIZE: Joi.number()
    .min(1024) // 1KB minimum
    .max(100 * 1024 * 1024) // 100MB maximum
    .default(10 * 1024 * 1024) // 10MB default
    .description('Maximum file upload size in bytes'),
  
  ALLOWED_FILE_TYPES: Joi.string()
    .default('image/jpeg,image/png,image/gif,application/pdf,text/plain')
    .description('Comma-separated list of allowed MIME types'),

  // Email Configuration
  SMTP_HOST: Joi.string()
    .hostname()
    .default('localhost')
    .description('SMTP server host'),
  
  SMTP_PORT: Joi.number()
    .port()
    .default(587)
    .description('SMTP server port'),
  
  SMTP_SECURE: Joi.boolean()
    .default(false)
    .description('Enable SMTP SSL/TLS'),
  
  SMTP_USER: Joi.string()
    .allow('')
    .optional()
    .description('SMTP username'),
  
  SMTP_PASS: Joi.string()
    .allow('')
    .optional()
    .description('SMTP password'),
  
  SMTP_FROM: Joi.string()
    .email()
    .default('noreply@nestjs-learning-platform.com')
    .description('Default sender email address'),

  // Rate Limiting Configuration
  THROTTLE_TTL: Joi.number()
    .min(1)
    .max(3600)
    .default(60)
    .description('Rate limiting time window in seconds'),
  
  THROTTLE_LIMIT: Joi.number()
    .min(1)
    .max(1000)
    .default(10)
    .description('Maximum requests per time window'),

  // Logging Configuration
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('debug')
    .description('Logging level'),
  
  LOG_FILE: Joi.string()
    .default('logs/application.log')
    .description('Log file path'),
  
  LOG_ENABLE_CONSOLE: Joi.boolean()
    .default(true)
    .description('Enable console logging'),
  
  LOG_ENABLE_FILE: Joi.boolean()
    .default(false)
    .description('Enable file logging'),

  // Health Check Configuration
  HEALTH_CHECK_TIMEOUT: Joi.number()
    .min(1000)
    .max(30000)
    .default(5000)
    .description('Health check timeout in milliseconds'),

  // Feature Flags
  ENABLE_SWAGGER: Joi.boolean()
    .default(true)
    .description('Enable Swagger API documentation'),
  
  ENABLE_GRAPHQL: Joi.boolean()
    .default(true)
    .description('Enable GraphQL endpoint'),
  
  ENABLE_WEBSOCKETS: Joi.boolean()
    .default(true)
    .description('Enable WebSocket support'),
  
  ENABLE_MICROSERVICES: Joi.boolean()
    .default(false)
    .description('Enable microservice communication'),
  
  ENABLE_CACHING: Joi.boolean()
    .default(true)
    .description('Enable caching support'),
  
  ENABLE_QUEUE: Joi.boolean()
    .default(true)
    .description('Enable background job queue'),
});

/**
 * Environment-Specific Validation Schemas
 * 
 * Educational: Different environments may have different validation requirements.
 * For example, production might require certain secrets while development might not.
 */

export const developmentValidationSchema = validationSchema.fork(
  ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET'],
  (schema) => schema.optional().default('development-secret-change-in-production')
);

export const productionValidationSchema = validationSchema.fork(
  [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET', 
    'SESSION_SECRET',
    'DATABASE_PASSWORD',
    'REDIS_PASSWORD',
    'SMTP_PASS'
  ],
  (schema) => schema.required()
).fork(
  ['DATABASE_SYNCHRONIZE', 'DATABASE_LOGGING'],
  (schema) => schema.default(false)
).fork(
  ['ENABLE_SWAGGER'],
  (schema) => schema.default(false)
);

export const testValidationSchema = validationSchema.fork(
  [
    'DATABASE_NAME',
    'MONGODB_URI',
    'REDIS_DB'
  ],
  (schema) => schema.default('test_database')
).fork(
  ['LOG_LEVEL'],
  (schema) => schema.default('error')
);

/**
 * Get Environment-Specific Schema
 * 
 * Educational: This function returns the appropriate validation schema
 * based on the current environment, allowing for environment-specific
 * validation rules and defaults.
 */
export function getValidationSchema(): Joi.ObjectSchema {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionValidationSchema;
    case 'test':
      return testValidationSchema;
    case 'development':
    default:
      return developmentValidationSchema;
  }
}