import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CallDocument = Call & Document;

export enum CallType {
    AUDIO = 'audio',
    VIDEO = 'video',
}

export enum CallStatus {
    INITIATED = 'initiated',
    RINGING = 'ringing',
    ANSWERED = 'answered',
    REJECTED = 'rejected',
    MISSED = 'missed',
    ENDED = 'ended',
    FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Call {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    callerId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    receiverId: Types.ObjectId;

    @Prop({
        type: String,
        enum: Object.values(CallType),
        required: true,
    })
    callType: string;

    @Prop({
        type: String,
        enum: Object.values(CallStatus),
        default: CallStatus.INITIATED,
    })
    status: string;

    @Prop({ default: null })
    startedAt?: Date;

    @Prop({ default: null })
    endedAt?: Date;

    @Prop({ default: 0 })
    duration: number; // in seconds

    @Prop({ default: null })
    conversationId?: Types.ObjectId;

    @Prop({ default: false })
    isGroupCall: boolean;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    participants: Types.ObjectId[]; // For group calls

    @Prop({ default: null })
    recordingUrl?: string; // If call was recorded

    @Prop({ default: null })
    deletedAt?: Date;
}

export const CallSchema = SchemaFactory.createForClass(Call);

// Indexes
CallSchema.index({ callerId: 1, createdAt: -1 });
CallSchema.index({ receiverId: 1, createdAt: -1 });
CallSchema.index({ status: 1, createdAt: -1 });
CallSchema.index({ conversationId: 1 });
