import {
  Body,
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { multerConfig } from '../../common/multer/multer.config';

import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly cloudinaryService: CloudinaryService
  ) { }

  // ✅ CREATE PROFILE + AVATAR
  @Post()
  @ApiOperation({ summary: 'Create user profile' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  async create(
    @Req() req: any,
    @Body() dto: CreateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let avatarUrl: string | undefined;
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file);
      avatarUrl = result.secure_url;
    }

    return this.profileService.create(
      req.user.userId,
      dto,
      avatarUrl,
    );
  }

  // ✅ GET LOGGED-IN USER PROFILE
  @Get('me')
  @ApiOperation({ summary: 'Get my profile' })
  getMyProfile(@Req() req: any) {
    return this.profileService.getMyProfile(req.user.userId);
  }

  // ✅ GET PROFILE BY USERNAME
  @Get(':username')
  @ApiOperation({ summary: 'Get profile by username' })
  getProfileByUsername(@Param('username') username: string, @Req() req: any) {
    return this.profileService.getProfileByUsername(username, req.user?.userId || req.user?.sub);
  }

  // ✅ UPDATE PROFILE + AVATAR
  @Patch()
  @ApiOperation({ summary: 'Update my profile' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  async update(
    @Req() req: any,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let avatarUrl: string | undefined;
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file);
      avatarUrl = result.secure_url;
    }

    return this.profileService.update(
      req.user.userId,
      dto,
      avatarUrl,
    );
  }

  // ✅ DELETE PROFILE
  @Delete()
  @ApiOperation({ summary: 'Delete my profile' })
  remove(@Req() req: any) {
    return this.profileService.remove(req.user.userId);
  }
}
