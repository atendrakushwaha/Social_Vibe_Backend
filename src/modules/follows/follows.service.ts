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
            // Check if count is already increased? No, just atomic inc
            await this.userModel.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
            await this.userModel.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });
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
            await this.userModel.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
            await this.userModel.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } });
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
        currentUserId?: string,
    ): Promise<{ followers: any[]; total: number }> {
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

        const followersList: any[] = followers
            .filter(f => f.followerId)
            .map(f => {
                const doc = f.toObject();
                return {
                    ...doc,
                    followerId: {
                        ...(doc.followerId as any),
                        isFollowedByMe: false
                    }
                };
            });

        if (currentUserId && followersList.length > 0) {
            const followerUserIds = followersList.map(f => f.followerId._id);
            const followsByMe = await this.followModel.find({
                followerId: new Types.ObjectId(currentUserId),
                followingId: { $in: followerUserIds },
                status: 'accepted'
            });

            const followedSet = new Set(followsByMe.map(f => f.followingId.toString()));
            followersList.forEach(f => {
                if (f.followerId && f.followerId._id) {
                    f.followerId.isFollowedByMe = followedSet.has(f.followerId._id.toString());
                }
            });
        }

        return { followers: followersList, total };
    }

    /**
     * Get following list
     */
    async getFollowing(
        userId: string,
        page = 1,
        limit = 20,
        currentUserId?: string,
    ): Promise<{ following: any[]; total: number }> {
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

        const followingList: any[] = following
            .filter(f => f.followingId)
            .map(f => {
                const doc = f.toObject();
                return {
                    ...doc,
                    followingId: {
                        ...(doc.followingId as any),
                        isFollowedByMe: false
                    }
                };
            });

        if (currentUserId && followingList.length > 0) {
            const followingUserIds = followingList.map(f => f.followingId._id);
            const followsByMe = await this.followModel.find({
                followerId: new Types.ObjectId(currentUserId),
                followingId: { $in: followingUserIds },
                status: 'accepted'
            });

            const followedSet = new Set(followsByMe.map(f => f.followingId.toString()));
            followingList.forEach(f => {
                if (f.followingId && f.followingId._id) {
                    f.followingId.isFollowedByMe = followedSet.has(f.followingId._id.toString());
                }
            });
        }

        return { following: followingList, total };
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
