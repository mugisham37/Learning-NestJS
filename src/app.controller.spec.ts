/**
 * Unit Tests for AppController
 * 
 * This test file demonstrates:
 * - Unit testing setup with NestJS Testing utilities
 * - Service mocking and dependency injection in tests
 * - Controller testing patterns
 * - Test isolation and setup/teardown
 * 
 * Educational Notes:
 * - Unit tests focus on testing individual components in isolation
 * - Test.createTestingModule() creates a testing module with mocked dependencies
 * - Mocking prevents external dependencies from affecting test results
 * - Each test should be independent and not rely on other tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    // Create testing module with mocked dependencies
    // Educational: Test.createTestingModule() creates an isolated testing environment
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          // Mock ConfigService for testing
          // Educational: Mocking prevents tests from depending on actual configuration
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                NODE_ENV: 'test',
                npm_package_version: '1.0.0-test',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    // Get controller and service instances from the testing module
    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('getApplicationInfo', () => {
    it('should return application information', () => {
      // Arrange
      const expectedResult = {
        message: 'Welcome to the Comprehensive NestJS Learning Platform!',
        version: '1.0.0-test',
        environment: 'test',
        features: expect.any(Array),
        documentation: expect.any(Object),
        learningObjectives: expect.any(Array),
      };

      // Act
      const result = appController.getApplicationInfo();

      // Assert
      expect(result).toMatchObject(expectedResult);
      expect(result.features).toContain('Module Architecture & Dependency Injection');
      expect(result.features).toContain('Request Processing Pipeline (Middleware, Guards, Interceptors, Pipes, Filters)');
      expect(result.timestamp).toBeDefined();
    });

    it('should call appService.getApplicationInfo', () => {
      // Arrange
      const spy = jest.spyOn(appService, 'getApplicationInfo');

      // Act
      appController.getApplicationInfo();

      // Assert
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      // Arrange
      const expectedResult = {
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: expect.any(Object),
        environment: 'test',
        nodeVersion: expect.any(String),
      };

      // Act
      const result = appController.getHealth();

      // Assert
      expect(result).toMatchObject(expectedResult);
      expect(result.memory).toHaveProperty('used');
      expect(result.memory).toHaveProperty('total');
      expect(result.memory).toHaveProperty('external');
    });

    it('should call appService.getHealthStatus', () => {
      // Arrange
      const spy = jest.spyOn(appService, 'getHealthStatus');

      // Act
      appController.getHealth();

      // Assert
      expect(spy).toHaveBeenCalled();
    });
  });
});