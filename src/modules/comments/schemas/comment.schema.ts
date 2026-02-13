import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
    @Prop({ type: Types.ObjectId, ref: 'Post', required: true, index: true })
    postId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ required: true, maxlength: 2200 })
    content: string;

    @Prop({ type: Types.ObjectId, ref: 'Comment', default: null, index: true })
    parentId?: Types.ObjectId; // For nested replies

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    mentions: Types.ObjectId[];

    @Prop({ default: 0 })
    likesCount: number;

    @Prop({ default: 0 })
    repliesCount: number;

    @Prop({ default: false })
    isPinned: boolean; // Post owner can pin comment

    @Prop({ default: null })
    deletedAt?: Date;

    @Prop({ default: null })
    editedAt?: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Indexes
CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1, createdAt: -1 });
CommentSchema.index({ deletedAt: 1 });
