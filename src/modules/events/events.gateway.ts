import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private userSockets: Map<string, string> = new Map(); // userId -> socketId

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);

        // Extract userId from auth (you need to implement JWT verification)
        const userId = client.handshake.auth?.userId || client.handshake.query?.userId;

        if (userId) {
            this.userSockets.set(userId as string, client.id);

            // Emit online status
            this.server.emit('user:online', { userId });
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);

        // Find and remove user
        for (const [userId, socketId] of this.userSockets.entries()) {
            if (socketId === client.id) {
                this.userSockets.delete(userId);

                // Emit offline status
                this.server.emit('user:offline', { userId });
                break;
            }
        }
    }

    // Send notification to specific user
    sendNotificationToUser(userId: string, notification: any) {
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            this.server.to(socketId).emit('notification', notification);
        }
    }

    // Send message to specific user
    sendMessageToUser(userId: string, message: any) {
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            this.server.to(socketId).emit('message', message);
        }
    }

    // Typing indicator
    @SubscribeMessage('typing:start')
    handleTypingStart(
        @MessageBody() data: { conversationId: string; userId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.to(data.conversationId).emit('typing:start', {
            conversationId: data.conversationId,
            userId: data.userId,
        });
    }

    @SubscribeMessage('typing:stop')
    handleTypingStop(
        @MessageBody() data: { conversationId: string; userId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.to(data.conversationId).emit('typing:stop', {
            conversationId: data.conversationId,
            userId: data.userId,
        });
    }

    // Join conversation room
    @SubscribeMessage('conversation:join')
    handleJoinConversation(
        @MessageBody() data: { conversationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.join(data.conversationId);
    }

    // Leave conversation room
    @SubscribeMessage('conversation:leave')
    handleLeaveConversation(
        @MessageBody() data: { conversationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.leave(data.conversationId);
    }

    // Send message to conversation
    sendMessageToConversation(conversationId: string, message: any) {
        this.server.to(conversationId).emit('message:new', message);
    }

    // Message read receipt
    @SubscribeMessage('message:read')
    handleMessageRead(
        @MessageBody() data: { conversationId: string; messageId: string; userId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.to(data.conversationId).emit('message:read', {
            conversationId: data.conversationId,
            messageId: data.messageId,
            userId: data.userId,
            readAt: new Date(),
        });
    }

    // Live post engagement
    @SubscribeMessage('post:like')
    handlePostLike(
        @MessageBody() data: { postId: string; userId: string },
    ) {
        this.server.emit(`post:${data.postId}:like`, {
            userId: data.userId,
            timestamp: new Date(),
        });
    }

    @SubscribeMessage('post:comment')
    handlePostComment(
        @MessageBody() data: { postId: string; comment: any },
    ) {
        this.server.emit(`post:${data.postId}:comment`, data.comment);
    }

    // Story view notification
    sendStoryView(storyOwnerId: string, viewerData: any) {
        const socketId = this.userSockets.get(storyOwnerId);
        if (socketId) {
            this.server.to(socketId).emit('story:view', viewerData);
        }
    }

    // Check if user is online
    isUserOnline(userId: string): boolean {
        return this.userSockets.has(userId);
    }

    // Get online users count
    getOnlineUsersCount(): number {
        return this.userSockets.size;
    }
}
