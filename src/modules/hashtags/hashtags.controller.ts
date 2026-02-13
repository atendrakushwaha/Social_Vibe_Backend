import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HashtagsService } from './hashtags.service';

@ApiTags('Hashtags')
@Controller('hashtags')
export class HashtagsController {
    constructor(private readonly hashtagsService: HashtagsService) { }

    @Get('trending')
    @ApiOperation({ summary: 'Get trending hashtags' })
    @ApiQuery({ name: 'limit', required: false })
    async getTrending(@Query('limit') limit = 20) {
        return this.hashtagsService.getTrending(+limit);
    }

    @Get('search')
    @ApiOperation({ summary: 'Search hashtags' })
    @ApiQuery({ name: 'q', required: true })
    @ApiQuery({ name: 'limit', required: false })
    async search(
        @Query('q') query: string,
        @Query('limit') limit = 20,
    ) {
        return this.hashtagsService.search(query, +limit);
    }
}
