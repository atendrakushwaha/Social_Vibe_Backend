import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new post' })
    @ApiResponse({ status: 201, description: 'Post created successfully' })
    async create(@Request() req, @Body() createPostDto: CreatePostDto) {
        return this.postsService.create(req.user.sub, createPostDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get post by ID' })
    @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
    async findOne(@Param('id') id: string, @Request() req) {
        const userId = req.user?.sub;
        return this.postsService.findById(id, userId);
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Get user posts by userId' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async findByUser(
        @Param('userId') userId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 12,
        @Request() req,
    ) {
        const currentUserId = req.user?.sub;
        return this.postsService.findByUserId(userId, currentUserId, +page, +limit);
    }

    @Get('username/:username')
    @ApiOperation({ summary: 'Get user posts by username' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async findByUsername(
        @Param('username') username: string,
        @Query('page') page = 1,
        @Query('limit') limit = 12,
        @Request() req,
    ) {
        const currentUserId = req.user?.sub;
        return this.postsService.findByUsername(username, currentUserId, +page, +limit);
    }

    @Get('hashtag/:hashtag')
    @ApiOperation({ summary: 'Get posts by hashtag' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async findByHashtag(
        @Param('hashtag') hashtag: string,
        @Query('page') page = 1,
        @Query('limit') limit = 12,
    ) {
        return this.postsService.findByHashtag(hashtag, +page, +limit);
    }

    @Get('trending')
    @ApiOperation({ summary: 'Get trending posts' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getTrending(
        @Query('page') page = 1,
        @Query('limit') limit = 12,
    ) {
        return this.postsService.getTrending(+page, +limit);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update post' })
    async update(
        @Param('id') id: string,
        @Body() updatePostDto: UpdatePostDto,
        @Request() req,
    ) {
        return this.postsService.update(id, req.user.sub, updatePostDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete post' })
    async remove(@Param('id') id: string, @Request() req) {
        await this.postsService.delete(id, req.user.sub);
    }

    @Post(':id/like')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Like a post' })
    async likePost(@Param('id') id: string, @Request() req) {
        // Use actual likes service to persist in database
        const result = await this.postsService.likePost(id, req.user.sub);
        return { message: 'Post liked', success: true, ...result };
    }

    @Delete(':id/like')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Unlike a post' })
    async unlikePost(@Param('id') id: string, @Request() req) {
        // Use actual likes service to persist in database
        const result = await this.postsService.unlikePost(id, req.user.sub);
        return { message: 'Post unliked', success: true, ...result };
    }

    @Get(':id/comments')
    @ApiOperation({ summary: 'Get post comments' })
    @ApiQuery({ name: 'page', required: false })
    async getComments(
        @Param('id') id: string,
        @Query('page') page = 1,
    ) {
        return this.postsService.getComments(id, +page);
    }

    @Post(':id/comments')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add comment to post' })
    async addComment(
        @Param('id') id: string,
        @Body() body: { content: string },
        @Request() req,
    ) {
        return this.postsService.addComment(id, req.user.sub, body.content);
    }

    @Post(':id/view')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Increment post view count' })
    async incrementView(@Param('id') id: string) {
        await this.postsService.incrementViewCount(id);
        return { message: 'View recorded' };
    }
}
