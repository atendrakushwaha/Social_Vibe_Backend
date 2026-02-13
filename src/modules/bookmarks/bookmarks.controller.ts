import { Controller, Get, Post, Delete, Param, UseGuards, Request, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Bookmarks')
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookmarksController {
    constructor(private readonly bookmarksService: BookmarksService) { }

    @Post(':postId')
    @ApiOperation({ summary: 'Save post' })
    async save(@Param('postId') postId: string, @Request() req) {
        return this.bookmarksService.save(req.user.sub, postId);
    }

    @Get()
    @ApiOperation({ summary: 'Get saved posts' })
    @ApiQuery({ name: 'collection', required: false })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async findAll(
        @Request() req,
        @Query('collection') collection?: string,
        @Query('page') page = 1,
        @Query('limit') limit = 12,
    ) {
        return this.bookmarksService.findByUserId(req.user.sub, collection, +page, +limit);
    }

    @Delete(':postId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove saved post' })
    async remove(@Param('postId') postId: string, @Request() req) {
        await this.bookmarksService.remove(req.user.sub, postId);
    }
}
