import { Controller, Get, UseGuards, Request, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
}
