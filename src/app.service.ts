/**
 * Root Application Service
 * 
 * This service demonstrates:
 * - Basic service structure
 * - Injectable decorator usage
 * - Business logic separation
 * - Configuration service integration
 * 
 * Educational Notes:
 * - @Injectable() decorator makes a class available for dependency injection
 * - Services contain business logic and are injected into controllers
 * - Services can inject other services (ConfigService in this case)
 * - Services should be stateless and focused on specific responsibilities
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  /**
   * Educational: Service Dependencies
   * 
   * Services can inject other services through constructor injection.
   * Here we inject ConfigService to access application configuration.
   * This demonstrates the dependency injection chain: Controller -> Service -> ConfigService
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get basic application information
   * 
   * Educational: Business Logic in Services
   * Controllers should be thin and delegate business logic to services.
   * This method demonstrates how services can combine data from multiple sources.
   */
  getApplicationInfo() {
    const environment = this.configService.get<string>('NODE_ENV', 'development');
    const version = this.configService.get<string>('npm_package_version', '1.0.0');

    return {
      message: 'Welcome to the Comprehensive NestJS Learning Platform!',
      description: 'This platform demonstrates every major NestJS concept, pattern, and technique.',
      version,
      environment,
      timestamp: new Date().toISOString(),
      features: [
        'Module Architecture & Dependency Injection',
        'Request Processing Pipeline (Middleware, Guards, Interceptors, Pipes, Filters)',
        'Controllers & Custom Decorators',
        'Multi-Database Integration (TypeORM, Mongoose, Prisma)',
        'Authentication & Authorization (JWT, OAuth2, RBAC)',
        'GraphQL Integration',
        'WebSocket Real-Time Communication',
        'Microservice Communication',
        'Background Processing & Scheduling',
        'Caching & Performance Optimization',
        'Comprehensive Testing (Unit, Integration, E2E, Property-Based)',
        'API Documentation & OpenAPI',
        'Logging & Monitoring',
        'Security Best Practices',
        'Advanced Patterns (CQRS, Event Sourcing, Domain Events)'
      ],
      documentation: {
        swagger: '/api/docs',
        graphql: '/graphql',
        health: '/api/v1/health'
      },
      learningObjectives: [
        'Understand NestJS architecture and design patterns',
        'Master dependency injection and module organization',
        'Implement secure authentication and authorization',
        'Build scalable APIs with proper validation and error handling',
        'Integrate multiple databases and caching strategies',
        'Create real-time features with WebSockets and GraphQL subscriptions',
        'Implement microservice communication patterns',
        'Apply testing best practices including property-based testing',
        'Optimize performance and implement monitoring',
        'Follow security best practices and avoid common pitfalls'
      ]
    };
  }

  /**
   * Get application health status
   * 
   * Educational: Health Check Implementation
   * Health checks are essential for production applications.
   * This simple implementation will be enhanced with @nestjs/terminus later.
   */
  getHealthStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      nodeVersion: process.version,
    };
  }
}