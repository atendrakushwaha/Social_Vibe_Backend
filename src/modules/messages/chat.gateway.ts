import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../messages/messages.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CallsService } from '../calls/calls.service';
import { CallStatus } from '../calls/schemas/call.schema';

interface OnlineUser {
    userId: string;
    socketId: string;
    lastSeen: Date;
}

interface TypingStatus {
    conversationId: string;
    userId: string;
    username: string;
    isTyping: boolean;
}

interface VideoCallSignal {
    callId: string;
    dbCallId?: string; // Database ID
    from: string;
    to: string;
    signal: any;
    callType: 'video' | 'audio';
}

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);
    private onlineUsers = new Map<string, OnlineUser>(); // socketId -> user info
    private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
    private activeCalls = new Map<string, VideoCallSignal>(); // callId -> call info

    constructor(
        private jwtService: JwtService,
        private messagesService: MessagesService,
        private callsService: CallsService,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    /**
     * Handle client connection
     */
    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                client.emit('auth_error', { message: 'No token provided' });
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            const userId = payload.sub;

            // Store user as online
            this.onlineUsers.set(client.id, {
                userId,
                socketId: client.id,
                lastSeen: new Date(),
            });

            // Track multiple sockets per user (multiple devices)
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId)!.add(client.id);

            // Update user's last seen
            await this.userModel.findByIdAndUpdate(userId, { lastSeen: new Date() });

            // Join user's personal room for direct notifications
            client.join(`user:${userId}`);

            // Notify others that user is online
            this.server.emit('user:online', { userId, timestamp: new Date() });

            this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
        } catch (error) {
            this.logger.error('Authentication failed', error);
            client.emit('auth_error', { message: 'Invalid token' });
            client.disconnect();
        }
    }

    /**
     * Handle client disconnection
     */
    async handleDisconnect(client: Socket) {
        const user = this.onlineUsers.get(client.id);

        if (user) {
            const { userId, socketId } = user;

            // Remove from online users
            this.onlineUsers.delete(client.id);

            // Remove socket from user's socket set
            const userSocketSet = this.userSockets.get(userId);
            if (userSocketSet) {
                userSocketSet.delete(socketId);

                // If no more sockets, user is offline
                if (userSocketSet.size === 0) {
                    this.userSockets.delete(userId);

                    // Update last seen
                    await this.userModel.findByIdAndUpdate(userId, { lastSeen: new Date() });

                    // Notify others that user is offline
                    this.server.emit('user:offline', { userId, timestamp: new Date() });
                }
            }

            this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);
        }
    }

    /**
     * Send a message (real-time)
     */
    @SubscribeMessage('message:send')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string; type: string; content?: string; attachments?: any[] },
    ) {
        const user = this.onlineUsers.get(client.id);
        if (!user) return;

        try {
            // Save message to database
            const message = await this.messagesService.sendMessage(user.userId, data.conversationId, {
                type: data.type,
                content: data.content,
                attachments: data.attachments,
            });

            // Broadcast using helper
            await this.broadcastMessage(message);

            return { success: true, message };
        } catch (error) {
            this.logger.error('Error sending message', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Broadcast a message to all participants
     */
    async broadcastMessage(message: any) {
        try {
            const conversationId = message.conversationId;
            const senderId = typeof message.senderId === 'object' ? message.senderId._id : message.senderId;

            // Need to fetch conversation to get participants
            const conversation = await this.messagesService.getConversation(senderId.toString(), conversationId.toString());

            // Emit to all participants
            conversation.participants.forEach((participant: any) => {
                const participantId = participant._id.toString();
                this.server.to(`user:${participantId}`).emit('message:new', {
                    message,
                    conversationId: conversationId.toString(),
                });
            });
        } catch (error) {
            this.logger.error('Failed to broadcast message', error);
        }
    }

    /**
     * Typing indicator
     */
    @SubscribeMessage('typing:start')
    handleTypingStart(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string; username: string },
    ) {
        const user = this.onlineUsers.get(client.id);
        if (!user) return;

        // Broadcast to conversation participants (except sender)
        client.to(`conversation:${data.conversationId}`).emit('typing:update', {
            conversationId: data.conversationId,
            userId: user.userId,
            username: data.username,
            isTyping: true,
        });
    }

    @SubscribeMessage('typing:stop')
    handleTypingStop(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        const user = this.onlineUsers.get(client.id);
        if (!user) return;

        client.to(`conversation:${data.conversationId}`).emit('typing:update', {
            conversationId: data.conversationId,
            userId: user.userId,
            isTyping: false,
        });
    }

    /**
     * Join a conversation room
     */
    @SubscribeMessage('conversation:join')
    handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        client.join(`conversation:${data.conversationId}`);
        return { success: true };
    }

    /**
     * Leave a conversation room
     */
    @SubscribeMessage('conversation:leave')
    handleLeaveConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        client.leave(`conversation:${data.conversationId}`);
        return { success: true };
    }

    /**
     * Mark message as read
     */
    @SubscribeMessage('message:read')
    async handleMessageRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string; messageIds: string[] },
    ) {
        const user = this.onlineUsers.get(client.id);
        if (!user) return;

        try {
            await this.messagesService.markAsRead(user.userId, data.conversationId, data.messageIds);

            // Notify sender that message was read
            client.to(`conversation:${data.conversationId}`).emit('message:read:update', {
                conversationId: data.conversationId,
                messageIds: data.messageIds,
                readBy: user.userId,
                readAt: new Date(),
            });

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Message reaction
     */
    @SubscribeMessage('message:react')
    async handleMessageReaction(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { messageId: string; emoji: string; conversationId: string },
    ) {
        const user = this.onlineUsers.get(client.id);
        if (!user) return;

        try {
            const message = await this.messagesService.addReaction(user.userId, data.messageId, {
                emoji: data.emoji,
            });

            // Broadcast reaction to conversation
            this.server.to(`conversation:${data.conversationId}`).emit('message:reaction:update', {
                messageId: data.messageId,
                userId: user.userId,
                emoji: data.emoji,
                reactions: message.reactions,
            });

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ==================== VIDEO CALL SIGNALING ====================

    /**
     * Initiate a video/audio call
     */
    @SubscribeMessage('call:initiate')
    async handleCallInitiate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { to: string; callType: 'video' | 'audio'; signal: any },
    ) {
        const user = this.onlineUsers.get(client.id);
        if (!user) return { success: false, error: 'Not authenticated' };

        // Create call record in DB
        const dbCall = await this.callsService.createCall(user.userId, data.to, data.callType);
        const callId = dbCall._id.toString();

        const callSignal: VideoCallSignal = {
            callId,
            dbCallId: callId,
            from: user.userId,
            to: data.to,
            signal: data.signal,
            callType: data.callType,
        };

        this.activeCalls.set(callId, callSignal);

        // Send call request to recipient
        this.server.to(`user:${data.to}`).emit('call:incoming', {
            callId,
            from: user.userId,
            callType: data.callType,
            signal: data.signal,
            callerName: user.userId, // Ideally fetch username
        });

        return { success: true, callId };
    }

    /**
     * Answer a call
     */
    @SubscribeMessage('call:answer')
    async handleCallAnswer(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { callId: string; signal: any },
    ) {
        const user = this.onlineUsers.get(client.id);
        if (!user) return { success: false };

        const call = this.activeCalls.get(data.callId);
        if (!call) return { success: false, error: 'Call not found' };

        // Update DB status
        await this.callsService.updateCallStatus(data.callId, CallStatus.ANSWERED);

        // Send answer signal to caller
        this.server.to(`user:${call.from}`).emit('call:answered', {
            callId: data.callId,
            signal: data.signal,
            from: user.userId,
        });

        return { success: true };
    }

    /**
     * Reject a call
     */
    @SubscribeMessage('call:reject')
    async handleCallReject(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { callId: string },
    ) {
        const user = this.onlineUsers.get(client.id);
        if (!user) return { success: false };

        const call = this.activeCalls.get(data.callId);
        if (!call) return { success: false };

        // Notify caller
        this.server.to(`user:${call.from}`).emit('call:rejected', {
            callId: data.callId,
            by: user.userId,
        });

        // Update DB status
        await this.callsService.updateCallStatus(data.callId, CallStatus.REJECTED);

        this.activeCalls.delete(data.callId);
        return { success: true };
    }

    /**
     * End a call
     */
    @SubscribeMessage('call:end')
    async handleCallEnd(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { callId: string },
    ) {
        const user = this.onlineUsers.get(client.id);
        if (!user) return { success: false };

        const call = this.activeCalls.get(data.callId);
        if (!call) return { success: false };

        // Notify both parties
        this.server.to(`user:${call.from}`).emit('call:ended', { callId: data.callId });
        this.server.to(`user:${call.to}`).emit('call:ended', { callId: data.callId });

        // Update DB status
        await this.callsService.updateCallStatus(data.callId, CallStatus.ENDED);

        this.activeCalls.delete(data.callId);
        return { success: true };
    }

    /**
     * ICE candidate exchange for WebRTC
     */
    @SubscribeMessage('call:ice-candidate')
    handleIceCandidate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { callId: string; candidate: any; to: string },
    ) {
        // Forward ICE candidate to the other peer
        this.server.to(`user:${data.to}`).emit('call:ice-candidate', {
            callId: data.callId,
            candidate: data.candidate,
        });

        return { success: true };
    }

    /**
     * Toggle video/audio during call
     */
    @SubscribeMessage('call:toggle-media')
    handleToggleMedia(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { callId: string; to: string; mediaType: 'video' | 'audio'; enabled: boolean },
    ) {
        this.server.to(`user:${data.to}`).emit('call:media-toggled', {
            callId: data.callId,
            mediaType: data.mediaType,
            enabled: data.enabled,
        });

        return { success: true };
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Get online users
     */
    @SubscribeMessage('users:get-online')
    handleGetOnlineUsers() {
        const onlineUserIds = Array.from(this.userSockets.keys());
        return { onlineUsers: onlineUserIds };
    }

    /**
     * Check if user is online
     */
    isUserOnline(userId: string): boolean {
        return this.userSockets.has(userId);
    }

    /**
     * Send notification to specific user
     */
    sendToUser(userId: string, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
}
