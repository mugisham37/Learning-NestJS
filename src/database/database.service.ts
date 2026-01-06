/**
 * Database Service - Connection Management and Health Monitoring
 * 
 * This service demonstrates:
 * - Database connection management
 * - Health monitoring and diagnostics
 * - Connection pooling statistics
 * - Transaction management helpers
 * - Query performance monitoring
 * 
 * Educational Notes:
 * - Services provide business logic for database operations
 * - Health checks are essential for production monitoring
 * - Connection pooling statistics help with performance tuning
 * - Transaction helpers ensure data consistency
 * - Performance monitoring identifies slow queries
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Database Health Status Interface
 * 
 * Educational: Type-safe interfaces for health monitoring
 * provide clear contracts and better error handling.
 */
export interface DatabaseHealthStatus {
  isConnected: boolean;
  connectionName: string;
  database: string;
  host: string;
  port: number;
  poolSize: number;
  activeConnections: number;
  idleConnections: number;
  responseTime: number;
  lastError?: string;
  uptime: number;
}

/**
 * Query Performance Statistics
 * 
 * Educational: Performance monitoring helps identify
 * bottlenecks and optimize database operations.
 */
export interface QueryPerformanceStats {
  totalQueries: number;
  averageResponseTime: number;
  slowQueries: number;
  failedQueries: number;
  lastSlowQuery?: {
    query: string;
    duration: number;
    timestamp: Date;
  };
}

/**
 * Transaction Options
 * 
 * Educational: Transaction configuration options
 * for different isolation levels and behaviors.
 */
export interface TransactionOptions {
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
  timeout?: number;
  readOnly?: boolean;
}

/**
 * Database Service
 * 
 * Educational: This service provides high-level database operations,
 * health monitoring, and connection management functionality.
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private startTime: Date;
  private queryStats: QueryPerformanceStats = {
    totalQueries: 0,
    averageResponseTime: 0,
    slowQueries: 0,
    failedQueries: 0,
  };

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.startTime = new Date();
    this.setupQueryLogging();
  }

  /**
   * Module Initialization
   * 
   * Educational: OnModuleInit lifecycle hook allows initialization
   * logic to run after dependency injection is complete.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Database service initializing...');
    
    try {
      await this.checkConnection();
      this.logger.log('Database service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database service:', error);
      throw error;
    }
  }

  /**
   * Module Destruction
   * 
   * Educational: OnModuleDestroy lifecycle hook ensures proper
   * cleanup when the application shuts down.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Database service shutting down...');
    
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy();
        this.logger.log('Database connections closed successfully');
      }
    } catch (error) {
      this.logger.error('Error during database service shutdown:', error);
    }
  }

  /**
   * Check Database Connection Health
   * 
   * Educational: Health checks are essential for monitoring
   * and ensuring database availability in production.
   */
  async checkConnection(): Promise<DatabaseHealthStatus> {
    const startTime = Date.now();
    
    try {
      // Test connection with simple query
      await this.dataSource.query('SELECT 1 as health_check');
      const responseTime = Date.now() - startTime;
      
      // Get connection pool statistics
      const poolStats = this.getConnectionPoolStats();
      
      const healthStatus: DatabaseHealthStatus = {
        isConnected: true,
        connectionName: this.dataSource.options.name || 'default',
        database: this.dataSource.options.database as string,
        host: this.dataSource.options.host as string,
        port: this.dataSource.options.port as number,
        poolSize: poolStats.max,
        activeConnections: poolStats.active,
        idleConnections: poolStats.idle,
        responseTime,
        uptime: Date.now() - this.startTime.getTime(),
      };
      
      this.logger.debug(`Database health check passed in ${responseTime}ms`);
      return healthStatus;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const healthStatus: DatabaseHealthStatus = {
        isConnected: false,
        connectionName: this.dataSource.options.name || 'default',
        database: this.dataSource.options.database as string,
        host: this.dataSource.options.host as string,
        port: this.dataSource.options.port as number,
        poolSize: 0,
        activeConnections: 0,
        idleConnections: 0,
        responseTime,
        lastError: error.message,
        uptime: Date.now() - this.startTime.getTime(),
      };
      
      this.logger.error(`Database health check failed: ${error.message}`);
      return healthStatus;
    }
  }

  /**
   * Get Connection Pool Statistics
   * 
   * Educational: Connection pool monitoring helps optimize
   * performance and identify connection leaks.
   */
  private getConnectionPoolStats(): { max: number; active: number; idle: number } {
    try {
      // TypeORM doesn't expose pool stats directly, so we estimate
      const options = this.dataSource.options;
      const extra = (options as any).extra || {};
      
      return {
        max: extra.max || 10,
        active: 0, // Would need custom implementation to track
        idle: 0,   // Would need custom implementation to track
      };
    } catch (error) {
      this.logger.warn('Could not retrieve connection pool stats:', error.message);
      return { max: 0, active: 0, idle: 0 };
    }
  }

  /**
   * Execute Query with Performance Monitoring
   * 
   * Educational: Query monitoring helps identify performance
   * bottlenecks and optimize database operations.
   */
  async executeQuery<T = any>(
    query: string,
    parameters?: any[],
    timeout?: number
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Set query timeout if specified
      if (timeout) {
        await this.dataSource.query('SET statement_timeout = $1', [timeout]);
      }
      
      const result = await this.dataSource.query(query, parameters);
      const duration = Date.now() - startTime;
      
      // Update statistics
      this.updateQueryStats(duration, false);
      
      // Log slow queries
      const slowQueryThreshold = this.configService.get('database.slowQueryThreshold', 1000);
      if (duration > slowQueryThreshold) {
        this.logger.warn(`Slow query detected (${duration}ms): ${query.substring(0, 100)}...`);
        this.queryStats.lastSlowQuery = {
          query: query.substring(0, 200),
          duration,
          timestamp: new Date(),
        };
      }
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateQueryStats(duration, true);
      
      this.logger.error(`Query failed after ${duration}ms: ${error.message}`);
      throw error;
      
    } finally {
      // Reset timeout
      if (timeout) {
        await this.dataSource.query('SET statement_timeout = DEFAULT');
      }
    }
  }

  /**
   * Execute Transaction with Helper
   * 
   * Educational: Transaction helpers ensure data consistency
   * and provide a clean API for complex operations.
   */
  async executeTransaction<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      
      // Set isolation level if specified
      if (options.isolationLevel) {
        await queryRunner.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
      }
      
      // Set read-only mode if specified
      if (options.readOnly) {
        await queryRunner.query('SET TRANSACTION READ ONLY');
      }
      
      // Set timeout if specified
      if (options.timeout) {
        await queryRunner.query('SET statement_timeout = $1', [options.timeout]);
      }
      
      await queryRunner.startTransaction();
      
      const result = await operation(queryRunner);
      
      await queryRunner.commitTransaction();
      
      this.logger.debug('Transaction completed successfully');
      return result;
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Transaction rolled back due to error:', error.message);
      throw error;
      
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get Query Performance Statistics
   * 
   * Educational: Performance statistics help monitor
   * and optimize database operations over time.
   */
  getQueryStats(): QueryPerformanceStats {
    return { ...this.queryStats };
  }

  /**
   * Reset Query Statistics
   * 
   * Educational: Resetting statistics is useful for
   * monitoring specific time periods or after deployments.
   */
  resetQueryStats(): void {
    this.queryStats = {
      totalQueries: 0,
      averageResponseTime: 0,
      slowQueries: 0,
      failedQueries: 0,
    };
    this.logger.log('Query statistics reset');
  }

  /**
   * Setup Query Logging
   * 
   * Educational: Query logging helps with debugging
   * and performance monitoring in development.
   */
  private setupQueryLogging(): void {
    if (this.configService.get('database.logging', false)) {
      // Custom query logging would be implemented here
      // TypeORM has built-in logging, but this shows how to add custom logic
      this.logger.log('Query logging enabled');
    }
  }

  /**
   * Update Query Statistics
   * 
   * Educational: Statistics tracking helps monitor
   * database performance and identify trends.
   */
  private updateQueryStats(duration: number, failed: boolean): void {
    this.queryStats.totalQueries++;
    
    if (failed) {
      this.queryStats.failedQueries++;
    } else {
      // Update average response time
      const totalTime = this.queryStats.averageResponseTime * (this.queryStats.totalQueries - 1);
      this.queryStats.averageResponseTime = (totalTime + duration) / this.queryStats.totalQueries;
      
      // Check if it's a slow query
      const slowQueryThreshold = this.configService.get('database.slowQueryThreshold', 1000);
      if (duration > slowQueryThreshold) {
        this.queryStats.slowQueries++;
      }
    }
  }

  /**
   * Get Database Information
   * 
   * Educational: Database information is useful for
   * debugging and system monitoring.
   */
  async getDatabaseInfo(): Promise<{
    version: string;
    size: string;
    tableCount: number;
    connectionCount: number;
  }> {
    try {
      const [versionResult] = await this.dataSource.query('SELECT version()');
      const [sizeResult] = await this.dataSource.query(`
        SELECT pg_size_pretty(pg_database_size($1)) as size
      `, [this.dataSource.options.database]);
      
      const [tableCountResult] = await this.dataSource.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const [connectionCountResult] = await this.dataSource.query(`
        SELECT COUNT(*) as count 
        FROM pg_stat_activity 
        WHERE datname = $1
      `, [this.dataSource.options.database]);
      
      return {
        version: versionResult.version,
        size: sizeResult.size,
        tableCount: parseInt(tableCountResult.count),
        connectionCount: parseInt(connectionCountResult.count),
      };
      
    } catch (error) {
      this.logger.error('Failed to get database info:', error.message);
      throw error;
    }
  }

  /**
   * Vacuum Database (PostgreSQL specific)
   * 
   * Educational: Database maintenance operations
   * are important for performance in production.
   */
  async vacuumDatabase(analyze: boolean = true): Promise<void> {
    try {
      const command = analyze ? 'VACUUM ANALYZE' : 'VACUUM';
      await this.dataSource.query(command);
      this.logger.log(`Database vacuum ${analyze ? 'with analyze' : ''} completed`);
    } catch (error) {
      this.logger.error('Database vacuum failed:', error.message);
      throw error;
    }
  }
}