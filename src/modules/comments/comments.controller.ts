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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Post('posts/:postId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add comment to post' })
    async create(
        @Param('postId') postId: string,
        @Body() dto: CreateCommentDto,
        @Request() req,
    ) {
        return this.commentsService.create(postId, req.user.sub, dto);
    }

    @Get('posts/:postId')
    @ApiOperation({ summary: 'Get post comments' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async findByPost(
        @Param('postId') postId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.commentsService.findByPostId(postId, +page, +limit);
    }

    @Get(':id/replies')
    @ApiOperation({ summary: 'Get comment replies' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async findReplies(
        @Param('id') id: string,
        @Query('page') page = 1,
        @Query('limit') limit = 10,
    ) {
        return this.commentsService.findReplies(id, +page, +limit);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update comment' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCommentDto,
        @Request() req,
    ) {
        return this.commentsService.update(id, req.user.sub, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete comment' })
    async remove(@Param('id') id: string, @Request() req) {
        await this.commentsService.delete(id, req.user.sub);
    }

    @Post(':id/pin')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Pin/unpin comment (post owner only)' })
    async pin(@Param('id') id: string, @Request() req) {
        return this.commentsService.pin(id, req.user.sub);
    }
}
