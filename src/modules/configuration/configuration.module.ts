/**
 * Configuration Module
 * 
 * This module demonstrates:
 * - Dynamic module patterns (forRoot, forRootAsync, forFeature)
 * - Configuration service creation and injection
 * - Type-safe configuration access
 * - Configuration validation and transformation
 * - Module configuration options
 * 
 * Educational Notes:
 * - Dynamic modules allow runtime configuration of module behavior
 * - forRoot() pattern is used for singleton configuration (root module)
 * - forRootAsync() pattern allows async configuration loading
 * - forFeature() pattern is used for feature-specific configuration
 * - Configuration modules should be global to avoid repeated imports
 */

import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigurationService } from './configuration.service';
import { 
  configuration, 
  appConfig, 
  databaseConfig, 
  jwtConfig, 
  redisConfig 
} from '../../config/configuration';
import { getValidationSchema } from '../../config/validation.schema';

/**
 * Configuration Module Options Interface
 * 
 * Educational: Interfaces define the contract for module configuration options.
 * This allows consumers to configure the module behavior at import time.
 */
export interface ConfigurationModuleOptions {
  /**
   * Whether to make configuration global
   * Educational: Global modules are imported once and available everywhere
   */
  isGlobal?: boolean;
  
  /**
   * Whether to validate configuration
   * Educational: Validation ensures configuration correctness at startup
   */
  validate?: boolean;
  
  /**
   * Whether to cache configuration
   * Educational: Caching improves performance by avoiding repeated parsing
   */
  cache?: boolean;
  
  /**
   * Custom configuration loaders
   * Educational: Allows loading configuration from different sources
   */
  load?: Array<() => Record<string, any>>;
  
  /**
   * Environment file paths
   * Educational: Allows loading from different .env files
   */
  envFilePath?: string | string[];
  
  /**
   * Whether to expand environment variables
   * Educational: Allows variable substitution like ${HOME}/app
   */
  expandVariables?: boolean;
}

/**
 * Async Configuration Module Options Interface
 * 
 * Educational: Async options allow configuration to be loaded from
 * external sources like databases, APIs, or configuration services.
 */
export interface ConfigurationModuleAsyncOptions {
  isGlobal?: boolean;
  imports?: any[];
  useFactory?: (...args: any[]) => Promise<ConfigurationModuleOptions> | ConfigurationModuleOptions;
  inject?: any[];
  useClass?: any;
  useExisting?: any;
}

/**
 * Feature Configuration Options Interface
 * 
 * Educational: Feature-specific configuration allows modules to
 * register their own configuration namespaces.
 */
export interface ConfigurationFeatureOptions {
  /**
   * Configuration namespace
   * Educational: Namespaces prevent configuration key conflicts
   */
  namespace: string;
  
  /**
   * Configuration factory function
   * Educational: Factory functions load and transform configuration
   */
  load: () => Record<string, any>;
  
  /**
   * Whether this feature configuration is global
   */
  isGlobal?: boolean;
}

@Global()
@Module({})
export class ConfigurationModule {
  /**
   * Configure module with synchronous options
   * 
   * Educational: forRoot() is the standard pattern for configuring
   * modules that should be singletons (imported once in the root module).
   * 
   * @param options Configuration options
   * @returns Dynamic module configuration
   */
  static forRoot(options: ConfigurationModuleOptions = {}): DynamicModule {
    const {
      isGlobal = true,
      validate = true,
      cache = true,
      load = [configuration],
      envFilePath = ['.env', '.env.local'],
      expandVariables = true,
    } = options;

    return {
      module: ConfigurationModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal,
          cache,
          load,
          envFilePath,
          expandVariables,
          validationSchema: validate ? getValidationSchema() : undefined,
          validationOptions: {
            allowUnknown: true,
            abortEarly: false,
          },
        }),
      ],
      providers: [
        ConfigurationService,
        {
          provide: 'CONFIGURATION_OPTIONS',
          useValue: options,
        },
      ],
      exports: [ConfigurationService, ConfigService],
      global: isGlobal,
    };
  }

  /**
   * Configure module with asynchronous options
   * 
   * Educational: forRootAsync() allows configuration to be loaded
   * asynchronously, which is useful when configuration comes from
   * external sources like databases or remote configuration services.
   * 
   * @param options Async configuration options
   * @returns Dynamic module configuration
   */
  static forRootAsync(options: ConfigurationModuleAsyncOptions): DynamicModule {
    const { isGlobal = true, imports = [], useFactory, inject = [] } = options;

    return {
      module: ConfigurationModule,
      imports: [
        ...imports,
        ConfigModule.forRootAsync({
          isGlobal,
          imports,
          useFactory: async (...args: any[]) => {
            // Get configuration options from factory
            const configOptions = useFactory ? await useFactory(...args) : {};
            
            const {
              validate = true,
              cache = true,
              load = [configuration],
              envFilePath = ['.env', '.env.local'],
              expandVariables = true,
            } = configOptions;

            return {
              cache,
              load,
              envFilePath,
              expandVariables,
              validationSchema: validate ? getValidationSchema() : undefined,
              validationOptions: {
                allowUnknown: true,
                abortEarly: false,
              },
            };
          },
          inject,
        }),
      ],
      providers: [
        ConfigurationService,
        {
          provide: 'CONFIGURATION_OPTIONS',
          useFactory: useFactory || (() => ({})),
          inject,
        },
      ],
      exports: [ConfigurationService, ConfigService],
      global: isGlobal,
    };
  }

  /**
   * Register feature-specific configuration
   * 
   * Educational: forFeature() allows individual modules to register
   * their own configuration namespaces. This is useful for feature
   * modules that need their own configuration without affecting
   * the global configuration.
   * 
   * @param options Feature configuration options
   * @returns Dynamic module configuration
   */
  static forFeature(options: ConfigurationFeatureOptions): DynamicModule {
    const { namespace, load, isGlobal = false } = options;

    return {
      module: ConfigurationModule,
      imports: [
        ConfigModule.forFeature(load),
      ],
      providers: [
        {
          provide: `CONFIGURATION_${namespace.toUpperCase()}_OPTIONS`,
          useValue: options,
        },
      ],
      exports: [
        `CONFIGURATION_${namespace.toUpperCase()}_OPTIONS`,
      ],
      global: isGlobal,
    };
  }

  /**
   * Register multiple namespaced configurations
   * 
   * Educational: This method demonstrates how to register multiple
   * configuration namespaces at once, which is useful for modules
   * that need access to multiple configuration sections.
   * 
   * @param configs Array of configuration registrations
   * @returns Dynamic module configuration
   */
  static forFeatures(configs: ConfigurationFeatureOptions[]): DynamicModule {
    const imports = configs.map(config => ConfigModule.forFeature(config.load));
    const providers = configs.map(config => ({
      provide: `CONFIGURATION_${config.namespace.toUpperCase()}_OPTIONS`,
      useValue: config,
    }));
    const exports = configs.map(config => 
      `CONFIGURATION_${config.namespace.toUpperCase()}_OPTIONS`
    );

    return {
      module: ConfigurationModule,
      imports,
      providers,
      exports,
    };
  }

  /**
   * Create a pre-configured module for common use cases
   * 
   * Educational: This method demonstrates how to create convenience
   * methods that pre-configure modules for common scenarios.
   * 
   * @returns Pre-configured dynamic module
   */
  static forApplication(): DynamicModule {
    return this.forRoot({
      isGlobal: true,
      validate: true,
      cache: true,
      load: [
        configuration,
        appConfig,
        databaseConfig,
        jwtConfig,
        redisConfig,
      ],
      envFilePath: ['.env', '.env.local', '.env.development'],
      expandVariables: true,
    });
  }

  /**
   * Create a testing-specific configuration
   * 
   * Educational: Testing configurations often need different settings
   * than production configurations (e.g., in-memory databases, mock services).
   * 
   * @returns Testing-configured dynamic module
   */
  static forTesting(): DynamicModule {
    return this.forRoot({
      isGlobal: true,
      validate: false, // Skip validation in tests for flexibility
      cache: false, // Disable caching in tests for isolation
      load: [configuration],
      envFilePath: ['.env.test', '.env'],
      expandVariables: true,
    });
  }
}