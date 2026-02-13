import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Call, CallDocument, CallStatus } from './schemas/call.schema';

@Injectable()
export class CallsService {
    constructor(
        @InjectModel(Call.name) private callModel: Model<CallDocument>,
    ) { }

    /**
     * Create a new call record
     */
    async createCall(
        callerId: string,
        receiverId: string,
        callType: 'audio' | 'video',
        conversationId?: string,
    ): Promise<CallDocument> {
        return this.callModel.create({
            callerId: new Types.ObjectId(callerId),
            receiverId: new Types.ObjectId(receiverId),
            callType,
            status: CallStatus.INITIATED,
            conversationId: conversationId ? new Types.ObjectId(conversationId) : undefined,
        });
    }

    /**
     * Update call status
     */
    async updateCallStatus(
        callId: string,
        status: CallStatus,
        additionalData?: Partial<Call>,
    ): Promise<CallDocument> {
        const updates: any = { status, ...additionalData };

        if (status === CallStatus.ANSWERED && !additionalData?.startedAt) {
            updates.startedAt = new Date();
        }

        if (status === CallStatus.ENDED && !additionalData?.endedAt) {
            updates.endedAt = new Date();

            // Calculate duration if call was answered
            const call = await this.callModel.findById(callId);
            if (call && call.startedAt) {
                const duration = Math.floor((new Date().getTime() - call.startedAt.getTime()) / 1000);
                updates.duration = duration;
            }
        }

        const updatedCall = await this.callModel.findByIdAndUpdate(callId, updates, { new: true });

        if (!updatedCall) {
            throw new NotFoundException('Call not found');
        }

        return updatedCall;
    }

    /**
     * Get call history for a user
     */
    async getCallHistory(
        userId: string,
        page = 1,
        limit = 50,
    ): Promise<{ calls: CallDocument[]; total: number }> {
        const skip = (page - 1) * limit;
        const userObjectId = new Types.ObjectId(userId);

        const [calls, total] = await Promise.all([
            this.callModel
                .find({
                    $or: [{ callerId: userObjectId }, { receiverId: userObjectId }],
                    deletedAt: null,
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('callerId', 'username fullName avatar isVerified')
                .populate('receiverId', 'username fullName avatar isVerified')
                .exec(),
            this.callModel.countDocuments({
                $or: [{ callerId: userObjectId }, { receiverId: userObjectId }],
                deletedAt: null,
            }),
        ]);

        return { calls, total };
    }

    /**
     * Get missed calls count
     */
    async getMissedCallsCount(userId: string): Promise<number> {
        return this.callModel.countDocuments({
            receiverId: new Types.ObjectId(userId),
            status: CallStatus.MISSED,
            deletedAt: null,
        });
    }

    /**
     * Get a specific call
     */
    async getCall(callId: string): Promise<CallDocument> {
        const call = await this.callModel
            .findById(callId)
            .populate('callerId', 'username fullName avatar isVerified')
            .populate('receiverId', 'username fullName avatar isVerified')
            .exec();

        if (!call) {
            throw new NotFoundException('Call not found');
        }

        return call;
    }

    /**
     * Delete call from history
     */
    async deleteCall(userId: string, callId: string): Promise<void> {
        const call = await this.callModel.findById(callId);

        if (!call) {
            throw new NotFoundException('Call not found');
        }

        // Only participants can delete
        const isParticipant =
            call.callerId.toString() === userId ||
            call.receiverId.toString() === userId;

        if (!isParticipant) {
            throw new NotFoundException('Call not found');
        }

        await this.callModel.findByIdAndUpdate(callId, { deletedAt: new Date() });
    }

    /**
     * Get call statistics
     */
    async getCallStats(userId: string): Promise<{
        totalCalls: number;
        totalDuration: number;
        missedCalls: number;
        videoCalls: number;
        audioCalls: number;
    }> {
        const userObjectId = new Types.ObjectId(userId);

        const [stats] = await this.callModel.aggregate([
            {
                $match: {
                    $or: [{ callerId: userObjectId }, { receiverId: userObjectId }],
                    deletedAt: null,
                },
            },
            {
                $group: {
                    _id: null,
                    totalCalls: { $sum: 1 },
                    totalDuration: { $sum: '$duration' },
                    missedCalls: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', CallStatus.MISSED] },
                                1,
                                0,
                            ],
                        },
                    },
                    videoCalls: {
                        $sum: {
                            $cond: [
                                { $eq: ['$callType', 'video'] },
                                1,
                                0,
                            ],
                        },
                    },
                    audioCalls: {
                        $sum: {
                            $cond: [
                                { $eq: ['$callType', 'audio'] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);

        return stats || {
            totalCalls: 0,
            totalDuration: 0,
            missedCalls: 0,
            videoCalls: 0,
            audioCalls: 0,
        };
    }
}
