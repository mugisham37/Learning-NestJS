/**
 * Authentication Service - Core Authentication Logic
 * 
 * This service demonstrates:
 * - User authentication with multiple strategies
 * - Password validation and hashing
 * - JWT token generation and validation
 * - Refresh token management
 * - Two-factor authentication
 * - Account lockout and security features
 * - OAuth2 integration
 * - API key authentication
 * - Session management
 * - Security event logging
 * 
 * Educational Notes:
 * - Authentication services should be stateless when possible
 * - Always hash passwords using secure algorithms (bcrypt)
 * - Implement proper error handling to prevent information leakage
 * - Use rate limiting to prevent brute force attacks
 * - Log security events for monitoring and analysis
 * - Validate all inputs to prevent injection attacks
 */

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';

import { User, UserStatus } from '../../entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { ApiKey, ApiKeyStatus } from './entities/api-key.entity';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';
import { UsersService } from '../users/users.service';

// DTOs
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Enable2FADto } from './dto/enable-2fa.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';

// Response DTOs
import { AuthResponseDto } from './dto/auth-response.dto';
import { TokenPairDto } from './dto/token-pair.dto';

// Events
import { UserLoginEvent } from './events/user-login.event';
import { UserLogoutEvent } from './events/user-logout.event';
import { UserRegisteredEvent } from './events/user-registered.event';
import { PasswordChangedEvent } from './events/password-changed.event';
import { SecurityAlertEvent } from './events/security-alert.event';

/**
 * Authentication Service
 * 
 * Educational: This service handles all authentication-related operations
 * including login, registration, token management, and security features.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly twoFactorService: TwoFactorService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==========================================
  // User Authentication
  // ==========================================

  /**
   * Validate User Credentials
   * 
   * Educational: This method is used by the LocalStrategy
   * to validate username/password combinations.
   */
  async validateUser(username: string, password: string): Promise<User | null> {
    try {
      // Find user by username or email
      const user = await this.userRepository.findOne({
        where: [
          { username },
          { email: username },
        ],
      });

      if (!user) {
        this.logger.warn(`Login attempt with invalid username: ${username}`);
        return null;
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        this.logger.warn(`Login attempt on locked account: ${user.id}`);
        throw new UnauthorizedException('Account is temporarily locked due to too many failed login attempts');
      }

      // Check if account is active
      if (user.status !== UserStatus.ACTIVE) {
        this.logger.warn(`Login attempt on inactive account: ${user.id}`);
        throw new UnauthorizedException('Account is not active');
      }

      // Verify password
      const isPasswordValid = await user.verifyPassword(password);
      
      if (!isPasswordValid) {
        // Increment failed login attempts
        user.incrementFailedLoginAttempts();
        await this.userRepository.save(user);
        
        this.logger.warn(`Failed login attempt for user: ${user.id}`);
        
        // Emit security alert event
        this.eventEmitter.emit('security.alert', new SecurityAlertEvent(
          user.id,
          'failed_login',
          'Invalid password provided',
          { username }
        ));
        
        return null;
      }

      // Password is valid - reset failed attempts and return user
      user.incrementFailedLoginAttempts(); // This resets to 0 on successful login
      await this.userRepository.save(user);

      this.logger.log(`Successful password validation for user: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Error validating user credentials: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Login User
   * 
   * Educational: Complete login process with token generation
   * and security event logging.
   */
  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    try {
      const { username, password, rememberMe, deviceId, deviceName } = loginDto;

      // Validate user credentials
      const user = await this.validateUser(username, password);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if 2FA is enabled
      if (user.securitySettings?.twoFactorEnabled) {
        // Return partial response indicating 2FA is required
        return {
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresIn: 0,
          tokenType: 'Bearer',
          requiresTwoFactor: true,
          twoFactorToken: await this.tokenService.generateTwoFactorToken(user.id),
        };
      }

      // Generate tokens
      const tokenPair = await this.generateTokenPair(user, {
        rememberMe,
        deviceId,
        deviceName,
        ipAddress,
        userAgent,
      });

      // Update user login information
      user.updateLastLogin(ipAddress);
      await this.userRepository.save(user);

      // Emit login event
      this.eventEmitter.emit('user.login', new UserLoginEvent(
        user.id,
        ipAddress,
        userAgent,
        deviceId
      ));

      this.logger.log(`User logged in successfully: ${user.id}`);

      return {
        user,
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        tokenType: 'Bearer',
        requiresTwoFactor: false,
      };
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Complete Two-Factor Authentication
   * 
   * Educational: Complete login process after 2FA verification.
   */
  async completeTwoFactorLogin(
    twoFactorToken: string,
    totpCode: string,
    deviceInfo?: any
  ): Promise<AuthResponseDto> {
    try {
      // Verify 2FA token and get user
      const userId = await this.tokenService.verifyTwoFactorToken(twoFactorToken);
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        throw new UnauthorizedException('Invalid two-factor token');
      }

      // Verify TOTP code
      const isValidTotp = await this.twoFactorService.verifyTotp(user, totpCode);
      if (!isValidTotp) {
        this.logger.warn(`Invalid 2FA code for user: ${user.id}`);
        throw new UnauthorizedException('Invalid two-factor authentication code');
      }

      // Generate tokens
      const tokenPair = await this.generateTokenPair(user, deviceInfo);

      // Update user login information
      user.updateLastLogin(deviceInfo?.ipAddress);
      await this.userRepository.save(user);

      // Emit login event
      this.eventEmitter.emit('user.login', new UserLoginEvent(
        user.id,
        deviceInfo?.ipAddress,
        deviceInfo?.userAgent,
        deviceInfo?.deviceId
      ));

      this.logger.log(`User completed 2FA login successfully: ${user.id}`);

      return {
        user,
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        tokenType: 'Bearer',
        requiresTwoFactor: false,
      };
    } catch (error) {
      this.logger.error(`2FA login error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Register New User
   * 
   * Educational: User registration with validation and security features.
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    try {
      const { email, username, password, firstName, lastName } = registerDto;

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: [
          { email },
          { username },
        ],
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new ConflictException('Email address is already registered');
        }
        if (existingUser.username === username) {
          throw new ConflictException('Username is already taken');
        }
      }

      // Create new user
      const user = this.userRepository.create({
        email,
        username,
        firstName,
        lastName,
        status: UserStatus.PENDING, // Requires email verification
      });

      // Set password
      await user.setPassword(password);

      // Generate email verification token
      user.generateEmailVerificationToken();

      // Save user
      await this.userRepository.save(user);

      // Emit registration event
      this.eventEmitter.emit('user.registered', new UserRegisteredEvent(
        user.id,
        user.email,
        user.emailVerificationToken
      ));

      this.logger.log(`New user registered: ${user.id}`);

      // For demo purposes, we'll auto-verify and login
      // In production, you'd send an email verification
      user.verifyEmail();
      await this.userRepository.save(user);

      // Generate tokens
      const tokenPair = await this.generateTokenPair(user);

      return {
        user,
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        tokenType: 'Bearer',
        requiresTwoFactor: false,
      };
    } catch (error) {
      this.logger.error(`Registration error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Refresh Access Token
   * 
   * Educational: Generate new access token using refresh token.
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<TokenPairDto> {
    try {
      const { refreshToken } = refreshTokenDto;

      // Find and validate refresh token
      const tokenEntity = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken },
        relations: ['user'],
      });

      if (!tokenEntity || !tokenEntity.canBeUsed()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Mark token as used
      tokenEntity.use();
      await this.refreshTokenRepository.save(tokenEntity);

      // Generate new token pair
      const tokenPair = await this.generateTokenPair(tokenEntity.user);

      // Optionally revoke old refresh token (token rotation)
      if (this.configService.get<boolean>('JWT_REFRESH_TOKEN_ROTATION', true)) {
        tokenEntity.revoke('Token rotation');
        await this.refreshTokenRepository.save(tokenEntity);
      }

      this.logger.log(`Refresh token used successfully for user: ${tokenEntity.user.id}`);

      return tokenPair;
    } catch (error) {
      this.logger.error(`Refresh token error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Logout User
   * 
   * Educational: Logout with token revocation and cleanup.
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    try {
      // Revoke refresh token if provided
      if (refreshToken) {
        const tokenEntity = await this.refreshTokenRepository.findOne({
          where: { token: refreshToken, userId },
        });

        if (tokenEntity) {
          tokenEntity.revoke('User logout');
          await this.refreshTokenRepository.save(tokenEntity);
        }
      }

      // Emit logout event
      this.eventEmitter.emit('user.logout', new UserLogoutEvent(userId));

      this.logger.log(`User logged out: ${userId}`);
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Logout from All Devices
   * 
   * Educational: Revoke all refresh tokens for a user.
   */
  async logoutFromAllDevices(userId: string): Promise<void> {
    try {
      // Revoke all refresh tokens for the user
      await this.refreshTokenRepository.update(
        { userId, isRevoked: false },
        { 
          isRevoked: true, 
          revokedAt: new Date(),
          revokedReason: 'Logout from all devices'
        }
      );

      // Emit logout event
      this.eventEmitter.emit('user.logout', new UserLogoutEvent(userId, true));

      this.logger.log(`User logged out from all devices: ${userId}`);
    } catch (error) {
      this.logger.error(`Logout from all devices error: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==========================================
  // Password Management
  // ==========================================

  /**
   * Change Password
   * 
   * Educational: Secure password change with validation.
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    try {
      const { currentPassword, newPassword } = changePasswordDto;

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Set new password
      await user.setPassword(newPassword);
      await this.userRepository.save(user);

      // Revoke all refresh tokens to force re-login
      await this.logoutFromAllDevices(userId);

      // Emit password changed event
      this.eventEmitter.emit('password.changed', new PasswordChangedEvent(userId));

      this.logger.log(`Password changed for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Change password error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Forgot Password
   * 
   * Educational: Initiate password reset process.
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    try {
      const { email } = forgotPasswordDto;

      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        // Don't reveal if email exists or not
        this.logger.warn(`Password reset requested for non-existent email: ${email}`);
        return;
      }

      // Generate password reset token
      const resetToken = user.generatePasswordResetToken();
      await this.userRepository.save(user);

      // Emit password reset event (to send email)
      this.eventEmitter.emit('password.reset.requested', {
        userId: user.id,
        email: user.email,
        resetToken,
      });

      this.logger.log(`Password reset requested for user: ${user.id}`);
    } catch (error) {
      this.logger.error(`Forgot password error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Reset Password
   * 
   * Educational: Complete password reset with token validation.
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    try {
      const { token, newPassword } = resetPasswordDto;

      const user = await this.userRepository.findOne({
        where: { 
          passwordResetToken: token,
        },
      });

      if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
        throw new BadRequestException('Invalid or expired password reset token');
      }

      // Set new password
      await user.setPassword(newPassword);
      
      // Clear reset token
      user.passwordResetToken = null;
      user.passwordResetExpiresAt = null;
      
      await this.userRepository.save(user);

      // Revoke all refresh tokens
      await this.logoutFromAllDevices(user.id);

      // Emit password reset event
      this.eventEmitter.emit('password.reset.completed', new PasswordChangedEvent(user.id));

      this.logger.log(`Password reset completed for user: ${user.id}`);
    } catch (error) {
      this.logger.error(`Reset password error: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==========================================
  // Email Verification
  // ==========================================

  /**
   * Verify Email
   * 
   * Educational: Email verification process.
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void> {
    try {
      const { token } = verifyEmailDto;

      const user = await this.userRepository.findOne({
        where: { emailVerificationToken: token },
      });

      if (!user) {
        throw new BadRequestException('Invalid email verification token');
      }

      // Verify email
      user.verifyEmail();
      await this.userRepository.save(user);

      // Emit email verified event
      this.eventEmitter.emit('email.verified', { userId: user.id });

      this.logger.log(`Email verified for user: ${user.id}`);
    } catch (error) {
      this.logger.error(`Email verification error: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==========================================
  // Two-Factor Authentication
  // ==========================================

  /**
   * Enable Two-Factor Authentication
   * 
   * Educational: Enable 2FA for a user account.
   */
  async enableTwoFactor(userId: string, enable2FADto: Enable2FADto): Promise<{ qrCode: string; backupCodes: string[] }> {
    try {
      const { password } = enable2FADto;

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Verify password
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }

      // Generate 2FA secret and QR code
      const result = await this.twoFactorService.generateSecret(user);

      this.logger.log(`2FA setup initiated for user: ${userId}`);

      return result;
    } catch (error) {
      this.logger.error(`Enable 2FA error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify and Complete 2FA Setup
   * 
   * Educational: Complete 2FA setup with TOTP verification.
   */
  async verifyTwoFactor(userId: string, verify2FADto: Verify2FADto): Promise<{ backupCodes: string[] }> {
    try {
      const { totpCode } = verify2FADto;

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Verify TOTP code and enable 2FA
      const backupCodes = await this.twoFactorService.enableTwoFactor(user, totpCode);

      await this.userRepository.save(user);

      // Emit 2FA enabled event
      this.eventEmitter.emit('2fa.enabled', { userId });

      this.logger.log(`2FA enabled for user: ${userId}`);

      return { backupCodes };
    } catch (error) {
      this.logger.error(`Verify 2FA error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Disable Two-Factor Authentication
   */
  async disableTwoFactor(userId: string, password: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Verify password
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }

      // Disable 2FA
      await this.twoFactorService.disableTwoFactor(user);
      await this.userRepository.save(user);

      // Emit 2FA disabled event
      this.eventEmitter.emit('2fa.disabled', { userId });

      this.logger.log(`2FA disabled for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Disable 2FA error: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==========================================
  // API Key Authentication
  // ==========================================

  /**
   * Validate API Key
   * 
   * Educational: Validate API key for service-to-service authentication.
   */
  async validateApiKey(apiKey: string): Promise<User | null> {
    try {
      const crypto = require('crypto');
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      const apiKeyEntity = await this.apiKeyRepository.findOne({
        where: { keyHash },
        relations: ['user'],
      });

      if (!apiKeyEntity || !apiKeyEntity.canBeUsed()) {
        this.logger.warn(`Invalid or expired API key used: ${apiKey.substring(0, 8)}...`);
        return null;
      }

      // Mark API key as used
      apiKeyEntity.use();
      await this.apiKeyRepository.save(apiKeyEntity);

      this.logger.log(`Valid API key used for user: ${apiKeyEntity.user.id}`);
      return apiKeyEntity.user;
    } catch (error) {
      this.logger.error(`API key validation error: ${error.message}`, error.stack);
      return null;
    }
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  /**
   * Generate Token Pair
   * 
   * Educational: Generate access and refresh tokens for a user.
   */
  private async generateTokenPair(
    user: User,
    options?: {
      rememberMe?: boolean;
      deviceId?: string;
      deviceName?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<TokenPairDto> {
    // Generate access token
    const accessToken = await this.tokenService.generateAccessToken(user);
    const expiresIn = this.configService.get<number>('JWT_EXPIRES_IN_SECONDS', 900); // 15 minutes

    // Generate refresh token
    const refreshTokenValue = await this.tokenService.generateRefreshToken();
    
    // Create refresh token entity
    const refreshToken = this.refreshTokenRepository.create({
      token: refreshTokenValue,
      userId: user.id,
      expiresAt: new Date(Date.now() + (options?.rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000), // 30 days if remember me, 7 days otherwise
      deviceId: options?.deviceId,
      deviceName: options?.deviceName,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });

    await this.refreshTokenRepository.save(refreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn,
    };
  }
}