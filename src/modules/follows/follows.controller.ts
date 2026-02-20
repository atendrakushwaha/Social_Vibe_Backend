import {
    Controller,
    Post,
    Delete,
    Get,
    Param,
    UseGuards,
    Request,
    Query,
    HttpCode,
    HttpStatus,
    Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Follows')
@Controller('follows')
export class FollowsController {
    constructor(private readonly followsService: FollowsService) { }

    @Post(':userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Follow user or send follow request' })
    async follow(
        @Param('userId') userId: string,
        @Request() req,
    ) {
        // TODO: Get target user's privacy setting from Users service
        const isTargetPrivate = false; // Placeholder
        return this.followsService.followUser(req.user.sub, userId, isTargetPrivate);
    }

    @Delete(':userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Unfollow user' })
    async unfollow(
        @Param('userId') userId: string,
        @Request() req,
    ) {
        await this.followsService.unfollowUser(req.user.sub, userId);
    }

    @Get('followers/:userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user followers' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getFollowers(
        @Param('userId') userId: string,
        @Request() req,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.followsService.getFollowers(userId, +page, +limit, req.user?.sub);
    }

    @Get('following/:userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user following' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getFollowing(
        @Param('userId') userId: string,
        @Request() req,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.followsService.getFollowing(userId, +page, +limit, req.user?.sub);
    }

    @Get('requests')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get pending follow requests' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getRequests(
        @Request() req,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.followsService.getFollowRequests(req.user.sub, +page, +limit);
    }

    @Patch('requests/:requestId/accept')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Accept follow request' })
    async acceptRequest(
        @Param('requestId') requestId: string,
        @Request() req,
    ) {
        return this.followsService.acceptFollowRequest(requestId, req.user.sub);
    }

    @Delete('requests/:requestId/reject')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Reject follow request' })
    async rejectRequest(
        @Param('requestId') requestId: string,
        @Request() req,
    ) {
        await this.followsService.rejectFollowRequest(requestId, req.user.sub);
    }

    @Get('status/:userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get follow status with user' })
    async getStatus(
        @Param('userId') userId: string,
        @Request() req,
    ) {
        return this.followsService.getFollowStatus(req.user.sub, userId);
    }
}
