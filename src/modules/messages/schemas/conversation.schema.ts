import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
    participants: Types.ObjectId[];

    @Prop({ enum: ['direct', 'group'], default: 'direct' })
    type: string;

    @Prop({ default: null })
    groupName?: string;

    @Prop({ default: null })
    groupAvatar?: string;

    @Prop({ type: Types.ObjectId, ref: 'User', default: null })
    createdBy?: Types.ObjectId; // For groups

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    admins: Types.ObjectId[]; // For groups

    @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
    lastMessageId?: Types.ObjectId;

    @Prop({ default: '' })
    lastMessageText: string;

    @Prop({ default: null })
    lastMessageAt?: Date;

    @Prop({ type: Map, of: Number, default: {} })
    unreadCounts: Map<string, number>; // userId -> unread count

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    mutedBy: Types.ObjectId[];

    @Prop({ default: false })
    isArchived: boolean;

    @Prop({ default: null })
    deletedAt?: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Indexes
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });
ConversationSchema.index({ deletedAt: 1 });
