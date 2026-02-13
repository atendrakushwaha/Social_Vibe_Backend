import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

import { Profile } from './schema/profile.schema';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name)
    private readonly profileModel: Model<Profile>,
  ) {}

  // 🔹 Format Indian phone number → +919876543210
  private formatIndianPhone(phone?: string): string | undefined {
    if (!phone) return undefined;

    const phoneNumber = parsePhoneNumberFromString(phone, 'IN');

    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new BadRequestException('Invalid phone number');
    }

    return phoneNumber.format('E.164');
  }

  // 🔹 Build FULL avatar URL
  private buildAvatarUrl(filename?: string): string | null {
    if (!filename) return null;

    const baseUrl =
      process.env.APP_URL ;

    return `${baseUrl}/uploads/avatars/${filename}`;
  }

  // ✅ CREATE PROFILE
  async create(
    userId: string,
    dto: CreateProfileDto,
    avatar?: string,
  ) {
    const existingProfile = await this.profileModel.findOne({ user: userId });
    if (existingProfile) {
      throw new BadRequestException('Profile already exists');
    }

    const profile = await this.profileModel.create({
      ...dto,
      phone: this.formatIndianPhone(dto.phone),
      avatar, // store filename only
      user: userId,
    });

    return {
      ...profile.toObject(),
      avatar: this.buildAvatarUrl(profile.avatar),
    };
  }

  // ✅ GET MY PROFILE
  async getMyProfile(userId: string) {
    const profile = await this.profileModel
      .findOne({ user: userId })
      .populate('user', 'name email role');

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      ...profile.toObject(),
      avatar: this.buildAvatarUrl(profile.avatar),
    };
  }

  // ✅ UPDATE PROFILE
  async update(
    userId: string,
    dto: UpdateProfileDto,
    avatar?: string,
  ) {
    const updateData: any = { ...dto };

    if (dto.phone) {
      updateData.phone = this.formatIndianPhone(dto.phone);
    }

    if (avatar) {
      updateData.avatar = avatar;
    }

    const profile = await this.profileModel.findOneAndUpdate(
      { user: userId },
      updateData,
      { new: true },
    );

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      ...profile.toObject(),
      avatar: this.buildAvatarUrl(profile.avatar),
    };
  }

  // ✅ DELETE PROFILE
  async remove(userId: string) {
    const profile = await this.profileModel.findOneAndDelete({ user: userId });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return { message: 'Profile deleted successfully' };
  }
}
