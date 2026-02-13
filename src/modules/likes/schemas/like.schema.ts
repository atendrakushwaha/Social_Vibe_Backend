import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LikeDocument = Like & Document;

@Schema({ timestamps: true })
export class Like {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, required: true, refPath: 'targetType', index: true })
    targetId: Types.ObjectId;

    @Prop({
        required: true,
        enum: ['Post', 'Comment', 'Story', 'Reel'],
        index: true
    })
    targetType: string;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// Compound unique index - user can only like a target once
LikeSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });
LikeSchema.index({ targetId: 1, targetType: 1, createdAt: -1 });
