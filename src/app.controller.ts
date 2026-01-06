/**
 * Root Application Controller
 * 
 * This controller demonstrates:
 * - Basic controller structure
 * - Route handling
 * - Dependency injection
 * - API documentation with Swagger
 * 
 * Educational Notes:
 * - @Controller() decorator defines a controller
 * - @Get() decorator defines a GET route handler
 * - Constructor injection is the preferred DI pattern
 * - @ApiTags() groups endpoints in Swagger documentation
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Application')
@Controller()
export class AppController {
  /**
   * Educational: Constructor Injection
   * 
   * This is the primary dependency injection pattern in NestJS.
   * The AppService is automatically injected by the NestJS IoC container.
   * The 'private readonly' pattern is a TypeScript shorthand that:
   * 1. Declares a private property
   * 2. Makes it readonly (immutable)
   * 3. Assigns the injected value to the property
   */
  constructor(private readonly appService: AppService) {}

  /**
   * Root endpoint - provides basic application information
   * 
   * Educational: Route Handler Decorators
   * - @Get() creates a GET endpoint at the controller's base path
   * - @ApiOperation() documents the endpoint purpose
   * - @ApiResponse() documents possible responses
   */
  @Get()
  @ApiOperation({ 
    summary: 'Get application information',
    description: 'Returns basic information about the NestJS Learning Platform'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Application information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        version: { type: 'string' },
        environment: { type: 'string' },
        timestamp: { type: 'string' },
        features: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  getApplicationInfo() {
    return this.appService.getApplicationInfo();
  }

  /**
   * Health check endpoint
   * 
   * Educational: Multiple Route Handlers
   * Controllers can have multiple route handlers for different endpoints.
   * Each handler can have its own HTTP method, path, and documentation.
   */
  @Get('health')
  @ApiOperation({ 
    summary: 'Health check endpoint',
    description: 'Returns application health status for monitoring systems'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Application is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string' },
        uptime: { type: 'number' }
      }
    }
  })
  getHealth() {
    return this.appService.getHealthStatus();
  }
}