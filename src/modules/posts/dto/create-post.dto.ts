import { IsString, IsArray, IsOptional, IsBoolean, IsEnum, MaxLength, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MediaItem, LocationTag } from '../schemas/post.schema';

export class CreatePostDto {
    @ApiProperty({
        description: 'Array of media items (images/videos)',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                url: { type: 'string' },
                type: { type: 'string', enum: ['image', 'video'] },
                thumbnail: { type: 'string' },
                altText: { type: 'string' }
            }
        }
    })
    @IsArray()
    media: MediaItem[];

    @ApiPropertyOptional({ description: 'Post caption', maxLength: 2200 })
    @IsString()
    @IsOptional()
    @MaxLength(2200)
    caption?: string;

    @ApiPropertyOptional({ description: 'Location tag' })
    @IsObject()
    @IsOptional()
    location?: LocationTag;

    @ApiPropertyOptional({ description: 'Disable comments', default: false })
    @IsBoolean()
    @IsOptional()
    commentsDisabled?: boolean;

    @ApiPropertyOptional({ description: 'Hide like count', default: false })
    @IsBoolean()
    @IsOptional()
    likesHidden?: boolean;

    @ApiPropertyOptional({
        description: 'Post visibility',
        enum: ['public', 'followers', 'close_friends'],
        default: 'public'
    })
    @IsEnum(['public', 'followers', 'close_friends'])
    @IsOptional()
    visibility?: string;
}
