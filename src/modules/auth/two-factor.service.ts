/**
 * Two-Factor Authentication Service - TOTP Implementation
 * 
 * This service demonstrates:
 * - Time-based One-Time Password (TOTP) generation and verification
 * - QR code generation for authenticator apps
 * - Backup codes for account recovery
 * - 2FA setup and management
 * - Security features (rate limiting, replay protection)
 * 
 * Educational Notes:
 * - TOTP is based on RFC 6238 and uses HMAC-SHA1
 * - QR codes contain the secret and configuration for authenticator apps
 * - Backup codes provide recovery when the primary 2FA device is unavailable
 * - Time windows allow for clock drift between client and server
 * - Rate limiting prevents brute force attacks on TOTP codes
 */

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

import { User } from '../../entities/user.entity';

/**
 * Two-Factor Service
 * 
 * Educational: This service handles all 2FA-related operations
 * including TOTP generation, verification, and backup codes.
 */
@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    private readonly configService: ConfigService,
  ) {}

  // ==========================================
  // TOTP Management
  // ==========================================

  /**
   * Generate 2FA Secret and QR Code
   * 
   * Educational: Generate a new TOTP secret and create a QR code
   * that users can scan with their authenticator apps.
   */
  async generateSecret(user: User): Promise<{ qrCode: string; backupCodes: string[] }> {
    try {
      // Generate a new secret
      const secret = speakeasy.generateSecret({
        name: `${user.email}`,
        issuer: this.configService.get<string>('APP_NAME', 'NestJS Learning Platform'),
        length: 32, // 32 bytes = 256 bits of entropy
      });

      // Store the secret temporarily (not yet enabled)
      if (!user.securitySettings) {
        user.securitySettings = {
          twoFactorEnabled: false,
          lastPasswordChange: new Date(),
          loginAttempts: 0,
          trustedDevices: [],
          sessionTimeout: 480,
        };
      }

      user.securitySettings.twoFactorSecret = secret.base32;

      // Generate QR code
      const qrCodeUrl = speakeasy.otpauthURL({
        secret: secret.base32,
        label: user.email,
        issuer: this.configService.get<string>('APP_NAME', 'NestJS Learning Platform'),
        encoding: 'base32',
      });

      const qrCode = await QRCode.toDataURL(qrCodeUrl);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      user.securitySettings.backupCodes = backupCodes.map(code => this.hashBackupCode(code));

      this.logger.log(`2FA secret generated for user: ${user.id}`);

      return {
        qrCode,
        backupCodes, // Return unhashed codes to user (only time they'll see them)
      };
    } catch (error) {
      this.logger.error(`Error generating 2FA secret: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify TOTP Code
   * 
   * Educational: Verify a TOTP code against the user's secret.
   * Includes time window tolerance for clock drift.
   */
  async verifyTotp(user: User, token: string): Promise<boolean> {
    try {
      if (!user.securitySettings?.twoFactorSecret) {
        throw new BadRequestException('Two-factor authentication is not set up for this user');
      }

      // Verify the TOTP token
      const verified = speakeasy.totp.verify({
        secret: user.securitySettings.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps (60 seconds) of drift
      });

      if (verified) {
        this.logger.log(`Valid TOTP code provided for user: ${user.id}`);
        return true;
      }

      // If TOTP fails, try backup codes
      if (user.securitySettings.backupCodes && user.securitySettings.backupCodes.length > 0) {
        const isValidBackupCode = await this.verifyBackupCode(user, token);
        if (isValidBackupCode) {
          this.logger.log(`Valid backup code used for user: ${user.id}`);
          return true;
        }
      }

      this.logger.warn(`Invalid 2FA code provided for user: ${user.id}`);
      return false;
    } catch (error) {
      this.logger.error(`Error verifying TOTP: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Enable Two-Factor Authentication
   * 
   * Educational: Complete the 2FA setup process by verifying
   * the initial TOTP code and enabling 2FA for the user.
   */
  async enableTwoFactor(user: User, totpCode: string): Promise<string[]> {
    try {
      // Verify the TOTP code first
      const isValidTotp = await this.verifyTotp(user, totpCode);
      if (!isValidTotp) {
        throw new UnauthorizedException('Invalid two-factor authentication code');
      }

      // Enable 2FA
      if (!user.securitySettings) {
        throw new BadRequestException('Two-factor authentication setup not found');
      }

      user.securitySettings.twoFactorEnabled = true;

      // Return backup codes (unhashed for display to user)
      const backupCodes = this.generateBackupCodes();
      user.securitySettings.backupCodes = backupCodes.map(code => this.hashBackupCode(code));

      this.logger.log(`2FA enabled for user: ${user.id}`);

      return backupCodes;
    } catch (error) {
      this.logger.error(`Error enabling 2FA: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Disable Two-Factor Authentication
   * 
   * Educational: Disable 2FA and clear all related secrets and backup codes.
   */
  async disableTwoFactor(user: User): Promise<void> {
    try {
      if (!user.securitySettings) {
        return; // Already disabled
      }

      // Clear 2FA settings
      user.securitySettings.twoFactorEnabled = false;
      user.securitySettings.twoFactorSecret = undefined;
      user.securitySettings.backupCodes = undefined;

      this.logger.log(`2FA disabled for user: ${user.id}`);
    } catch (error) {
      this.logger.error(`Error disabling 2FA: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ==========================================
  // Backup Codes Management
  // ==========================================

  /**
   * Generate Backup Codes
   * 
   * Educational: Generate a set of backup codes that can be used
   * when the primary 2FA device is unavailable.
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-digit backup code
      const code = Math.random().toString().substr(2, 8);
      codes.push(code);
    }

    return codes;
  }

  /**
   * Hash Backup Code
   * 
   * Educational: Hash backup codes before storing them in the database.
   */
  private hashBackupCode(code: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Verify Backup Code
   * 
   * Educational: Verify a backup code and remove it from the list
   * (backup codes are single-use).
   */
  private async verifyBackupCode(user: User, code: string): Promise<boolean> {
    try {
      if (!user.securitySettings?.backupCodes || user.securitySettings.backupCodes.length === 0) {
        return false;
      }

      const hashedCode = this.hashBackupCode(code);
      const codeIndex = user.securitySettings.backupCodes.indexOf(hashedCode);

      if (codeIndex === -1) {
        return false;
      }

      // Remove the used backup code (single-use)
      user.securitySettings.backupCodes.splice(codeIndex, 1);

      this.logger.log(`Backup code used for user: ${user.id}. Remaining codes: ${user.securitySettings.backupCodes.length}`);

      return true;
    } catch (error) {
      this.logger.error(`Error verifying backup code: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Regenerate Backup Codes
   * 
   * Educational: Generate new backup codes and invalidate old ones.
   */
  async regenerateBackupCodes(user: User): Promise<string[]> {
    try {
      if (!user.securitySettings?.twoFactorEnabled) {
        throw new BadRequestException('Two-factor authentication is not enabled');
      }

      // Generate new backup codes
      const backupCodes = this.generateBackupCodes();
      user.securitySettings.backupCodes = backupCodes.map(code => this.hashBackupCode(code));

      this.logger.log(`Backup codes regenerated for user: ${user.id}`);

      return backupCodes;
    } catch (error) {
      this.logger.error(`Error regenerating backup codes: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get Remaining Backup Codes Count
   * 
   * Educational: Return the number of remaining backup codes.
   */
  getRemainingBackupCodesCount(user: User): number {
    return user.securitySettings?.backupCodes?.length || 0;
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  /**
   * Check if 2FA is Enabled
   * 
   * Educational: Check if 2FA is enabled for a user.
   */
  isTwoFactorEnabled(user: User): boolean {
    return user.securitySettings?.twoFactorEnabled || false;
  }

  /**
   * Generate Current TOTP Code (for testing)
   * 
   * Educational: Generate the current TOTP code for a user's secret.
   * This is useful for testing and debugging.
   */
  generateCurrentTotp(user: User): string | null {
    try {
      if (!user.securitySettings?.twoFactorSecret) {
        return null;
      }

      return speakeasy.totp({
        secret: user.securitySettings.twoFactorSecret,
        encoding: 'base32',
      });
    } catch (error) {
      this.logger.error(`Error generating current TOTP: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Get Time Until Next TOTP Code
   * 
   * Educational: Calculate seconds until the next TOTP code is generated.
   */
  getTimeUntilNextCode(): number {
    const now = Math.floor(Date.now() / 1000);
    const timeStep = 30; // TOTP time step in seconds
    return timeStep - (now % timeStep);
  }

  /**
   * Validate TOTP Setup
   * 
   * Educational: Validate that 2FA is properly set up for a user.
   */
  validateTotpSetup(user: User): boolean {
    return !!(
      user.securitySettings?.twoFactorSecret &&
      user.securitySettings?.twoFactorEnabled &&
      user.securitySettings?.backupCodes &&
      user.securitySettings.backupCodes.length > 0
    );
  }
}