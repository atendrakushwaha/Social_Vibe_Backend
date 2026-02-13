import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookmarkDocument = Bookmark & Document;

@Schema({ timestamps: true })
export class Bookmark {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Post', required: true, index: true })
    postId: Types.ObjectId;

    @Prop({ default: null })
    collectionId?: string; // Custom collection name

    @Prop({ type: [String], default: [] })
    tags: string[]; // User-defined tags

    @Prop({ default: null })
    note?: string; // Optional note about why it was saved
}

export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);

// Compound unique index
BookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });
BookmarkSchema.index({ userId: 1, collectionId: 1, createdAt: -1 });
BookmarkSchema.index({ userId: 1, tags: 1 });
