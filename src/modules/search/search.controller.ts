import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get('users')
    @ApiOperation({ summary: 'Search users' })
    @ApiQuery({ name: 'q', required: true })
    @ApiQuery({ name: 'limit', required: false })
    async searchUsers(
        @Query('q') query: string,
        @Query('limit') limit = 20,
    ) {
        return this.searchService.searchUsers(query, +limit);
    }

    @Get('hashtags')
    @ApiOperation({ summary: 'Search hashtags' })
    @ApiQuery({ name: 'q', required: true })
    @ApiQuery({ name: 'limit', required: false })
    async searchHashtags(
        @Query('q') query: string,
        @Query('limit') limit = 20,
    ) {
        return this.searchService.searchHashtags(query, +limit);
    }

    @Get('posts')
    @ApiOperation({ summary: 'Search posts' })
    @ApiQuery({ name: 'q', required: true })
    @ApiQuery({ name: 'limit', required: false })
    async searchPosts(
        @Query('q') query: string,
        @Query('limit') limit = 20,
    ) {
        return this.searchService.searchPosts(query, +limit);
    }

    @Get()
    @ApiOperation({ summary: 'Global search' })
    @ApiQuery({ name: 'q', required: true })
    async globalSearch(@Query('q') query: string) {
        return this.searchService.globalSearch(query);
    }
}
