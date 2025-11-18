import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, unique: true, trim: true })
  phone: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      dateOfBirth: Date,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
      avatar: String,
    },
  })
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
    avatar?: string;
  };

  @Prop({
    type: String,
    enum: ['SuperAdmin', 'Admin', 'Master', 'Broker', 'Client'],
    default: 'Client',
  })
  role: string;

  @Prop({
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active',
  })
  status: string;

  @Prop({ type: Number, default: 0 })
  balance: number;

  @Prop({
    type: {
      used: { type: Number, default: 0 },
      free: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
  })
  margin: {
    used: number;
    free: number;
    total: number;
  };

  @Prop({ type: Number, default: 1 })
  leverage: number;

  @Prop({
    type: {
      enabled: { type: Boolean, default: false },
      secret: String,
      backupCodes: [String],
    },
  })
  twoFactorAuth: {
    enabled: boolean;
    secret?: string;
    backupCodes?: string[];
  };

  @Prop({
    type: [
      {
        key: { type: String, required: true, unique: true },
        secret: { type: String, required: true },
        permissions: [String],
        ipWhitelist: [String],
        createdAt: { type: Date, default: Date.now },
        lastUsedAt: Date,
      },
    ],
    default: [],
  })
  apiKeys: Array<{
    key: string;
    secret: string;
    permissions: string[];
    ipWhitelist: string[];
    createdAt: Date;
    lastUsedAt?: Date;
  }>;

  @Prop({
    type: {
      status: {
        type: String,
        enum: ['Pending', 'Verified', 'Rejected'],
        default: 'Pending',
      },
      documents: [
        {
          type: { type: String },
          url: String,
          uploadedAt: Date,
        },
      ],
      verifiedAt: Date,
    },
  })
  kyc: {
    status: string;
    documents: Array<{
      type: string;
      url: string;
      uploadedAt: Date;
    }>;
    verifiedAt?: Date;
  };

  @Prop({
    type: [
      {
        deviceId: String,
        deviceType: String,
        lastLoginAt: Date,
        ipAddress: String,
      },
    ],
    default: [],
  })
  devices: Array<{
    deviceId: string;
    deviceType: string;
    lastLoginAt: Date;
    ipAddress: string;
  }>;

  @Prop({ type: Date })
  lastLoginAt: Date;

  @Prop({ type: String })
  refreshToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create indexes
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ 'apiKeys.key': 1 });
UserSchema.index({ createdAt: -1 });
