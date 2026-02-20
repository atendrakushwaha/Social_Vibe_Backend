import { Controller, Get, Post, Patch, UseGuards, Request, Param, Query, Body, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService
  ) { }

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
    return this.usersService.getUserById(req.user.sub);
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
   * GET /users/search/query?q=query
   */
  @Get('search/query')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search users' })
  async searchUsers(@Query('q') query: string, @Request() req: any, @Query('page') page?: number) {
    return this.usersService.searchUsers(query, page, 20, req.user?.sub);
  }

  /**
   * Get user profile by username
   * GET /users/:username
   */
  @Get(':username')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile by username' })
  async getUserByUsername(@Param('username') username: string, @Request() req) {
    return this.usersService.getUserByUsername(username, req.user?.sub);
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
  @UseInterceptors(FileInterceptor('avatar'))
  async updateAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const result = await this.cloudinaryService.uploadImage(file);
    const avatarUrl = result.secure_url;

    return this.usersService.updateAvatar(req.user.sub, avatarUrl);
  }
}
