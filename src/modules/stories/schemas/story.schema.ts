import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StoryDocument = Story & Document;

export interface StoryMedia {
    url: string;
    type: 'image' | 'video';
    thumbnail?: string;
    duration?: number; // video duration
}

export interface StoryInteractive {
    type: 'poll' | 'quiz' | 'question' | 'countdown' | 'slider';
    data: any; // Flexible data structure
    responses?: any[];
}

@Schema({ timestamps: true })
export class Story {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ type: Object, required: true })
    media: StoryMedia;

    @Prop({ default: '', maxlength: 500 })
    caption: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    mentions: Types.ObjectId[];

    @Prop({ type: [String], default: [] })
    hashtags: string[];

    @Prop({ type: Object, default: null })
    location?: {
        name: string;
        lat?: number;
        lng?: number;
    };

    @Prop({ type: [Object], default: [] })
    interactiveElements: StoryInteractive[];

    @Prop({ type: [{ userId: { type: Types.ObjectId, ref: 'User' }, viewedAt: Date }], default: [] })
    viewers: Array<{ userId: Types.ObjectId; viewedAt: Date }>;

    @Prop({ default: 0 })
    viewsCount: number;

    @Prop({ enum: ['public', 'followers', 'close_friends'], default: 'public' })
    visibility: string;

    @Prop({ required: true, index: true })
    expiresAt: Date; // Auto-delete after 24 hours

    @Prop({ default: null })
    highlightId?: string; // If saved to highlights

    @Prop({ default: false })
    isArchived: boolean;

    @Prop({ default: null })
    deletedAt?: Date;
}

export const StorySchema = SchemaFactory.createForClass(Story);

// Indexes
StorySchema.index({ userId: 1, createdAt: -1 });
StorySchema.index({ expiresAt: 1 }); // For auto-deletion
StorySchema.index({ deletedAt: 1 });
StorySchema.index({ visibility: 1, expiresAt: 1 });
