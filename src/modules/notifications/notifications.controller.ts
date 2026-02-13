import { Controller, Get, Patch, Delete, Param, UseGuards, Request, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get user notifications' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async findAll(
        @Request() req,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.notificationsService.findByUserId(req.user.sub, +page, +limit);
    }

    @Patch(':id/read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark notification as read' })
    async markAsRead(@Param('id') id: string, @Request() req) {
        await this.notificationsService.markAsRead(id, req.user.sub);
        return { message: 'Marked as read' };
    }

    @Patch('read-all')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark all notifications as read' })
    async markAllAsRead(@Request() req) {
        await this.notificationsService.markAllAsRead(req.user.sub);
        return { message: 'All marked as read' };
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete notification' })
    async remove(@Param('id') id: string, @Request() req) {
        await this.notificationsService.deleteNotification(id, req.user.sub);
    }
}
