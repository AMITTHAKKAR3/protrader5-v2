import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { User, UserDocument } from '../database/schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [
        { email: createUserDto.email },
        { phone: createUserDto.phone },
      ],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return user.save();
  }

  async findAll(filters?: any): Promise<User[]> {
    return this.userModel.find(filters).select('-password -refreshToken').exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel
      .findById(id)
      .select('-password -refreshToken')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByPhone(phone: string): Promise<UserDocument> {
    return this.userModel.findOne({ phone }).exec();
  }

  async findByApiKey(apiKey: string): Promise<UserDocument> {
    return this.userModel.findOne({ 'apiKeys.key': apiKey }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password -refreshToken')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userModel.findByIdAndUpdate(id, { password: hashedPassword });
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken });
  }

  async updateLastLogin(userId: string, deviceInfo: any): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      lastLoginAt: new Date(),
      $push: {
        devices: {
          deviceId: deviceInfo.deviceId,
          deviceType: deviceInfo.deviceType,
          lastLoginAt: new Date(),
          ipAddress: deviceInfo.ipAddress,
        },
      },
    });
  }

  // Two-Factor Authentication
  async enable2FA(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await this.findOne(userId);
    
    const secret = speakeasy.generateSecret({
      name: `ProTrader5 (${user.email})`,
      length: 32,
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase(),
    );

    await this.userModel.findByIdAndUpdate(userId, {
      'twoFactorAuth.secret': secret.base32,
      'twoFactorAuth.backupCodes': backupCodes,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  async verify2FA(userId: string, token: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    
    if (!user || !user.twoFactorAuth.secret) {
      throw new BadRequestException('2FA not set up');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (verified) {
      await this.userModel.findByIdAndUpdate(userId, {
        'twoFactorAuth.enabled': true,
      });
    }

    return verified;
  }

  async disable2FA(userId: string, token: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    
    if (!user || !user.twoFactorAuth.enabled) {
      throw new BadRequestException('2FA not enabled');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      throw new BadRequestException('Invalid 2FA token');
    }

    await this.userModel.findByIdAndUpdate(userId, {
      'twoFactorAuth.enabled': false,
      'twoFactorAuth.secret': null,
      'twoFactorAuth.backupCodes': [],
    });
  }

  // API Key Management
  async createApiKey(userId: string, createApiKeyDto: CreateApiKeyDto): Promise<any> {
    const apiKey = this.generateApiKey();
    const apiSecret = this.generateApiSecret();
    const hashedSecret = await bcrypt.hash(apiSecret, 12);

    await this.userModel.findByIdAndUpdate(userId, {
      $push: {
        apiKeys: {
          key: apiKey,
          secret: hashedSecret,
          permissions: createApiKeyDto.permissions || [],
          ipWhitelist: createApiKeyDto.ipWhitelist || [],
          createdAt: new Date(),
        },
      },
    });

    return {
      key: apiKey,
      secret: apiSecret, // Return plain secret only once
    };
  }

  async deleteApiKey(userId: string, apiKey: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: {
        apiKeys: { key: apiKey },
      },
    });
  }

  async verifyApiKey(apiKey: string, apiSecret: string): Promise<UserDocument> {
    const user = await this.findByApiKey(apiKey);
    
    if (!user) {
      throw new NotFoundException('Invalid API key');
    }

    const keyData = user.apiKeys.find((k) => k.key === apiKey);
    const isValid = await bcrypt.compare(apiSecret, keyData.secret);

    if (!isValid) {
      throw new BadRequestException('Invalid API secret');
    }

    // Update last used timestamp
    await this.userModel.updateOne(
      { _id: user._id, 'apiKeys.key': apiKey },
      { $set: { 'apiKeys.$.lastUsedAt': new Date() } },
    );

    return user;
  }

  private generateApiKey(): string {
    return `pk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateApiSecret(): string {
    return `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }
}
