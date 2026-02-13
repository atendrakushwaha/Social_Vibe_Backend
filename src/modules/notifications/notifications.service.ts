import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    ) { }

    async create(
        userId: string,
        actorId: string,
        type: string,
        targetId?: string,
        targetType?: string,
        content?: string,
    ): Promise<NotificationDocument> {
        const notification = new this.notificationModel({
            userId: new Types.ObjectId(userId),
            actorId: new Types.ObjectId(actorId),
            type,
            targetId: targetId ? new Types.ObjectId(targetId) : null,
            targetType,
            content,
        });

        const saved = await notification.save();

        // TODO: Send via WebSocket
        // TODO: Send push notification

        return saved.populate('actorId', 'username fullName avatar isVerified');
    }

    async findByUserId(userId: string, page = 1, limit = 20): Promise<{ notifications: NotificationDocument[]; total: number; unreadCount: number }> {
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            this.notificationModel
                .find({ userId: new Types.ObjectId(userId), deletedAt: null })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('actorId', 'username fullName avatar isVerified')
                .exec(),
            this.notificationModel.countDocuments({ userId: new Types.ObjectId(userId), deletedAt: null }),
            this.notificationModel.countDocuments({ userId: new Types.ObjectId(userId), isRead: false, deletedAt: null }),
        ]);

        return { notifications, total, unreadCount };
    }

    async markAsRead(notificationId: string, userId: string): Promise<void> {
        await this.notificationModel.findOneAndUpdate(
            { _id: notificationId, userId: new Types.ObjectId(userId) },
            { isRead: true, readAt: new Date() },
        );
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationModel.updateMany(
            { userId: new Types.ObjectId(userId), isRead: false },
            { isRead: true, readAt: new Date() },
        );
    }

    async deleteNotification(notificationId: string, userId: string): Promise<void> {
        await this.notificationModel.findOneAndUpdate(
            { _id: notificationId, userId: new Types.ObjectId(userId) },
            { deletedAt: new Date() },
        );
    }
}
