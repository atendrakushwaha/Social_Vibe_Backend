import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
    @ApiPropertyOptional({ description: 'Updated caption', maxLength: 2200 })
    @IsString()
    @IsOptional()
    @MaxLength(2200)
    caption?: string;

    @ApiPropertyOptional({ description: 'Update location' })
    @IsOptional()
    location?: any;

    @ApiPropertyOptional({ description: 'Disable/enable comments' })
    @IsBoolean()
    @IsOptional()
    commentsDisabled?: boolean;

    @ApiPropertyOptional({ description: 'Hide/show like count' })
    @IsBoolean()
    @IsOptional()
    likesHidden?: boolean;

    @ApiPropertyOptional({ description: 'Archive/unarchive post' })
    @IsBoolean()
    @IsOptional()
    isArchived?: boolean;
}
