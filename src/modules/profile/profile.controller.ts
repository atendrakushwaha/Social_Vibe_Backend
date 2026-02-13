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

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // ✅ CREATE PROFILE + AVATAR
  @Post()
  @ApiOperation({ summary: 'Create user profile' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  create(
    @Req() req: any,
    @Body() dto: CreateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.profileService.create(
      req.user.userId,
      dto,
      file?.filename,
    );
  }

  // ✅ GET LOGGED-IN USER PROFILE
  @Get('me')
  @ApiOperation({ summary: 'Get my profile' })
  getMyProfile(@Req() req: any) {
    return this.profileService.getMyProfile(req.user.userId);
  }

  // ✅ UPDATE PROFILE + AVATAR
  @Patch()
  @ApiOperation({ summary: 'Update my profile' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', multerConfig))
  update(
    @Req() req: any,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.profileService.update(
      req.user.userId,
      dto,
      file?.filename,
    );
  }

  // ✅ DELETE PROFILE
  @Delete()
  @ApiOperation({ summary: 'Delete my profile' })
  remove(@Req() req: any) {
    return this.profileService.remove(req.user.userId);
  }
}
