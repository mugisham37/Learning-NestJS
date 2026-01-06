/**
 * Main application entry point for the Comprehensive NestJS Learning Platform
 * 
 * This file demonstrates:
 * - Application bootstrapping with NestJS
 * - Global configuration setup
 * - Middleware registration
 * - Security configuration
 * - Documentation setup
 * - Performance optimizations
 * 
 * Educational Notes:
 * - NestFactory.create() creates the application instance
 * - app.use() registers Express middleware
 * - app.useGlobalPipes() applies validation globally
 * - app.useGlobalFilters() handles exceptions globally
 * - app.useGlobalInterceptors() transforms responses globally
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  // Create NestJS application instance
  // Educational: NestFactory.create() is the entry point for all NestJS applications
  const app = await NestFactory.create(AppModule, {
    // Enable detailed logging for educational purposes
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get configuration service for environment-specific settings
  // Educational: ConfigService provides type-safe access to configuration
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Security middleware setup
  // Educational: Helmet sets various HTTP headers for security
  app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
  }));

  // Performance middleware
  // Educational: Compression reduces response size for better performance
  app.use(compression());

  // Global API prefix
  // Educational: setGlobalPrefix() adds a prefix to all routes
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  // Educational: ValidationPipe automatically validates DTOs using class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      // Transform plain objects to class instances
      transform: true,
      // Strip properties that don't have decorators
      whitelist: true,
      // Throw error if non-whitelisted properties are present
      forbidNonWhitelisted: true,
      // Transform primitive types (string to number, etc.)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation setup (development only)
  // Educational: SwaggerModule generates OpenAPI documentation
  if (nodeEnv === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Comprehensive NestJS Learning Platform')
      .setDescription('A complete educational resource demonstrating all NestJS concepts')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Users', 'User management operations')
      .addTag('Projects', 'Project management operations')
      .addTag('Tasks', 'Task management operations')
      .addTag('Categories', 'Category management operations')
      .addTag('Comments', 'Comment management operations')
      .addTag('Files', 'File upload and management operations')
      .addTag('Analytics', 'GraphQL analytics and reporting')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    Logger.log(`📚 API Documentation available at http://localhost:${port}/api/docs`, 'Bootstrap');
  }

  // Enable CORS for development
  // Educational: CORS allows cross-origin requests from frontend applications
  if (nodeEnv === 'development') {
    app.enableCors({
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    });
  }

  // Start the application
  await app.listen(port);
  
  Logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`, 'Bootstrap');
  Logger.log(`📊 Health check available at: http://localhost:${port}/api/v1/health`, 'Bootstrap');
  
  if (nodeEnv === 'development') {
    Logger.log(`🔍 GraphQL Playground: http://localhost:${port}/graphql`, 'Bootstrap');
  }
}

// Handle unhandled promise rejections
// Educational: Proper error handling prevents application crashes
process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();