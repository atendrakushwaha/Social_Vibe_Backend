import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

export interface MediaItem {
    url: string;
    type: 'image' | 'video';
    thumbnail?: string;
    width?: number;
    height?: number;
    duration?: number; // for videos in seconds
    altText?: string; // accessibility
}

export interface LocationTag {
    name: string;
    lat?: number;
    lng?: number;
    placeId?: string;
}

@Schema({ timestamps: true })
export class Post {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ type: [Object], required: true })
    media: MediaItem[]; // Array of images/videos

    @Prop({ default: '', maxlength: 2200 })
    caption: string;

    @Prop({ type: [String], default: [] })
    hashtags: string[]; // Extracted from caption

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    mentions: Types.ObjectId[]; // Mentioned users

    @Prop({ type: Object, default: null })
    location?: LocationTag;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    likes: Types.ObjectId[]; // Users who liked this post

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

    @Prop({ default: false })
    likesHidden: boolean;

    @Prop({ default: false })
    isArchived: boolean;

    @Prop({ default: false })
    isPinned: boolean;

    @Prop({ enum: ['public', 'followers', 'close_friends'], default: 'public' })
    visibility: string;

    @Prop({ default: null })
    deletedAt?: Date;

    @Prop({ default: null })
    editedAt?: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Indexes
PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ hashtags: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ likesCount: -1 });
PostSchema.index({ 'location.name': 1 });
PostSchema.index({ deletedAt: 1 });
