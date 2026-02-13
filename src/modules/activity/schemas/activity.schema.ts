import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActivityDocument = Activity & Document;

@Schema({ timestamps: true })
export class Activity {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({
        required: true,
        enum: [
            'post_view', 'post_click', 'profile_view', 'story_view',
            'reel_view', 'search', 'hashtag_click', 'location_click',
            'external_link_click', 'share'
        ],
        index: true
    })
    actionType: string;

    @Prop({ type: Types.ObjectId, refPath: 'targetType', default: null })
    targetId?: Types.ObjectId;

    @Prop({
        enum: ['Post', 'User', 'Story', 'Reel', 'Hashtag', 'Location'],
        default: null
    })
    targetType?: string;

    @Prop({ type: Object, default: {} })
    metadata: {
        duration?: number; // Time spent viewing
        deviceType?: string;
        location?: string;
        searchQuery?: string;
        source?: string;
    };

    @Prop({ default: null })
    ipAddress?: string;

    @Prop({ default: null })
    userAgent?: string;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

// Indexes
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ actionType: 1, createdAt: -1 });
ActivitySchema.index({ targetId: 1, targetType: 1 });
