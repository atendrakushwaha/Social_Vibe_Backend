import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateConversationDto, SendMessageDto, MessageReactionDto, UpdateGroupDto } from './dto/message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { ChatGateway } from './chat.gateway';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(
        private readonly messagesService: MessagesService,
        private readonly chatGateway: ChatGateway,
    ) { }

    /**
     * Create a new conversation
     * POST /messages/conversations
     */
    @Post('conversations')
    async createConversation(@Request() req, @Body() dto: CreateConversationDto) {
        return this.messagesService.createConversation(req.user.sub, dto);
    }

    /**
     * Get all conversations for the current user
     * GET /messages/conversations
     */
    @Get('conversations')
    async getConversations(
        @Request() req,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.messagesService.getUserConversations(req.user.sub, page, limit);
    }

    /**
     * Get a specific conversation
     * GET /messages/conversations/:id
     */
    @Get('conversations/:id')
    async getConversation(@Request() req, @Param('id') conversationId: string) {
        return this.messagesService.getConversation(req.user.sub, conversationId);
    }

    /**
     * Update group conversation
     * PATCH /messages/conversations/:id
     */
    @Patch('conversations/:id')
    async updateGroup(
        @Request() req,
        @Param('id') conversationId: string,
        @Body() dto: UpdateGroupDto,
    ) {
        return this.messagesService.updateGroup(req.user.sub, conversationId, dto);
    }

    /**
     * Leave a group
     * POST /messages/conversations/:id/leave
     */
    @Post('conversations/:id/leave')
    async leaveGroup(@Request() req, @Param('id') conversationId: string) {
        await this.messagesService.leaveGroup(req.user.sub, conversationId);
        return { message: 'Left group successfully' };
    }

    /**
     * Mute/unmute conversation
     * PATCH /messages/conversations/:id/mute
     */
    @Patch('conversations/:id/mute')
    async toggleMute(
        @Request() req,
        @Param('id') conversationId: string,
        @Body('mute') mute: boolean,
    ) {
        await this.messagesService.toggleMute(req.user.sub, conversationId, mute);
        return { message: mute ? 'Conversation muted' : 'Conversation unmuted' };
    }

    /**
     * Get messages in a conversation
     * GET /messages/conversations/:id/messages
     */
    @Get('conversations/:id/messages')
    async getMessages(
        @Request() req,
        @Param('id') conversationId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.messagesService.getMessages(req.user.sub, conversationId, page, limit);
    }

    /**
     * Send a message
     * POST /messages/conversations/:id/messages
     */
    @Post('conversations/:id/messages')
    async sendMessage(
        @Request() req,
        @Param('id') conversationId: string,
        @Body() dto: SendMessageDto,
    ) {
        const message = await this.messagesService.sendMessage(req.user.sub, conversationId, dto);
        this.chatGateway.broadcastMessage(message);
        return message;
    }

    /**
     * Mark messages as read
     * PATCH /messages/conversations/:id/read
     */
    @Patch('conversations/:id/read')
    async markAsRead(
        @Request() req,
        @Param('id') conversationId: string,
        @Body('messageIds') messageIds: string[],
    ) {
        await this.messagesService.markAsRead(req.user.sub, conversationId, messageIds);
        return { message: 'Messages marked as read' };
    }

    /**
     * Add reaction to message
     * POST /messages/:id/reactions
     */
    @Post(':id/reactions')
    async addReaction(
        @Request() req,
        @Param('id') messageId: string,
        @Body() dto: MessageReactionDto,
    ) {
        return this.messagesService.addReaction(req.user.sub, messageId, dto);
    }

    /**
     * Remove reaction from message
     * DELETE /messages/:id/reactions
     */
    @Delete(':id/reactions')
    async removeReaction(@Request() req, @Param('id') messageId: string) {
        return this.messagesService.removeReaction(req.user.sub, messageId);
    }

    /**
     * Delete a message
     * DELETE /messages/:id
     */
    @Delete(':id')
    async deleteMessage(
        @Request() req,
        @Param('id') messageId: string,
        @Query('forEveryone') forEveryone?: string,
    ) {
        await this.messagesService.deleteMessage(
            req.user.sub,
            messageId,
            forEveryone === 'true',
        );
        return { message: 'Message deleted' };
    }

    /**
     * Get unread message count
     * GET /messages/unread/count
     */
    @Get('unread/count')
    async getUnreadCount(@Request() req) {
        const count = await this.messagesService.getUnreadCount(req.user.sub);
        return { count };
    }
}
