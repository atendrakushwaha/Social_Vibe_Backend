import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UseGuards,
    Request,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Likes')
@Controller('likes')
export class LikesController {
    constructor(private readonly likesService: LikesService) { }

    @Post(':targetType/:targetId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Toggle like on post/comment/story/reel' })
    @ApiParam({ name: 'targetType', enum: ['posts', 'comments', 'stories', 'reels'] })
    async toggleLike(
        @Param('targetType') targetType: string,
        @Param('targetId') targetId: string,
        @Request() req,
    ) {
        const typeMap = {
            posts: 'Post',
            comments: 'Comment',
            stories: 'Story',
            reels: 'Reel',
        };

        const modelType = typeMap[targetType] as 'Post' | 'Comment' | 'Story' | 'Reel';
        return this.likesService.toggleLike(req.user.sub, targetId, modelType);
    }

    @Get(':targetType/:targetId')
    @ApiOperation({ summary: 'Get likers list' })
    @ApiParam({ name: 'targetType', enum: ['posts', 'comments', 'stories', 'reels'] })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getLikers(
        @Param('targetType') targetType: string,
        @Param('targetId') targetId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        const typeMap = {
            posts: 'Post',
            comments: 'Comment',
            stories: 'Story',
            reels: 'Reel',
        };

        return this.likesService.getLikers(targetId, typeMap[targetType], +page, +limit);
    }

    @Get(':targetType/:targetId/check')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check if user liked target' })
    @ApiParam({ name: 'targetType', enum: ['posts', 'comments', 'stories', 'reels'] })
    async checkLiked(
        @Param('targetType') targetType: string,
        @Param('targetId') targetId: string,
        @Request() req,
    ) {
        const typeMap = {
            posts: 'Post',
            comments: 'Comment',
            stories: 'Story',
            reels: 'Reel',
        };

        const liked = await this.likesService.checkLiked(
            req.user.sub,
            targetId,
            typeMap[targetType],
        );

        return { liked };
    }
}
