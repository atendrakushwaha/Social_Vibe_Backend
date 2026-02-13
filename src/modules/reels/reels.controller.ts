import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, HttpCode, HttpStatus, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ReelsService } from './reels.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Reels')
@Controller('reels')
export class ReelsController {
    constructor(private readonly reelsService: ReelsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Upload reel (video + thumbnail)' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'video', maxCount: 1 },
            { name: 'thumbnail', maxCount: 1 },
        ], {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
            limits: {
                fileSize: 100 * 1024 * 1024, // 100MB
            },
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4|mov|avi|webp)$/)) {
                    return cb(
                        new BadRequestException('Only image and video files are allowed!'),
                        false,
                    );
                }
                cb(null, true);
            },
        }),
    )
    async create(
        @Request() req,
        @Body() body: any,
        @UploadedFiles() files: { video?: Express.Multer.File[], thumbnail?: Express.Multer.File[] }
    ) {
        const videoFile = files?.video?.[0];
        const thumbnailFile = files?.thumbnail?.[0];

        let videoUrl = body.videoUrl;
        let thumbnailUrl = body.thumbnailUrl;

        const baseUrl = process.env.APP_URL || 'http://localhost:3000';

        if (videoFile) {
            videoUrl = `${baseUrl}/uploads/${videoFile.filename}`;
        }

        if (thumbnailFile) {
            thumbnailUrl = `${baseUrl}/uploads/${thumbnailFile.filename}`;
        }

        if (!videoUrl) {
            throw new BadRequestException('Video is required (either file upload or videoUrl)');
        }
        if (!thumbnailUrl) {
            thumbnailUrl = '';
        }

        return this.reelsService.create(req.user.sub, videoUrl, thumbnailUrl, body.caption);
    }

    @Get()
    @ApiOperation({ summary: 'Get reels feed' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async findAll(
        @Query('page') page = 1,
        @Query('limit') limit = 10,
    ) {
        return this.reelsService.findAll(+page, +limit);
    }

    @Get('trending')
    @ApiOperation({ summary: 'Get trending reels' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getTrending(
        @Query('page') page = 1,
        @Query('limit') limit = 10,
    ) {
        return this.reelsService.getTrending(+page, +limit);
    }

    @Post(':id/view')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Increment reel view' })
    async incrementView(@Param('id') id: string) {
        await this.reelsService.incrementView(id);
        return { message: 'View recorded' };
    }

    @Post(':id/like')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Like/Unlike a reel' })
    async toggleLike(@Request() req, @Param('id') id: string) {
        return this.reelsService.toggleLike(req.user.sub, id);
    }

    @Post(':id/comments')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add comment to reel' })
    async addComment(@Request() req, @Param('id') id: string, @Body() body: { content: string }) {
        if (!body.content) throw new BadRequestException('Content is required');
        return this.reelsService.addComment(req.user.sub, id, body.content);
    }

    @Get(':id/comments')
    @ApiOperation({ summary: 'Get reel comments' })
    async getComments(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
        return this.reelsService.getComments(id, +page, +limit);
    }
}
