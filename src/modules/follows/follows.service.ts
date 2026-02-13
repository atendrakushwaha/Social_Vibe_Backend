import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follow, FollowDocument } from './schemas/follow.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class FollowsService {
    constructor(
        @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    /**
     * Follow or send follow request to a user
     */
    async followUser(
        followerId: string,
        followingId: string,
        isTargetPrivate: boolean,
    ): Promise<{ status: string; message: string }> {
        if (followerId === followingId) {
            throw new BadRequestException('You cannot follow yourself');
        }

        // Check if already following or requested
        const existing = await this.followModel.findOne({
            followerId: new Types.ObjectId(followerId),
            followingId: new Types.ObjectId(followingId),
        });

        if (existing) {
            if (existing.status === 'accepted') {
                throw new BadRequestException('Already following this user');
            } else if (existing.status === 'pending') {
                throw new BadRequestException('Follow request already sent');
            }
        }

        // Create follow
        const follow = new this.followModel({
            followerId: new Types.ObjectId(followerId),
            followingId: new Types.ObjectId(followingId),
            status: isTargetPrivate ? 'pending' : 'accepted',
            acceptedAt: isTargetPrivate ? null : new Date(),
        });

        await follow.save();

        // Update counts if follow is accepted immediately
        if (!isTargetPrivate) {
            await Promise.all([
                this.userModel.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } }),
                this.userModel.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } }),
            ]);
        }

        return {
            status: follow.status,
            message: isTargetPrivate ? 'Follow request sent' : 'Now following',
        };
    }

    /**
     * Unfollow a user
     */
    async unfollowUser(followerId: string, followingId: string): Promise<void> {
        const follow = await this.followModel.findOne({
            followerId: new Types.ObjectId(followerId),
            followingId: new Types.ObjectId(followingId),
        });

        if (!follow) {
            throw new NotFoundException('Not following this user');
        }

        const wasAccepted = follow.status === 'accepted';

        await follow.deleteOne();

        // Update counts if follow was accepted
        if (wasAccepted) {
            await Promise.all([
                this.userModel.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } }),
                this.userModel.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } }),
            ]);
        }
    }

    /**
     * Accept follow request
     */
    async acceptFollowRequest(requestId: string, userId: string): Promise<FollowDocument> {
        const follow = await this.followModel.findById(requestId);

        if (!follow) {
            throw new NotFoundException('Follow request not found');
        }

        if (follow.followingId.toString() !== userId) {
            throw new ForbiddenException('Unauthorized');
        }

        if (follow.status !== 'pending') {
            throw new BadRequestException('Request already processed');
        }

        follow.status = 'accepted';
        follow.acceptedAt = new Date();
        await follow.save();

        // Update counts
        await Promise.all([
            this.userModel.findByIdAndUpdate(follow.followerId, { $inc: { followingCount: 1 } }),
            this.userModel.findByIdAndUpdate(userId, { $inc: { followersCount: 1 } }),
        ]);

        return follow.populate('followerId', 'username fullName avatar isVerified');
    }

    /**
     * Reject follow request
     */
    async rejectFollowRequest(requestId: string, userId: string): Promise<void> {
        const follow = await this.followModel.findById(requestId);

        if (!follow) {
            throw new NotFoundException('Follow request not found');
        }

        if (follow.followingId.toString() !== userId) {
            throw new ForbiddenException('Unauthorized');
        }

        if (follow.status !== 'pending') {
            throw new BadRequestException('Request already processed');
        }

        await follow.deleteOne();
    }

    /**
     * Get followers list
     */
    async getFollowers(
        userId: string,
        page = 1,
        limit = 20,
    ): Promise<{ followers: FollowDocument[]; total: number }> {
        const skip = (page - 1) * limit;

        const [followers, total] = await Promise.all([
            this.followModel
                .find({
                    followingId: new Types.ObjectId(userId),
                    status: 'accepted',
                })
                .sort({ acceptedAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('followerId', 'username fullName avatar isVerified')
                .exec(),
            this.followModel.countDocuments({
                followingId: new Types.ObjectId(userId),
                status: 'accepted',
            }),
        ]);

        return { followers, total };
    }

    /**
     * Get following list
     */
    async getFollowing(
        userId: string,
        page = 1,
        limit = 20,
    ): Promise<{ following: FollowDocument[]; total: number }> {
        const skip = (page - 1) * limit;

        const [following, total] = await Promise.all([
            this.followModel
                .find({
                    followerId: new Types.ObjectId(userId),
                    status: 'accepted',
                })
                .sort({ acceptedAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('followingId', 'username fullName avatar isVerified')
                .exec(),
            this.followModel.countDocuments({
                followerId: new Types.ObjectId(userId),
                status: 'accepted',
            }),
        ]);

        return { following, total };
    }

    /**
     * Get pending follow requests
     */
    async getFollowRequests(
        userId: string,
        page = 1,
        limit = 20,
    ): Promise<{ requests: FollowDocument[]; total: number }> {
        const skip = (page - 1) * limit;

        const [requests, total] = await Promise.all([
            this.followModel
                .find({
                    followingId: new Types.ObjectId(userId),
                    status: 'pending',
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('followerId', 'username fullName avatar isVerified')
                .exec(),
            this.followModel.countDocuments({
                followingId: new Types.ObjectId(userId),
                status: 'pending',
            }),
        ]);

        return { requests, total };
    }

    /**
     * Check if user1 follows user2
     */
    async isFollowing(user1Id: string, user2Id: string): Promise<boolean> {
        const follow = await this.followModel.findOne({
            followerId: new Types.ObjectId(user1Id),
            followingId: new Types.ObjectId(user2Id),
            status: 'accepted',
        });

        return !!follow;
    }

    /**
     * Get follow status between two users
     */
    async getFollowStatus(user1Id: string, user2Id: string): Promise<{
        following: boolean;
        followedBy: boolean;
        requestSent: boolean;
    }> {
        const [following, followedBy] = await Promise.all([
            this.followModel.findOne({
                followerId: new Types.ObjectId(user1Id),
                followingId: new Types.ObjectId(user2Id),
            }),
            this.followModel.findOne({
                followerId: new Types.ObjectId(user2Id),
                followingId: new Types.ObjectId(user1Id),
            }),
        ]);

        return {
            following: following?.status === 'accepted',
            followedBy: followedBy?.status === 'accepted',
            requestSent: following?.status === 'pending',
        };
    }
}
