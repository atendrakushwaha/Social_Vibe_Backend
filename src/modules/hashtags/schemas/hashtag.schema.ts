import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HashtagDocument = Hashtag & Document;

@Schema({ timestamps: true })
export class Hashtag {
    @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
    name: string; // without #

    @Prop({ default: 0 })
    postsCount: number;

    @Prop({ default: 0 })
    followersCount: number;

    @Prop({ default: 0 })
    reelsCount: number;

    @Prop({ default: 0 })
    storiesCount: number;

    @Prop({ default: 0 })
    todayCount: number; // For trending

    @Prop({ default: 0 })
    weekCount: number; // For trending

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    followers: Types.ObjectId[];

    @Prop({ type: [String], default: [] })
    relatedHashtags: string[];

    @Prop({ default: null })
    lastUsedAt?: Date;
}

export const HashtagSchema = SchemaFactory.createForClass(Hashtag);

// Indexes
HashtagSchema.index({ name: 1 }, { unique: true });
HashtagSchema.index({ postsCount: -1 });
HashtagSchema.index({ todayCount: -1, weekCount: -1 }); // For trending
HashtagSchema.index({ lastUsedAt: -1 });
