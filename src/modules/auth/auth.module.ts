/**
 * Authentication Module - Multi-Strategy Authentication System
 * 
 * This module demonstrates:
 * - Multiple authentication strategies (Local, JWT, OAuth2, API Key)
 * - Passport.js integration with NestJS
 * - JWT token management with refresh tokens
 * - OAuth2 integration with Google
 * - API key authentication for service-to-service calls
 * - Two-factor authentication (2FA) with TOTP
 * - Session-based authentication
 * - Authentication guards and decorators
 * - Password hashing and validation
 * - Token blacklisting and revocation
 * 
 * Educational Notes:
 * - Authentication verifies "who you are"
 * - Multiple strategies provide flexibility for different use cases
 * - JWT tokens are stateless and scalable
 * - OAuth2 allows integration with external providers
 * - API keys are useful for service-to-service authentication
 * - 2FA adds an extra layer of security
 * - Proper error handling prevents information leakage
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';

// Strategies
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { ApiKeyStrategy } from './strategies/api-key.strategy';

// Guards
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { TwoFactorGuard } from './guards/two-factor.guard';

// Entities
import { User } from '../../entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { ApiKey } from './entities/api-key.entity';

// Other modules
import { UsersModule } from '../users/users.module';

/**
 * Authentication Module Configuration
 * 
 * Educational: This module demonstrates how to set up a comprehensive
 * authentication system with multiple strategies and proper configuration.
 */
@Module({
  imports: [
    // Import ConfigModule to access environment variables
    ConfigModule,
    
    // Import PassportModule with default strategy
    PassportModule.register({ 
      defaultStrategy: 'jwt',
      session: false, // We'll use JWT tokens instead of sessions for most auth
    }),
    
    // Configure JWT module with async configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
          issuer: configService.get<string>('JWT_ISSUER', 'nestjs-learning-platform'),
          audience: configService.get<string>('JWT_AUDIENCE', 'nestjs-learning-platform'),
        },
      }),
      inject: [ConfigService],
    }),
    
    // Import TypeORM entities for authentication
    TypeOrmModule.forFeature([
      User,
      RefreshToken,
      ApiKey,
    ]),
    
    // Import Users module for user management
    UsersModule,
  ],
  
  controllers: [
    AuthController,
  ],
  
  providers: [
    // Core services
    AuthService,
    TokenService,
    TwoFactorService,
    
    // Authentication strategies
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    ApiKeyStrategy,
    
    // Authentication guards
    LocalAuthGuard,
    JwtAuthGuard,
    JwtRefreshGuard,
    GoogleAuthGuard,
    ApiKeyGuard,
    TwoFactorGuard,
  ],
  
  exports: [
    // Export services for use in other modules
    AuthService,
    TokenService,
    TwoFactorService,
    
    // Export guards for use in other modules
    JwtAuthGuard,
    LocalAuthGuard,
    ApiKeyGuard,
    TwoFactorGuard,
    
    // Export JWT module for token operations
    JwtModule,
  ],
})
export class AuthModule {}