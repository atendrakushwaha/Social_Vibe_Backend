import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Follow, FollowDocument } from '../follows/schemas/follow.schema';

@Injectable()
export class FeedService {
    constructor(
        @InjectModel(Post.name) private postModel: Model<PostDocument>,
        @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    ) { }

    /**
     * Get personalized feed algorithm
     */
    async getPersonalizedFeed(userId: string, page = 1, limit = 10): Promise<{ posts: PostDocument[]; total: number }> {
        const skip = (page - 1) * limit;

        // Get users that current user follows
        const following = await this.followModel
            .find({
                followerId: new Types.ObjectId(userId),
                status: 'accepted',
            })
            .select('followingId');

        const followingIds = following.map(f => f.followingId);

        // Get posts from followed users
        const posts = await this.postModel
            .find({
                userId: { $in: followingIds },
                deletedAt: null,
                isArchived: false,
                visibility: { $in: ['public', 'followers'] },
            })
            .sort({
                isPinned: -1,
                createdAt: -1,
                likesCount: -1,
                commentsCount: -1,
            })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'username fullName avatar isVerified')
            .exec();

        const total = await this.postModel.countDocuments({
            userId: { $in: followingIds },
            deletedAt: null,
            isArchived: false,
        });

        return { posts, total };
    }

    /**
     * Get following feed (chronological)
     */
    async getFollowingFeed(userId: string, page = 1, limit = 10): Promise<{ posts: PostDocument[]; total: number }> {
        const skip = (page - 1) * limit;

        const following = await this.followModel
            .find({
                followerId: new Types.ObjectId(userId),
                status: 'accepted',
            })
            .select('followingId');

        const followingIds = following.map(f => f.followingId);

        const [posts, total] = await Promise.all([
            this.postModel
                .find({
                    userId: { $in: followingIds },
                    deletedAt: null,
                    isArchived: false,
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username fullName avatar isVerified')
                .exec(),
            this.postModel.countDocuments({
                userId: { $in: followingIds },
                deletedAt: null,
                isArchived: false,
            }),
        ]);

        return { posts, total };
    }

    /**
     * Get explore feed
     */
    async getExploreFeed(userId: string, page = 1, limit = 12): Promise<{ posts: PostDocument[]; total: number }> {
        const skip = (page - 1) * limit;

        // Get users the current user doesn't follow
        const following = await this.followModel
            .find({
                followerId: new Types.ObjectId(userId),
                status: 'accepted',
            })
            .select('followingId');

        const followingIds = following.map(f => f.followingId.toString());
        followingIds.push(userId); // Exclude own posts

        const [posts, total] = await Promise.all([
            this.postModel
                .find({
                    userId: { $nin: followingIds.map(id => new Types.ObjectId(id)) },
                    deletedAt: null,
                    isArchived: false,
                    visibility: 'public',
                })
                .sort({
                    likesCount: -1,
                    commentsCount: -1,
                    viewsCount: -1,
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username fullName avatar isVerified')
                .exec(),
            this.postModel.countDocuments({
                userId: { $nin: followingIds.map(id => new Types.ObjectId(id)) },
                deletedAt: null,
                isArchived: false,
                visibility: 'public',
            }),
        ]);

        return { posts, total };
    }
}
