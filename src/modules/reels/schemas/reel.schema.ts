import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReelDocument = Reel & Document;

export interface ReelAudio {
    id: string;
    name: string;
    artist?: string;
    url?: string;
    duration?: number;
}

@Schema({ timestamps: true })
export class Reel {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    videoUrl: string;

    @Prop({ required: true })
    thumbnailUrl: string;

    @Prop({ default: 0 })
    duration: number; // in seconds

    @Prop({ default: '', maxlength: 2200 })
    caption: string;

    @Prop({ type: Object, default: null })
    audio?: ReelAudio;

    @Prop({ type: [String], default: [] })
    hashtags: string[];

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    mentions: Types.ObjectId[];

    @Prop({ type: Object, default: null })
    location?: {
        name: string;
        lat?: number;
        lng?: number;
    };

    @Prop({ default: 0 })
    likesCount: number;

    @Prop({ default: 0 })
    commentsCount: number;

    @Prop({ default: 0 })
    sharesCount: number;

    @Prop({ default: 0 })
    savesCount: number;

    @Prop({ default: 0 })
    viewsCount: number;

    @Prop({ default: false })
    commentsDisabled: boolean;

    @Prop({ enum: ['public', 'followers'], default: 'public' })
    visibility: string;

    @Prop({ type: Types.ObjectId, ref: 'Reel', default: null })
    originalReelId?: Types.ObjectId; // For remixes

    @Prop({ default: false })
    allowRemix: boolean;

    @Prop({ default: null })
    deletedAt?: Date;
}

export const ReelSchema = SchemaFactory.createForClass(Reel);

// Indexes
ReelSchema.index({ userId: 1, createdAt: -1 });
ReelSchema.index({ hashtags: 1 });
ReelSchema.index({ createdAt: -1 });
ReelSchema.index({ likesCount: -1, viewsCount: -1 }); // For trending
ReelSchema.index({ deletedAt: 1 });
