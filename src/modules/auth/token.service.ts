/**
 * Token Service - JWT Token Management
 * 
 * This service demonstrates:
 * - JWT token generation and validation
 * - Access token and refresh token management
 * - Token payload structure and claims
 * - Token expiration and renewal
 * - Security features (token blacklisting, rotation)
 * - Two-factor authentication tokens
 * - Custom token types and scopes
 * 
 * Educational Notes:
 * - JWT tokens are stateless and contain encoded information
 * - Access tokens should have short expiration times
 * - Refresh tokens should be stored securely and have longer lifespans
 * - Token rotation improves security by limiting token reuse
 * - Custom claims can carry additional user information
 * - Always validate token signatures and expiration
 */

import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';

/**
 * JWT Payload Interface
 * 
 * Educational: Define the structure of JWT token payloads
 * to ensure consistency and type safety.
 */
export interface JwtPayload {
  sub: string; // Subject (user ID)
  email: string;
  username: string;
  role: string;
  iat?: number; // Issued at
  exp?: number; // Expires at
  aud?: string; // Audience
  iss?: string; // Issuer
  jti?: string; // JWT ID (for token tracking)
  type?: 'access' | 'refresh' | '2fa' | 'email_verification' | 'password_reset';
  scopes?: string[]; // Token scopes/permissions
  deviceId?: string; // Device identifier
  sessionId?: string; // Session identifier
}

/**
 * Two-Factor Token Payload
 * 
 * Educational: Specialized payload for 2FA tokens.
 */
export interface TwoFactorTokenPayload {
  sub: string;
  type: '2fa';
  iat?: number;
  exp?: number;
  step: 'pending' | 'verified';
}

/**
 * Token Service
 * 
 * Educational: Centralized service for all token-related operations.
 * This service handles JWT generation, validation, and management.
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  // ==========================================
  // Access Token Management
  // ==========================================

  /**
   * Generate Access Token
   * 
   * Educational: Generate a short-lived access token for API authentication.
   * Access tokens should contain minimal information and have short expiration times.
   */
  async generateAccessToken(user: User, options?: {
    scopes?: string[];
    deviceId?: string;
    sessionId?: string;
  }): Promise<string> {
    try {
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        type: 'access',
        scopes: options?.scopes || this.getDefaultScopes(user.role),
        deviceId: options?.deviceId,
        sessionId: options?.sessionId,
        jti: this.generateJti(), // Unique token identifier
      };

      const token = await this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m'),
        issuer: this.configService.get<string>('JWT_ISSUER', 'nestjs-learning-platform'),
        audience: this.configService.get<string>('JWT_AUDIENCE', 'nestjs-learning-platform'),
      });

      this.logger.debug(`Access token generated for user: ${user.id}`);
      return token;
    } catch (error) {
      this.logger.error(`Error generating access token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate Access Token
   * 
   * Educational: Validate and decode an access token.
   * This method is used by the JWT strategy.
   */
  async validateAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        issuer: this.configService.get<string>('JWT_ISSUER'),
        audience: this.configService.get<string>('JWT_AUDIENCE'),
      });

      // Verify token type
      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Additional validation can be added here
      // e.g., check if token is blacklisted, validate scopes, etc.

      this.logger.debug(`Access token validated for user: ${payload.sub}`);
      return payload;
    } catch (error) {
      this.logger.warn(`Access token validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  // ==========================================
  // Refresh Token Management
  // ==========================================

  /**
   * Generate Refresh Token
   * 
   * Educational: Generate a cryptographically secure refresh token.
   * Refresh tokens are stored in the database and used to generate new access tokens.
   */
  async generateRefreshToken(): Promise<string> {
    try {
      const crypto = require('crypto');
      const token = crypto.randomBytes(64).toString('hex');
      
      this.logger.debug('Refresh token generated');
      return token;
    } catch (error) {
      this.logger.error(`Error generating refresh token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate Refresh Token
   * 
   * Educational: Validate a refresh token against the database.
   */
  async validateRefreshToken(token: string): Promise<RefreshToken | null> {
    try {
      const refreshToken = await this.refreshTokenRepository.findOne({
        where: { token },
        relations: ['user'],
      });

      if (!refreshToken || !refreshToken.canBeUsed()) {
        this.logger.warn('Invalid or expired refresh token used');
        return null;
      }

      this.logger.debug(`Refresh token validated for user: ${refreshToken.user.id}`);
      return refreshToken;
    } catch (error) {
      this.logger.error(`Error validating refresh token: ${error.message}`, error.stack);
      return null;
    }
  }

  // ==========================================
  // Two-Factor Authentication Tokens
  // ==========================================

  /**
   * Generate Two-Factor Token
   * 
   * Educational: Generate a temporary token for 2FA verification.
   * These tokens are short-lived and used to complete the 2FA process.
   */
  async generateTwoFactorToken(userId: string): Promise<string> {
    try {
      const payload: TwoFactorTokenPayload = {
        sub: userId,
        type: '2fa',
        step: 'pending',
      };

      const token = await this.jwtService.signAsync(payload, {
        expiresIn: '5m', // 5 minutes for 2FA completion
        issuer: this.configService.get<string>('JWT_ISSUER'),
        audience: this.configService.get<string>('JWT_AUDIENCE'),
      });

      this.logger.debug(`2FA token generated for user: ${userId}`);
      return token;
    } catch (error) {
      this.logger.error(`Error generating 2FA token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify Two-Factor Token
   * 
   * Educational: Verify a 2FA token and return the user ID.
   */
  async verifyTwoFactorToken(token: string): Promise<string> {
    try {
      const payload = await this.jwtService.verifyAsync<TwoFactorTokenPayload>(token, {
        issuer: this.configService.get<string>('JWT_ISSUER'),
        audience: this.configService.get<string>('JWT_AUDIENCE'),
      });

      if (payload.type !== '2fa') {
        throw new UnauthorizedException('Invalid token type');
      }

      this.logger.debug(`2FA token verified for user: ${payload.sub}`);
      return payload.sub;
    } catch (error) {
      this.logger.warn(`2FA token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired two-factor token');
    }
  }

  // ==========================================
  // Email Verification Tokens
  // ==========================================

  /**
   * Generate Email Verification Token
   * 
   * Educational: Generate a token for email verification.
   */
  async generateEmailVerificationToken(userId: string, email: string): Promise<string> {
    try {
      const payload: JwtPayload = {
        sub: userId,
        email,
        username: '', // Not needed for email verification
        role: '', // Not needed for email verification
        type: 'email_verification',
      };

      const token = await this.jwtService.signAsync(payload, {
        expiresIn: '24h', // 24 hours for email verification
        issuer: this.configService.get<string>('JWT_ISSUER'),
        audience: this.configService.get<string>('JWT_AUDIENCE'),
      });

      this.logger.debug(`Email verification token generated for user: ${userId}`);
      return token;
    } catch (error) {
      this.logger.error(`Error generating email verification token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify Email Verification Token
   */
  async verifyEmailVerificationToken(token: string): Promise<{ userId: string; email: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        issuer: this.configService.get<string>('JWT_ISSUER'),
        audience: this.configService.get<string>('JWT_AUDIENCE'),
      });

      if (payload.type !== 'email_verification') {
        throw new UnauthorizedException('Invalid token type');
      }

      this.logger.debug(`Email verification token verified for user: ${payload.sub}`);
      return { userId: payload.sub, email: payload.email };
    } catch (error) {
      this.logger.warn(`Email verification token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired email verification token');
    }
  }

  // ==========================================
  // Password Reset Tokens
  // ==========================================

  /**
   * Generate Password Reset Token
   */
  async generatePasswordResetToken(userId: string, email: string): Promise<string> {
    try {
      const payload: JwtPayload = {
        sub: userId,
        email,
        username: '', // Not needed for password reset
        role: '', // Not needed for password reset
        type: 'password_reset',
      };

      const token = await this.jwtService.signAsync(payload, {
        expiresIn: '1h', // 1 hour for password reset
        issuer: this.configService.get<string>('JWT_ISSUER'),
        audience: this.configService.get<string>('JWT_AUDIENCE'),
      });

      this.logger.debug(`Password reset token generated for user: ${userId}`);
      return token;
    } catch (error) {
      this.logger.error(`Error generating password reset token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify Password Reset Token
   */
  async verifyPasswordResetToken(token: string): Promise<{ userId: string; email: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        issuer: this.configService.get<string>('JWT_ISSUER'),
        audience: this.configService.get<string>('JWT_AUDIENCE'),
      });

      if (payload.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid token type');
      }

      this.logger.debug(`Password reset token verified for user: ${payload.sub}`);
      return { userId: payload.sub, email: payload.email };
    } catch (error) {
      this.logger.warn(`Password reset token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired password reset token');
    }
  }

  // ==========================================
  // Token Utilities
  // ==========================================

  /**
   * Decode Token Without Verification
   * 
   * Educational: Decode a token to inspect its payload without verifying the signature.
   * Useful for debugging and logging purposes.
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch (error) {
      this.logger.warn(`Error decoding token: ${error.message}`);
      return null;
    }
  }

  /**
   * Get Token Expiration
   * 
   * Educational: Extract expiration time from a token.
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return null;
      
      return new Date(payload.exp * 1000);
    } catch (error) {
      this.logger.warn(`Error getting token expiration: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if Token is Expired
   */
  isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    
    return expiration < new Date();
  }

  /**
   * Get Time Until Token Expires
   */
  getTimeUntilExpiration(token: string): number | null {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return null;
    
    const now = new Date();
    return Math.max(0, expiration.getTime() - now.getTime());
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  /**
   * Generate JWT ID
   * 
   * Educational: Generate a unique identifier for each token.
   * This can be used for token tracking and blacklisting.
   */
  private generateJti(): string {
    const crypto = require('crypto');
    return crypto.randomUUID();
  }

  /**
   * Get Default Scopes for User Role
   * 
   * Educational: Define default permissions based on user role.
   */
  private getDefaultScopes(role: string): string[] {
    switch (role) {
      case 'super_admin':
        return ['*']; // All permissions
      case 'admin':
        return [
          'users:read', 'users:write', 'users:delete',
          'projects:read', 'projects:write', 'projects:delete',
          'tasks:read', 'tasks:write', 'tasks:delete',
          'analytics:read', 'system:read'
        ];
      case 'moderator':
        return [
          'users:read',
          'projects:read', 'projects:write',
          'tasks:read', 'tasks:write',
          'comments:moderate'
        ];
      case 'user':
      default:
        return [
          'profile:read', 'profile:write',
          'projects:read', 'projects:write:own',
          'tasks:read', 'tasks:write:own',
          'comments:read', 'comments:write:own'
        ];
    }
  }

  /**
   * Validate Token Scopes
   * 
   * Educational: Check if a token has the required scopes for an operation.
   */
  validateTokenScopes(tokenPayload: JwtPayload, requiredScopes: string[]): boolean {
    if (!tokenPayload.scopes) return false;
    
    // Check for wildcard permission
    if (tokenPayload.scopes.includes('*')) return true;
    
    // Check if all required scopes are present
    return requiredScopes.every(scope => 
      tokenPayload.scopes!.some(tokenScope => 
        tokenScope === scope || 
        (scope.includes(':') && tokenScope === scope.split(':')[0] + ':*')
      )
    );
  }
}