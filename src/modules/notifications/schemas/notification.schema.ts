import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId; // Recipient

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    actorId: Types.ObjectId; // Who performed the action

    @Prop({
        required: true,
        enum: [
            'like_post', 'like_comment', 'like_reel', 'like_story',
            'comment_post', 'comment_reel', 'reply_comment',
            'mention_post', 'mention_comment', 'mention_story',
            'follow', 'follow_request', 'follow_accept',
            'story_view', 'story_reply',
            'message', 'group_message',
            'tag_post', 'tag_story'
        ],
        index: true
    })
    type: string;

    @Prop({ type: Types.ObjectId, refPath: 'targetType', default: null })
    targetId?: Types.ObjectId;

    @Prop({
        enum: ['Post', 'Comment', 'Story', 'Reel', 'Message', 'Follow'],
        default: null
    })
    targetType?: string;

    @Prop({ default: '', maxlength: 500 })
    content: string; // Preview text

    @Prop({ default: null })
    thumbnail?: string; // For media notifications

    @Prop({ default: false, index: true })
    isRead: boolean;

    @Prop({ default: null })
    readAt?: Date;

    @Prop({ default: null })
    deletedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ actorId: 1, createdAt: -1 });
NotificationSchema.index({ targetId: 1, targetType: 1 });
NotificationSchema.index({ deletedAt: 1 });
