import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Like, LikeDocument } from './schemas/like.schema';

@Injectable()
export class LikesService {
    constructor(
        @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    ) { }

    async toggleLike(
        userId: string,
        targetId: string,
        targetType: 'Post' | 'Comment' | 'Story' | 'Reel',
    ): Promise<{ liked: boolean; likesCount: number }> {
        const existing = await this.likeModel.findOne({
            userId: new Types.ObjectId(userId),
            targetId: new Types.ObjectId(targetId),
            targetType,
        });

        if (existing) {
            // Unlike
            await existing.deleteOne();
            const count = await this.getLikesCount(targetId, targetType);

            // TODO: Decrement likes count on target document
            // TODO: Delete like notification

            return { liked: false, likesCount: count };
        } else {
            // Like
            const like = new this.likeModel({
                userId: new Types.ObjectId(userId),
                targetId: new Types.ObjectId(targetId),
                targetType,
            });

            await like.save();
            const count = await this.getLikesCount(targetId, targetType);

            // TODO: Increment likes count on target document
            // TODO: Create like notification

            return { liked: true, likesCount: count };
        }
    }

    async getLikesCount(targetId: string, targetType: string): Promise<number> {
        return this.likeModel.countDocuments({
            targetId: new Types.ObjectId(targetId),
            targetType,
        });
    }

    async checkLiked(userId: string, targetId: string, targetType: string): Promise<boolean> {
        const like = await this.likeModel.findOne({
            userId: new Types.ObjectId(userId),
            targetId: new Types.ObjectId(targetId),
            targetType,
        });

        return !!like;
    }

    async getLikers(
        targetId: string,
        targetType: string,
        page = 1,
        limit = 20,
    ): Promise<{ likers: LikeDocument[]; total: number }> {
        const skip = (page - 1) * limit;

        const [likers, total] = await Promise.all([
            this.likeModel
                .find({
                    targetId: new Types.ObjectId(targetId),
                    targetType,
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username fullName avatar isVerified')
                .exec(),
            this.likeModel.countDocuments({
                targetId: new Types.ObjectId(targetId),
                targetType,
            }),
        ]);

        return { likers, total };
    }

    async getUserLikes(
        userId: string,
        targetType: string,
        page = 1,
        limit = 20,
    ): Promise<{ likes: LikeDocument[]; total: number }> {
        const skip = (page - 1) * limit;

        const [likes, total] = await Promise.all([
            this.likeModel
                .find({
                    userId: new Types.ObjectId(userId),
                    targetType,
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('targetId')
                .exec(),
            this.likeModel.countDocuments({
                userId: new Types.ObjectId(userId),
                targetType,
            }),
        ]);

        return { likes, total };
    }
}
