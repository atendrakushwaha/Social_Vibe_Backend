import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateConversationDto, SendMessageDto, MessageReactionDto, UpdateGroupDto } from './dto/message.dto';

@Injectable()
export class MessagesService {
    constructor(
        @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    ) { }

    /**
     * Create a new conversation (direct or group)
     */
    async createConversation(userId: string, dto: CreateConversationDto): Promise<ConversationDocument> {
        const participants = [...new Set([userId, ...dto.participantIds])];

        // For direct messages, check if conversation already exists
        if (dto.type === 'direct' || participants.length === 2) {
            const existing = await this.conversationModel.findOne({
                type: 'direct',
                participants: { $all: participants, $size: 2 },
                deletedAt: null,
            });

            if (existing) {
                return existing;
            }
        }

        const conversation = await this.conversationModel.create({
            participants: participants.map(id => new Types.ObjectId(id)),
            type: dto.type || (participants.length === 2 ? 'direct' : 'group'),
            groupName: dto.groupName,
            createdBy: new Types.ObjectId(userId),
            admins: dto.type === 'group' ? [new Types.ObjectId(userId)] : [],
        });

        return conversation.populate('participants', 'username fullName avatar isVerified');
    }

    /**
     * Get all conversations for a user
     */
    async getUserConversations(userId: string, page = 1, limit = 20): Promise<{ data: ConversationDocument[]; total: number; page: number; limit: number; hasMore: boolean }> {
        const skip = (page - 1) * limit;
        const userObjectId = new Types.ObjectId(userId);

        const [conversations, total] = await Promise.all([
            this.conversationModel
                .find({
                    participants: userObjectId,
                    deletedAt: null,
                })
                .sort({ lastMessageAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('participants', 'username fullName avatar isVerified lastSeen')
                .populate('lastMessageId')
                .exec(),
            this.conversationModel.countDocuments({
                participants: userObjectId,
                deletedAt: null,
            }),
        ]);

        return {
            data: conversations,
            total,
            page,
            limit,
            hasMore: skip + conversations.length < total
        };
    }

    /**
     * Get a single conversation by ID
     */
    async getConversation(userId: string, conversationId: string): Promise<ConversationDocument> {
        const conversation = await this.conversationModel
            .findOne({
                _id: new Types.ObjectId(conversationId),
                participants: new Types.ObjectId(userId),
                deletedAt: null,
            })
            .populate('participants', 'username fullName avatar isVerified lastSeen')
            .exec();

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return conversation;
    }

    /**
     * Send a message in a conversation
     */
    async sendMessage(userId: string, conversationId: string, dto: SendMessageDto): Promise<MessageDocument> {
        // Fetch conversation first to ensure it exists and get participants
        const conversation = await this.getConversation(userId, conversationId);

        const message = await this.messageModel.create({
            conversationId: new Types.ObjectId(conversationId),
            senderId: new Types.ObjectId(userId),
            type: dto.type,
            content: dto.content || '',
            attachments: dto.attachments || [],
            replyToId: dto.replyToId ? new Types.ObjectId(dto.replyToId) : undefined,
            isViewOnce: dto.isViewOnce || false,
        });

        // Update conversation's last message and unread counts
        conversation.lastMessageId = message._id as any;
        conversation.lastMessageText = dto.type === 'text' ? (dto.content || '') : `[${dto.type}]`;
        conversation.lastMessageAt = new Date();

        // Increment unread counts for all other participants
        conversation.participants.forEach((participant: any) => {
            const participantId = participant._id ? participant._id.toString() : participant.toString();
            if (participantId !== userId) {
                const currentCount = conversation.unreadCounts.get(participantId) || 0;
                conversation.unreadCounts.set(participantId, currentCount + 1);
            }
        });

        await conversation.save();

        return message.populate([
            { path: 'senderId', select: 'username fullName avatar isVerified' },
            { path: 'replyToId' },
        ]);
    }

    /**
     * Get messages in a conversation
     */
    async getMessages(
        userId: string,
        conversationId: string,
        page = 1,
        limit = 50
    ): Promise<{ data: MessageDocument[]; total: number; page: number; limit: number; hasMore: boolean }> {
        // Verify access by fetching conversation
        await this.getConversation(userId, conversationId);

        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            this.messageModel
                .find({
                    conversationId: new Types.ObjectId(conversationId),
                    deletedAt: null,
                    deletedFor: { $ne: new Types.ObjectId(userId) },
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('senderId', 'username fullName avatar isVerified')
                .populate('replyToId')
                .exec(),
            this.messageModel.countDocuments({
                conversationId: new Types.ObjectId(conversationId),
                deletedAt: null,
                deletedFor: { $ne: new Types.ObjectId(userId) },
            }),
        ]);

        return {
            data: messages.reverse(),
            total,
            page,
            limit,
            hasMore: skip + messages.length < total
        };
    }

    /**
     * Mark messages as read
     */
    async markAsRead(userId: string, conversationId: string, messageIds: string[]): Promise<void> {
        await this.getConversation(userId, conversationId);

        if (messageIds.length > 0) {
            await this.messageModel.updateMany(
                {
                    _id: { $in: messageIds.map(id => new Types.ObjectId(id)) },
                    conversationId: new Types.ObjectId(conversationId),
                    senderId: { $ne: new Types.ObjectId(userId) },
                },
                {
                    $addToSet: {
                        readBy: {
                            userId: new Types.ObjectId(userId),
                            readAt: new Date(),
                        },
                    },
                }
            );
        }

        // Reset unread count for this user
        // We need to fetch and save to update Map
        const conversation = await this.conversationModel.findById(conversationId);
        if (conversation) {
            conversation.unreadCounts.set(userId, 0);
            await conversation.save();
        }
    }

    /**
     * Add reaction to a message
     */
    async addReaction(userId: string, messageId: string, dto: MessageReactionDto): Promise<MessageDocument> {
        const message = await this.messageModel.findById(messageId);

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        message.reactions.set(userId, dto.emoji);
        await message.save();

        return message.populate('senderId', 'username fullName avatar');
    }

    /**
     * Remove reaction from a message
     */
    async removeReaction(userId: string, messageId: string): Promise<MessageDocument> {
        const message = await this.messageModel.findById(messageId);

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        message.reactions.delete(userId);
        await message.save();

        return message.populate('senderId', 'username fullName avatar');
    }

    /**
     * Delete a message (soft delete)
     */
    async deleteMessage(userId: string, messageId: string, deleteForEveryone = false): Promise<void> {
        const message = await this.messageModel.findById(messageId);

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        if (deleteForEveryone) {
            // Only sender can delete for everyone within 1 hour
            if (message.senderId.toString() !== userId) {
                throw new ForbiddenException('You can only delete your own messages');
            }

            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const messageDoc = message as any; // Cast to access timestamps
            if (messageDoc.createdAt && messageDoc.createdAt < oneHourAgo) {
                throw new BadRequestException('You can only unsend messages within 1 hour');
            }

            await this.messageModel.findByIdAndUpdate(messageId, { deletedAt: new Date() });
        } else {
            // Delete for self
            await this.messageModel.findByIdAndUpdate(messageId, {
                $addToSet: { deletedFor: new Types.ObjectId(userId) },
            });
        }
    }

    /**
     * Update group info (name, participants, admins)
     */
    async updateGroup(userId: string, conversationId: string, dto: UpdateGroupDto): Promise<ConversationDocument> {
        const conversation = await this.getConversation(userId, conversationId);

        if (conversation.type !== 'group') {
            throw new BadRequestException('Can only update group conversations');
        }

        // Check if user is admin
        const isAdmin = conversation.admins.some(admin => admin.toString() === userId);
        if (!isAdmin) {
            throw new ForbiddenException('Only group admins can update group info');
        }

        const updates: any = {};
        if (dto.groupName) updates.groupName = dto.groupName;
        if (dto.participantIds) {
            updates.participants = dto.participantIds.map(id => new Types.ObjectId(id));
        }
        if (dto.adminIds) {
            updates.admins = dto.adminIds.map(id => new Types.ObjectId(id));
        }

        const updatedConversation = await this.conversationModel
            .findByIdAndUpdate(conversationId, updates, { new: true })
            .populate('participants', 'username fullName avatar isVerified')
            .exec();

        if (!updatedConversation) {
            throw new NotFoundException('Conversation not found');
        }

        return updatedConversation;
    }

    /**
     * Leave a group conversation
     */
    async leaveGroup(userId: string, conversationId: string): Promise<void> {
        const conversation = await this.getConversation(userId, conversationId);

        if (conversation.type !== 'group') {
            throw new BadRequestException('Can only leave group conversations');
        }

        await this.conversationModel.findByIdAndUpdate(conversationId, {
            $pull: {
                participants: new Types.ObjectId(userId),
                admins: new Types.ObjectId(userId),
            },
        });
    }

    /**
     * Mute/unmute a conversation
     */
    async toggleMute(userId: string, conversationId: string, mute: boolean): Promise<void> {
        await this.getConversation(userId, conversationId);

        if (mute) {
            await this.conversationModel.findByIdAndUpdate(conversationId, {
                $addToSet: { mutedBy: new Types.ObjectId(userId) },
            });
        } else {
            await this.conversationModel.findByIdAndUpdate(conversationId, {
                $pull: { mutedBy: new Types.ObjectId(userId) },
            });
        }
    }

    /**
     * Get unread message count
     */
    async getUnreadCount(userId: string): Promise<number> {
        const conversations = await this.conversationModel.find({
            participants: new Types.ObjectId(userId),
            deletedAt: null,
        });

        let totalUnread = 0;
        for (const conv of conversations) {
            const count = conv.unreadCounts.get(userId) || 0;
            totalUnread += count;
        }

        return totalUnread;
    }
}
