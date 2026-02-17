import { Controller, Get, Post, Patch, UseGuards, Request, Param, Query, Body, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile (Protected)' })
  @ApiResponse({
    status: 200,
    description: 'Returns the authenticated user profile'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token'
  })
  async getProfile(@Request() req: any) {
    return {
      userId: req.user.userId,
      email: req.user.email,
    };
  }

  /**
   * Get suggested users
   * GET /users/suggestions
   */
  @Get('suggestions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get suggested users to follow' })
  async getSuggestions(
    @Request() req,
    @Query('limit') limit = 5,
  ) {
    return this.usersService.getSuggestions(req.user.sub, +limit);
  }

  /**
   * Search users
   * GET /users/search?q=query
   */
  @Get('search/query')
  @ApiOperation({ summary: 'Search users' })
  async searchUsers(@Query('q') query: string, @Query('page') page?: number) {
    return this.usersService.searchUsers(query, page);
  }

  /**
   * Get user profile by username
   * GET /users/:username
   */
  @Get(':username')
  @ApiOperation({ summary: 'Get user profile by username' })
  async getUserByUsername(@Param('username') username: string) {
    return this.usersService.getUserByUsername(username);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile info' })
  async updateProfile(@Request() req, @Body() body: any) {
    return this.usersService.updateProfile(req.user.sub, body);
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
        cb(null, `avatar-${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async updateAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const avatarUrl = `${process.env.APP_URL || 'http://localhost:3000'}/uploads/${file.filename}`;
    return this.usersService.updateAvatar(req.user.sub, avatarUrl);
  }
}
