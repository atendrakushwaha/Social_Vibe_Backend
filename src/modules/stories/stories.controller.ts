import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Stories')
@Controller('stories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StoriesController {
    constructor(private readonly storiesService: StoriesService) { }

    /**
     * Upload story media
     * POST /stories/upload
     */
    @Post('upload')
    @ApiOperation({ summary: 'Upload story media' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('media', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    cb(null, `story-${randomName}${extname(file.originalname)}`);
                },
            }),
            limits: { fileSize: 100 * 1024 * 1024 },
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4|mov|avi|webp|webm)$/)) {
                    return cb(new BadRequestException('Only image and video files are allowed!'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadMedia(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        const fileUrl = `${process.env.APP_URL || 'http://localhost:3000'}/uploads/${file.filename}`;
        return { url: fileUrl };
    }

    /**
     * Create story
     * POST /stories
     */
    @Post()
    @ApiOperation({ summary: 'Create story' })
    async create(@Request() req, @Body() body: any) {
        return this.storiesService.create(req.user.sub, body);
    }

    /**
     * Get active stories feed
     * GET /stories
     */
    @Get()
    @ApiOperation({ summary: 'Get active stories feed' })
    async getActive(@Request() req) {
        return this.storiesService.findActiveStories(req.user.sub);
    }

    /**
     * Get user stories by username
     * GET /stories/user/:username
     */
    @Get('user/:username')
    @ApiOperation({ summary: 'Get user stories' })
    async getUserStories(@Param('username') username: string, @Request() req) {
        return this.storiesService.findUserStories(username, req.user.sub);
    }

    /**
     * Mark story as viewed
     * POST /stories/:id/view
     */
    @Post(':id/view')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark story as viewed' })
    async view(@Param('id') id: string, @Request() req) {
        await this.storiesService.viewStory(id, req.user.sub);
        return { message: 'Story viewed' };
    }

    /**
     * Get story views
     * GET /stories/:id/views
     */
    @Get(':id/views')
    @ApiOperation({ summary: 'Get story views' })
    async getViews(@Param('id') id: string, @Request() req) {
        return this.storiesService.getStoryViews(id, req.user.sub);
    }

    /**
     * Delete story
     * DELETE /stories/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete story' })
    async delete(@Param('id') id: string, @Request() req) {
        await this.storiesService.deleteStory(id, req.user.sub);
    }
}
