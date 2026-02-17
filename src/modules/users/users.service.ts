import { Injectable, ConflictException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './schemas/user.schema';
import { Follow } from '../follows/schemas/follow.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Follow.name) private readonly followModel: Model<any>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({
      $or: [
        { email: createUserDto.email },
        { username: createUserDto.username }
      ]
    });

    if (existingUser) {
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('Email already exists');
      }
      throw new ConflictException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  /**
   * Find user by email with password included (for authentication)
   */
  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username });
  }

  /**
   * Get user profile by username (public data)
   */
  async getUserByUsername(username: string) {
    const user = await this.userModel
      .findOne({ username })
      .select('-password')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName || user.username,
      bio: user.bio || '',
      avatar: user.avatar || null,
      isVerified: user.isVerified || false,
      createdAt: (user as any).createdAt,
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      postsCount: user.postsCount || 0,
    };
  }

  /**
   * Search users by username or full name
   */
  async searchUsers(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const users = await this.userModel
      .find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { fullName: { $regex: query, $options: 'i' } },
        ],
      })
      .select('-password')
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await this.userModel.countDocuments({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
      ],
    });

    return {
      data: users,
      total,
      page,
      limit,
      hasMore: skip + users.length < total,
    };
  }

  /**
   * Get suggested users to follow
   */
  async getSuggestions(userId: string, limit: number = 5) {
    // 1. Get IDs of users already followed
    const following = await this.followModel.find({
      followerId: new Types.ObjectId(userId),
    }).select('followingId');

    const followingIds = following.map(f => f.followingId);

    // 2. Find users NOT in following list and NOT self
    // Sort by followers count for better suggestions (popular users)
    const users = await this.userModel
      .find({
        _id: { $nin: [...followingIds, new Types.ObjectId(userId)] },
        isActive: true,
      })
      .select('-password')
      .sort({ followersCount: -1 })
      .limit(limit * 3) // Fetch more to shuffle
      .lean();

    // 3. Shuffle
    const shuffled = users.sort(() => 0.5 - Math.random());
    const suggestions = shuffled.slice(0, limit);

    return {
      data: suggestions,
      total: suggestions.length,
    };
  }

  async updateProfile(userId: string, updateData: any): Promise<UserDocument> {
    const allowedUpdates = ['fullName', 'bio', 'website', 'gender'];
    const updates = {};

    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    const user = await this.userModel.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(userId, { avatar: avatarUrl }, { new: true }).select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
