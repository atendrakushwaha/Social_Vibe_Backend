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
  ) { }

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
    if (filename.startsWith('http')) return filename; // Cloudinary URL

    const baseUrl =
      process.env.APP_URL;

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
      .populate('user', 'name username email role');

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      ...profile.toObject(),
      avatar: this.buildAvatarUrl(profile.avatar),
    };
  }

  // ✅ GET PROFILE BY USERNAME (Deprecated or update?)
  async getProfileByUsername(username: string, currentUserId?: string) {
    // Since we don't have direct access to UserModel here easily without circular deps or module changes,
    // and profile is linked to user by ObjectId, we can use a virtual populate or aggregate manually if needed.
    // However, simplest way given current setup is likely to fetch all profiles (bad) or rely on a better schema design.
    // BUT! We can just use a trick:

    // We need to inject User model ideally.
    // Let's assume for now we can just search if we had the ID.

    // Attempt 2: Use lookup in aggregation.
    const profiles = await this.profileModel.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      { $match: { 'userInfo.username': username } }
    ]);

    if (!profiles || profiles.length === 0) {
      throw new NotFoundException('Profile not found');
    }

    const profile = profiles[0];
    // Re-structure to match standard output if needed (userInfo is currently inside)
    // Actually we want 'user' field populated like getMyProfile.

    const populatedProfile = {
      ...profile,
      user: profile.userInfo,
      avatar: this.buildAvatarUrl(profile.avatar)
    };
    delete populatedProfile.userInfo;

    return populatedProfile;
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
