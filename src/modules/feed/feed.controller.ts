import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Feed')
@Controller('feed')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedController {
    constructor(private readonly feedService: FeedService) { }

    @Get()
    @ApiOperation({ summary: 'Get personalized feed' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getPersonalized(
        @Request() req,
        @Query('page') page = 1,
        @Query('limit') limit = 10,
    ) {
        return this.feedService.getPersonalizedFeed(req.user.sub, +page, +limit);
    }

    @Get('following')
    @ApiOperation({ summary: 'Get following feed (chronological)' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getFollowing(
        @Request() req,
        @Query('page') page = 1,
        @Query('limit') limit = 10,
    ) {
        return this.feedService.getFollowingFeed(req.user.sub, +page, +limit);
    }

    @Get('explore')
    @ApiOperation({ summary: 'Get explore feed' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getExplore(
        @Request() req,
        @Query('page') page = 1,
        @Query('limit') limit = 12,
    ) {
        return this.feedService.getExploreFeed(req.user.sub, +page, +limit);
    }
}
