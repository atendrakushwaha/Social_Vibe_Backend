import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reel, ReelDocument } from './schemas/reel.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { LikesService } from '../likes/likes.service';
import { CommentsService } from '../comments/comments.service';

@Injectable()
export class ReelsService {
    private readonly logger = new Logger(ReelsService.name);

    constructor(
        @InjectModel(Reel.name) private readonly reelModel: Model<ReelDocument>,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        private readonly likesService: LikesService,
        private readonly commentsService: CommentsService,
    ) { }

    async create(userId: string, videoUrl: string, thumbnailUrl: string, caption?: string): Promise<ReelDocument> {
        try {
            const hashtags = this.extractHashtags(caption || '');
            const mentionUsernames = this.extractMentions(caption || '');

            let mentionIds: Types.ObjectId[] = [];
            if (mentionUsernames.length > 0) {
                const users = await this.userModel.find({
                    username: { $in: mentionUsernames }
                }).select('_id');
                mentionIds = users.map(u => u._id);
            }

            const reel = new this.reelModel({
                userId: new Types.ObjectId(userId),
                videoUrl,
                thumbnailUrl,
                caption,
                hashtags,
                mentions: mentionIds,
            });

            return reel.save();
        } catch (error) {
            this.logger.error(`Failed to create reel: ${error.message}`, error.stack);
            throw error;
        }
    }

    async findAll(page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
            const reels = await this.reelModel.find({ deletedAt: null })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username fullName avatar isVerified')
                .lean();

            const total = await this.reelModel.countDocuments({ deletedAt: null });

            return {
                data: reels,
                total,
                page,
                limit,
                hasMore: skip + reels.length < total
            };
        } catch (error) {
            this.logger.error(`Failed to fetch reels: ${error.message}`);
            return { data: [], total: 0, page, limit, hasMore: false };
        }
    }

    async getTrending(page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
            const reels = await this.reelModel.find({ deletedAt: null })
                .sort({ likesCount: -1, viewsCount: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username fullName avatar isVerified')
                .lean();

            const total = await this.reelModel.countDocuments({ deletedAt: null });

            return {
                data: reels,
                total,
                page,
                limit,
                hasMore: skip + reels.length < total
            };
        } catch (error) {
            this.logger.error(`Failed to fetch trending reels: ${error.message}`);
            return { data: [], total: 0, page, limit, hasMore: false };
        }
    }

    async incrementView(id: string): Promise<void> {
        await this.reelModel.findByIdAndUpdate(id, { $inc: { viewsCount: 1 } });
    }

    // Toggle Like
    async toggleLike(userId: string, reelId: string): Promise<{ liked: boolean; likesCount: number }> {
        const reel = await this.reelModel.findById(reelId);
        if (!reel) throw new NotFoundException('Reel not found');

        // Toggle like in LikesService
        const result = await this.likesService.toggleLike(userId, reelId, 'Reel');

        // Update local count
        if (result.liked) {
            await this.reelModel.findByIdAndUpdate(reelId, { $inc: { likesCount: 1 } });
        } else {
            await this.reelModel.findByIdAndUpdate(reelId, { $inc: { likesCount: -1 } });
        }

        // Get fresh count to return accurate data
        // Or trust result.likesCount from service (if it returns count of Like documents)
        // But updating the Reel document's count is important for viewing without querying Likes.
        // Let's return the count from Reel document or incremented/decremented value.

        const newCount = reel.likesCount + (result.liked ? 1 : -1);
        return { liked: result.liked, likesCount: newCount < 0 ? 0 : newCount };
    }

    // Add Comment
    async addComment(userId: string, reelId: string, content: string) {
        const reel = await this.reelModel.findById(reelId);
        if (!reel) throw new NotFoundException('Reel not found');

        const comment = await this.commentsService.create(reelId, userId, { content });

        await this.reelModel.findByIdAndUpdate(reelId, { $inc: { commentsCount: 1 } });

        return comment;
    }

    // Share
    async share(id: string) {
        await this.reelModel.findByIdAndUpdate(id, { $inc: { sharesCount: 1 } });
    }

    // Get Comments
    async getComments(reelId: string, page: number = 1, limit: number = 20) {
        return this.commentsService.findByPostId(reelId, page, limit);
    }

    private extractHashtags(text: string): string[] {
        const matches = text.match(/#(\w+)/g);
        return matches ? matches.map(tag => tag.substring(1)) : [];
    }

    private extractMentions(text: string): string[] {
        const matches = text.match(/@(\w+)/g);
        return matches ? matches.map(mention => mention.substring(1)) : [];
    }
}
