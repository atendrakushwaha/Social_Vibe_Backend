import { 
  Controller, Get, Post as HttpPost, Patch, Delete, Param, Body, UseGuards, Req, UploadedFile, UseInterceptors 
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { multerConfig } from '../../common/multer/multer.config';

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @HttpPost()
  @ApiOperation({ summary: 'Create a new post with image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  create(
    @Req() req: any,
    @Body() dto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.postsService.create(req.user.userId, dto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by id' })
  findById(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post' })
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  remove(@Param('id') id: string) {
    return this.postsService.delete(id);
  }

  @Patch(':id/like')
  @ApiOperation({ summary: 'Like a post' })
  like(@Param('id') id: string, @Req() req: any) {
    return this.postsService.likePost(id, req.user.userId);
  }

  @Patch(':id/unlike')
  @ApiOperation({ summary: 'Unlike a post' })
  unlike(@Param('id') id: string, @Req() req: any) {
    return this.postsService.unlikePost(id, req.user.userId);
  }
}
