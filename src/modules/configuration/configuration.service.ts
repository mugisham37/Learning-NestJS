/**
 * Configuration Service
 * 
 * This service demonstrates:
 * - Type-safe configuration access
 * - Configuration validation and transformation
 * - Configuration caching and performance optimization
 * - Environment-specific configuration handling
 * - Configuration change detection and hot reloading
 * 
 * Educational Notes:
 * - Configuration services provide a clean abstraction over raw configuration
 * - Type safety prevents configuration access errors at compile time
 * - Caching improves performance by avoiding repeated parsing
 * - Validation ensures configuration correctness throughout the application
 * - Hot reloading allows configuration changes without application restart
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppConfig,
  DatabaseConfig,
  MongoConfig,
  RedisConfig,
  JwtConfig,
  OAuthConfig,
  SessionConfig,
  FileUploadConfig,
  EmailConfig,
  ThrottleConfig,
  LoggingConfig,
  HealthConfig,
  FeatureFlags,
} from '../../config/configuration';

/**
 * Configuration Service
 * 
 * Educational: This service provides a type-safe, validated interface
 * to application configuration. It demonstrates:
 * - Dependency injection of ConfigService
 * - Type-safe configuration access methods
 * - Configuration validation and error handling
 * - Performance optimization through caching
 * - Environment-specific configuration handling
 */
@Injectable()
export class ConfigurationService implements OnModuleInit {
  private readonly logger = new Logger(ConfigurationService.name);
  private configCache = new Map<string, any>();
  private readonly cacheEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    // Enable caching in production for performance
    this.cacheEnabled = this.configService.get('NODE_ENV') === 'production';
  }

  /**
   * Module initialization hook
   * 
   * Educational: OnModuleInit is called after all dependencies are resolved.
   * This is a good place to perform initialization tasks like configuration
   * validation and cache warming.
   */
  async onModuleInit() {
    this.logger.log('Initializing Configuration Service...');
    
    // Validate critical configuration on startup
    await this.validateCriticalConfiguration();
    
    // Warm up configuration cache
    if (this.cacheEnabled) {
      await this.warmUpCache();
    }
    
    this.logger.log('Configuration Service initialized successfully');
  }

  /**
   * Get application configuration
   * 
   * Educational: Type-safe configuration access with validation.
   * The return type ensures compile-time type checking.
   */
  get app(): AppConfig {
    return this.getCachedConfig('app', () => ({
      nodeEnv: this.configService.get<string>('NODE_ENV', 'development'),
      port: this.configService.get<number>('PORT', 3000),
      apiPrefix: this.configService.get<string>('API_PREFIX', 'api/v1'),
      corsOrigins: this.configService.get<string>('CORS_ORIGINS', 'http://localhost:3000')
        .split(',')
        .map(origin => origin.trim()),
    }));
  }

  /**
   * Get database configuration
   * 
   * Educational: Configuration with validation and type coercion.
   * Environment variables are strings, but we need typed values.
   */
  get database(): DatabaseConfig {
    return this.getCachedConfig('database', () => ({
      type: this.configService.get<'postgres' | 'mysql' | 'sqlite' | 'mongodb'>('DATABASE_TYPE', 'postgres'),
      host: this.configService.get<string>('DATABASE_HOST', 'localhost'),
      port: this.configService.get<number>('DATABASE_PORT', 5432),
      username: this.configService.get<string>('DATABASE_USERNAME', 'nestjs_user'),
      password: this.configService.get<string>('DATABASE_PASSWORD', 'nestjs_password'),
      database: this.configService.get<string>('DATABASE_NAME', 'nestjs_learning_platform'),
      synchronize: this.configService.get<boolean>('DATABASE_SYNCHRONIZE', false),
      logging: this.configService.get<boolean>('DATABASE_LOGGING', false),
      ssl: this.configService.get<boolean>('DATABASE_SSL', false),
      retryAttempts: this.configService.get<number>('DATABASE_RETRY_ATTEMPTS', 3),
      retryDelay: this.configService.get<number>('DATABASE_RETRY_DELAY', 3000),
    }));
  }

  /**
   * Get MongoDB configuration
   */
  get mongodb(): MongoConfig {
    return this.getCachedConfig('mongodb', () => ({
      uri: this.configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/nestjs_learning_platform'),
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }));
  }

  /**
   * Get Redis configuration
   */
  get redis(): RedisConfig {
    return this.getCachedConfig('redis', () => {
      const password = this.configService.get<string>('REDIS_PASSWORD');
      const config: RedisConfig = {
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        db: this.configService.get<number>('REDIS_DB', 0),
        retryAttempts: this.configService.get<number>('REDIS_RETRY_ATTEMPTS', 3),
        retryDelay: this.configService.get<number>('REDIS_RETRY_DELAY', 3000),
      };
      
      if (password) {
        config.password = password;
      }
      
      return config;
    });
  }

  /**
   * Get JWT configuration
   * 
   * Educational: Security-sensitive configuration with validation.
   * JWT secrets should be strong and different between environments.
   */
  get jwt(): JwtConfig {
    return this.getCachedConfig('jwt', () => {
      const secret = this.configService.get<string>('JWT_SECRET');
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      
      // Validate JWT secrets in production
      if (this.app.nodeEnv === 'production') {
        if (!secret || secret.length < 32) {
          throw new Error('JWT_SECRET must be at least 32 characters in production');
        }
        if (!refreshSecret || refreshSecret.length < 32) {
          throw new Error('JWT_REFRESH_SECRET must be at least 32 characters in production');
        }
      }

      return {
        secret: secret || 'development-jwt-secret',
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
        refreshSecret: refreshSecret || 'development-refresh-secret',
        refreshExpiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      };
    });
  }

  /**
   * Get OAuth configuration
   */
  get oauth(): OAuthConfig {
    return this.getCachedConfig('oauth', () => ({
      google: {
        clientId: this.configService.get<string>('GOOGLE_CLIENT_ID', ''),
        clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET', ''),
        callbackUrl: this.configService.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost:3000/api/v1/auth/google/callback'),
      },
    }));
  }

  /**
   * Get session configuration
   */
  get session(): SessionConfig {
    return this.getCachedConfig('session', () => {
      const secret = this.configService.get<string>('SESSION_SECRET');
      
      // Validate session secret in production
      if (this.app.nodeEnv === 'production' && (!secret || secret.length < 32)) {
        throw new Error('SESSION_SECRET must be at least 32 characters in production');
      }

      return {
        secret: secret || 'development-session-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: this.configService.get<number>('SESSION_MAX_AGE', 24 * 60 * 60 * 1000),
          httpOnly: true,
          secure: this.app.nodeEnv === 'production',
        },
      };
    });
  }

  /**
   * Get file upload configuration
   */
  get fileUpload(): FileUploadConfig {
    return this.getCachedConfig('fileUpload', () => ({
      destination: this.configService.get<string>('UPLOAD_DEST', './uploads'),
      maxFileSize: this.configService.get<number>('MAX_FILE_SIZE', 10 * 1024 * 1024),
      allowedMimeTypes: this.configService.get<string>('ALLOWED_FILE_TYPES', 'image/jpeg,image/png,image/gif,application/pdf,text/plain')
        .split(',')
        .map(type => type.trim()),
    }));
  }

  /**
   * Get email configuration
   */
  get email(): EmailConfig {
    return this.getCachedConfig('email', () => ({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER', ''),
        pass: this.configService.get<string>('SMTP_PASS', ''),
      },
      from: this.configService.get<string>('SMTP_FROM', 'noreply@nestjs-learning-platform.com'),
    }));
  }

  /**
   * Get throttle configuration
   */
  get throttle(): ThrottleConfig {
    return this.getCachedConfig('throttle', () => ({
      ttl: this.configService.get<number>('THROTTLE_TTL', 60),
      limit: this.configService.get<number>('THROTTLE_LIMIT', 10),
    }));
  }

  /**
   * Get logging configuration
   */
  get logging(): LoggingConfig {
    return this.getCachedConfig('logging', () => ({
      level: this.configService.get<string>('LOG_LEVEL', 'debug'),
      file: this.configService.get<string>('LOG_FILE', 'logs/application.log'),
      enableConsole: this.configService.get<boolean>('LOG_ENABLE_CONSOLE', true),
      enableFile: this.configService.get<boolean>('LOG_ENABLE_FILE', false),
    }));
  }

  /**
   * Get health configuration
   */
  get health(): HealthConfig {
    return this.getCachedConfig('health', () => ({
      timeout: this.configService.get<number>('HEALTH_CHECK_TIMEOUT', 5000),
    }));
  }

  /**
   * Get feature flags
   * 
   * Educational: Feature flags allow enabling/disabling features
   * without code changes, useful for gradual rollouts and A/B testing.
   */
  get features(): FeatureFlags {
    return this.getCachedConfig('features', () => ({
      enableSwagger: this.configService.get<boolean>('ENABLE_SWAGGER', true),
      enableGraphql: this.configService.get<boolean>('ENABLE_GRAPHQL', true),
      enableWebsockets: this.configService.get<boolean>('ENABLE_WEBSOCKETS', true),
      enableMicroservices: this.configService.get<boolean>('ENABLE_MICROSERVICES', false),
      enableCaching: this.configService.get<boolean>('ENABLE_CACHING', true),
      enableQueue: this.configService.get<boolean>('ENABLE_QUEUE', true),
    }));
  }

  /**
   * Get configuration value by key with type safety
   * 
   * Educational: Generic method that provides type safety for
   * configuration access while maintaining flexibility.
   */
  get<T = any>(key: string, defaultValue?: T): T {
    const value = this.configService.get<T>(key);
    return value !== undefined ? value : (defaultValue as T);
  }

  /**
   * Get configuration value by path with type safety
   * 
   * Educational: Allows accessing nested configuration values
   * using dot notation (e.g., 'database.host').
   */
  getByPath<T = any>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let value: any = this.configService.get(keys[0]);
    
    for (let i = 1; i < keys.length; i++) {
      if (value && typeof value === 'object') {
        value = value[keys[i]];
      } else {
        return defaultValue as T;
      }
    }
    
    return value !== undefined ? value : (defaultValue as T);
  }

  /**
   * Check if a feature is enabled
   * 
   * Educational: Convenience method for feature flag checking.
   * Makes code more readable and provides a consistent interface.
   */
  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.features[feature];
  }

  /**
   * Get environment name
   * 
   * Educational: Convenience method for environment checking.
   * Commonly used in conditional logic throughout the application.
   */
  getEnvironment(): string {
    return this.app.nodeEnv;
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return this.getEnvironment() === 'development';
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }

  /**
   * Check if running in test mode
   */
  isTest(): boolean {
    return this.getEnvironment() === 'test';
  }

  /**
   * Get all configuration as a plain object
   * 
   * Educational: Useful for debugging and configuration inspection.
   * Should be used carefully to avoid exposing sensitive information.
   */
  getAllConfig(): Record<string, any> {
    return {
      app: this.app,
      database: this.database,
      mongodb: this.mongodb,
      redis: this.redis,
      jwt: this.sanitizeSecrets(this.jwt),
      oauth: this.sanitizeSecrets(this.oauth),
      session: this.sanitizeSecrets(this.session),
      fileUpload: this.fileUpload,
      email: this.sanitizeSecrets(this.email),
      throttle: this.throttle,
      logging: this.logging,
      health: this.health,
      features: this.features,
    };
  }

  /**
   * Cached configuration access
   * 
   * Educational: Caching improves performance by avoiding repeated
   * configuration parsing and validation. The cache is invalidated
   * when configuration changes.
   */
  private getCachedConfig<T>(key: string, factory: () => T): T {
    if (!this.cacheEnabled) {
      return factory();
    }

    if (this.configCache.has(key)) {
      return this.configCache.get(key);
    }

    const config = factory();
    this.configCache.set(key, config);
    return config;
  }

  /**
   * Validate critical configuration on startup
   * 
   * Educational: Early validation prevents runtime errors and
   * provides clear feedback about configuration issues.
   */
  private async validateCriticalConfiguration(): Promise<void> {
    try {
      // Validate database configuration
      const dbConfig = this.database;
      if (!dbConfig.host || !dbConfig.database) {
        throw new Error('Database host and database name are required');
      }

      // Validate JWT configuration in production
      if (this.isProduction()) {
        const jwtConfig = this.jwt;
        if (jwtConfig.secret.includes('development')) {
          throw new Error('Development JWT secret detected in production');
        }
      }

      // Validate port availability
      const port = this.app.port;
      if (port < 1 || port > 65535) {
        throw new Error(`Invalid port number: ${port}`);
      }

      this.logger.log('Critical configuration validation passed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Configuration validation failed:', errorMessage);
      throw error;
    }
  }

  /**
   * Warm up configuration cache
   * 
   * Educational: Cache warming improves first-request performance
   * by pre-loading frequently accessed configuration.
   */
  private async warmUpCache(): Promise<void> {
    const configKeys = [
      'app', 'database', 'redis', 'jwt', 'session', 
      'fileUpload', 'email', 'throttle', 'logging', 'features'
    ];

    for (const key of configKeys) {
      try {
        // Access each configuration to populate cache
        (this as any)[key];
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Failed to warm up cache for ${key}:`, errorMessage);
      }
    }

    this.logger.log(`Configuration cache warmed up with ${this.configCache.size} entries`);
  }

  /**
   * Sanitize sensitive configuration for logging
   * 
   * Educational: Security best practice to avoid logging sensitive
   * information like passwords, secrets, and API keys.
   */
  private sanitizeSecrets(config: any): any {
    if (!config || typeof config !== 'object') {
      return config;
    }

    const sanitized = { ...config };
    const sensitiveKeys = ['secret', 'password', 'pass', 'key', 'token'];

    for (const [key, value] of Object.entries(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeSecrets(value);
      }
    }

    return sanitized;
  }

  /**
   * Clear configuration cache
   * 
   * Educational: Useful for testing and hot reloading scenarios
   * where configuration needs to be refreshed.
   */
  clearCache(): void {
    this.configCache.clear();
    this.logger.log('Configuration cache cleared');
  }

  /**
   * Reload configuration
   * 
   * Educational: Allows configuration hot reloading without
   * application restart. Useful for development and some
   * production scenarios.
   */
  async reloadConfiguration(): Promise<void> {
    this.clearCache();
    await this.validateCriticalConfiguration();
    
    if (this.cacheEnabled) {
      await this.warmUpCache();
    }
    
    this.logger.log('Configuration reloaded successfully');
  }
}