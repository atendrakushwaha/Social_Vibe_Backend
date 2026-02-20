import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
    constructor(private readonly cloudinaryService: CloudinaryService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Upload a file' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('file', {
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
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        let result;
        if (file.mimetype.startsWith('video/')) {
            result = await this.cloudinaryService.uploadVideo(file);
        } else {
            result = await this.cloudinaryService.uploadImage(file);
        }

        return {
            url: result.secure_url,
            filename: result.public_id,
            mimetype: file.mimetype,
            size: result.bytes,
        };
    }
}
