import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FollowDocument = Follow & Document;

@Schema({ timestamps: true })
export class Follow {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    followerId: Types.ObjectId; // User who follows

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    followingId: Types.ObjectId; // User being followed

    @Prop({
        enum: ['pending', 'accepted', 'rejected'],
        default: 'accepted',
        index: true
    })
    status: string; // For private accounts

    @Prop({ default: null })
    acceptedAt?: Date;

    @Prop({ default: null })
    rejectedAt?: Date;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);

// Compound unique index - prevent duplicate follows
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followingId: 1, status: 1, createdAt: -1 });
FollowSchema.index({ followerId: 1, status: 1, createdAt: -1 });
