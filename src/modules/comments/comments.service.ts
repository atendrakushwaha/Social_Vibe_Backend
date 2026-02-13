import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentsService {
    constructor(
        @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    ) { }

    async create(postId: string, userId: string, dto: CreateCommentDto): Promise<CommentDocument> {
        const mentions = this.extractMentions(dto.content);

        const comment = new this.commentModel({
            postId: new Types.ObjectId(postId),
            userId: new Types.ObjectId(userId),
            content: dto.content,
            parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
            mentions: mentions.map(m => new Types.ObjectId(m)),
        });

        const saved = await comment.save();

        // TODO: Update post comment count
        // TODO: If reply, update parent's reply count
        // TODO: Send notifications

        return saved.populate('userId', 'username fullName avatar isVerified');
    }

    async findByPostId(postId: string, page = 1, limit = 20): Promise<{ comments: CommentDocument[]; total: number }> {
        const skip = (page - 1) * limit;
        const query = {
            postId: new Types.ObjectId(postId),
            parentId: null, // Top-level comments only
            deletedAt: null,
        };

        const [comments, total] = await Promise.all([
            this.commentModel
                .find(query)
                .sort({ isPinned: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username fullName avatar isVerified')
                .exec(),
            this.commentModel.countDocuments(query),
        ]);

        return { comments, total };
    }

    async findReplies(commentId: string, page = 1, limit = 10): Promise<{ comments: CommentDocument[]; total: number }> {
        const skip = (page - 1) * limit;
        const query = {
            parentId: new Types.ObjectId(commentId),
            deletedAt: null,
        };

        const [comments, total] = await Promise.all([
            this.commentModel
                .find(query)
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username fullName avatar isVerified')
                .exec(),
            this.commentModel.countDocuments(query),
        ]);

        return { comments, total };
    }

    async update(commentId: string, userId: string, dto: UpdateCommentDto): Promise<CommentDocument> {
        const comment = await this.commentModel.findOne({ _id: commentId, deletedAt: null });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        if (comment.userId.toString() !== userId) {
            throw new ForbiddenException('You can only edit your own comments');
        }

        comment.content = dto.content;
        comment.mentions = this.extractMentions(dto.content).map(m => new Types.ObjectId(m));
        comment.editedAt = new Date();

        return comment.save();
    }

    async delete(commentId: string, userId: string): Promise<void> {
        const comment = await this.commentModel.findOne({ _id: commentId, deletedAt: null });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        if (comment.userId.toString() !== userId) {
            throw new ForbiddenException('You can only delete your own comments');
        }

        comment.deletedAt = new Date();
        await comment.save();

        // TODO: Update post/parent comment counts
    }

    async pin(commentId: string, postOwnerId: string): Promise<CommentDocument> {
        const comment = await this.commentModel.findOne({ _id: commentId, deletedAt: null });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        // Verify the requester is the post owner
        // TODO: Check if postOwnerId owns the post

        comment.isPinned = !comment.isPinned;
        return comment.save();
    }

    private extractMentions(text: string): string[] {
        const mentionRegex = /@(\w+)/g;
        const matches = text.match(mentionRegex);
        return matches ? matches.map(mention => mention.substring(1)) : [];
    }
}
