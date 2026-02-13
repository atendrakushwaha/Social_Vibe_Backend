import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ unique: true, sparse: true })
  phone?: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: '' })
  fullName: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ default: null })
  avatar?: string;

  @Prop({ default: null })
  website?: string;

  @Prop({ enum: ['male', 'female', 'other', 'prefer_not_to_say'], default: null })
  gender?: string;

  @Prop({ default: null })
  birthday?: Date;

  @Prop({ default: [] })
  pronouns: string[];

  @Prop({ default: false })
  isVerified: boolean; // Blue tick

  @Prop({ default: false })
  isPrivate: boolean; // Private account

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  followersCount: number;

  @Prop({ default: 0 })
  followingCount: number;

  @Prop({ default: 0 })
  postsCount: number;

  @Prop({ type: Object, default: {} })
  settings: {
    showActivityStatus?: boolean;
    allowMessagesFrom?: 'everyone' | 'followers' | 'none';
    allowComments?: 'everyone' | 'followers' | 'none';
    allowMentions?: 'everyone' | 'followers' | 'none';
    allowTagging?: 'everyone' | 'followers' | 'none';
    showLikeCounts?: boolean;
    privateLikes?: boolean;
  };

  @Prop({ default: null })
  lastSeen?: Date;

  @Prop({ default: null })
  twoFactorSecret?: string;

  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop({ default: null })
  passwordResetToken?: string;

  @Prop({ default: null })
  passwordResetExpires?: Date;

  @Prop({ default: null })
  emailVerificationToken?: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ type: [String], default: [] })
  blockedUsers: string[]; // User IDs

  @Prop({ type: [String], default: [] })
  mutedUsers: string[]; // User IDs

  @Prop({ type: [String], default: [] })
  closeFriends: string[]; // User IDs

  @Prop({ type: [String], default: [] })
  fcmTokens: string[]; // Push notification tokens

  @Prop({ default: null })
  deactivatedAt?: Date;

  @Prop({ default: null })
  deletedAt?: Date;

  @Prop({ enum: ['user', 'admin', 'moderator'], default: 'user' })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for performance
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });
