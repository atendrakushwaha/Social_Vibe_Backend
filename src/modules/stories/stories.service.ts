import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Story, StoryDocument } from './schemas/story.schema';
import { Follow } from '../follows/schemas/follow.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class StoriesService {
    constructor(
        @InjectModel(Story.name) private storyModel: Model<StoryDocument>,
        @InjectModel(Follow.name) private followModel: Model<any>,
        @InjectModel(User.name) private userModel: Model<any>,
    ) { }

    /**
     * Create a new story
     */
    async create(userId: string, body: any): Promise<any> {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const media = {
            url: body.mediaUrl || '',
            type: body.mediaType || 'image',
        };

        const story = new this.storyModel({
            userId: new Types.ObjectId(userId),
            media,
            caption: body.caption || '',
            visibility: body.visibility || 'public',
            expiresAt,
        });

        const saved = await story.save();

        // Populate userId for frontend
        const populated = await this.storyModel
            .findById(saved._id)
            .populate('userId', 'username fullName avatar')
            .exec();

        if (!populated) return saved;

        // Transform to frontend format
        return {
            _id: populated._id,
            userId: populated.userId,
            type: populated.media?.type || 'image',
            mediaUrl: populated.media?.url || '',
            viewsCount: populated.viewsCount || 0,
            hasViewed: false,
            createdAt: (populated as any).createdAt,
            expiresAt: populated.expiresAt,
        };
    }

    /**
     * Get active stories for the feed (from people user follows + own)
     */
    async findActiveStories(userId: string): Promise<any[]> {
        const now = new Date();

        // Get following list
        const followDocs = await this.followModel.find({
            followerId: new Types.ObjectId(userId),
            status: 'accepted',
        }).select('followingId').exec();

        const followingIds = followDocs.map(f => f.followingId);
        const userIds = [...followingIds, new Types.ObjectId(userId)];

        // Get all active stories from these users
        const stories = await this.storyModel
            .find({
                userId: { $in: userIds },
                expiresAt: { $gt: now },
                deletedAt: null,
            })
            .populate('userId', 'username fullName avatar')
            .sort({ createdAt: -1 })
            .exec();

        // Group by userId
        const groupMap = new Map<string, any>();

        for (const story of stories) {
            const uid = (story.userId as any)?._id?.toString();
            if (!uid) continue;

            const hasViewed = story.viewers?.some(
                v => v.userId?.toString() === userId,
            ) || false;

            const storyData = {
                _id: story._id,
                userId: story.userId,
                type: story.media?.type || 'image',
                mediaUrl: story.media?.url || '',
                viewsCount: story.viewsCount || 0,
                hasViewed,
                createdAt: (story as any).createdAt,
                expiresAt: story.expiresAt,
            };

            if (!groupMap.has(uid)) {
                groupMap.set(uid, {
                    userId: story.userId,
                    stories: [storyData],
                    hasUnviewed: !hasViewed,
                });
            } else {
                const group = groupMap.get(uid);
                group.stories.push(storyData);
                if (!hasViewed) group.hasUnviewed = true;
            }
        }

        return Array.from(groupMap.values());
    }

    /**
     * Find stories by username
     */
    async findUserStories(username: string, currentUserId: string): Promise<any[]> {
        const now = new Date();

        // Find user by username
        const user = await this.userModel.findOne({ username }).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const stories = await this.storyModel
            .find({
                userId: user._id,
                expiresAt: { $gt: now },
                deletedAt: null,
            })
            .populate('userId', 'username fullName avatar')
            .sort({ createdAt: 1 })
            .exec();

        return stories.map(story => ({
            _id: story._id,
            userId: story.userId,
            type: story.media?.type || 'image',
            mediaUrl: story.media?.url || '',
            viewsCount: story.viewsCount || 0,
            hasViewed: story.viewers?.some(
                v => v.userId?.toString() === currentUserId,
            ) || false,
            createdAt: (story as any).createdAt,
            expiresAt: story.expiresAt,
        }));
    }

    /**
     * View a story
     */
    async viewStory(storyId: string, userId: string): Promise<void> {
        await this.storyModel.findByIdAndUpdate(storyId, {
            $addToSet: {
                viewers: {
                    userId: new Types.ObjectId(userId),
                    viewedAt: new Date(),
                },
            },
            $inc: { viewsCount: 1 },
        });
    }

    /**
     * Get story views
     */
    async getStoryViews(storyId: string, userId: string): Promise<any> {
        const story = await this.storyModel
            .findById(storyId)
            .populate('viewers.userId', 'username fullName avatar')
            .exec();

        if (!story) {
            throw new NotFoundException('Story not found');
        }

        if (story.userId.toString() !== userId) {
            throw new ForbiddenException('You can only view your own story views');
        }

        return {
            data: story.viewers || [],
            total: story.viewers?.length || 0,
        };
    }

    /**
     * Delete a story
     */
    async deleteStory(storyId: string, userId: string): Promise<void> {
        const story = await this.storyModel.findById(storyId);
        if (!story) {
            throw new NotFoundException('Story not found');
        }
        if (story.userId.toString() !== userId) {
            throw new ForbiddenException('You can only delete your own stories');
        }

        await this.storyModel.findByIdAndUpdate(storyId, {
            $set: { deletedAt: new Date() },
        });
    }

    /**
     * Delete expired stories (cron job)
     */
    async deleteExpiredStories(): Promise<void> {
        await this.storyModel.updateMany(
            { expiresAt: { $lt: new Date() }, deletedAt: null },
            { $set: { deletedAt: new Date() } },
        );
    }
}
