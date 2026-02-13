import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export interface MessageAttachment {
    type: 'image' | 'video' | 'voice' | 'post' | 'reel' | 'story' | 'profile';
    url?: string;
    thumbnail?: string;
    duration?: number;
    referenceId?: string; // For shared posts/reels/stories
}

@Schema({ timestamps: true })
export class Message {
    @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
    conversationId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    senderId: Types.ObjectId;

    @Prop({
        enum: ['text', 'image', 'video', 'voice', 'post', 'reel', 'story', 'profile'],
        required: true
    })
    type: string;

    @Prop({ default: '', maxlength: 5000 })
    content: string;

    @Prop({ type: [Object], default: [] })
    attachments: MessageAttachment[];

    @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
    replyToId?: Types.ObjectId; // Reply to another message

    @Prop({ type: Map, of: String, default: {} })
    reactions: Map<string, string>; // userId -> emoji

    @Prop({ type: [{ userId: { type: Types.ObjectId, ref: 'User' }, readAt: Date }], default: [] })
    readBy: Array<{ userId: Types.ObjectId; readAt: Date }>;

    @Prop({ default: false })
    isViewOnce: boolean;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    viewedBy: Types.ObjectId[]; // For view once messages

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    deletedFor: Types.ObjectId[]; // Soft delete for specific users

    @Prop({ default: null })
    deletedAt?: Date;

    @Prop({ default: null })
    editedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ deletedAt: 1 });
