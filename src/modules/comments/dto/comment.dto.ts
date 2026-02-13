import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
    @ApiProperty({ description: 'Comment content', maxLength: 2200 })
    @IsString()
    @MaxLength(2200)
    content: string;

    @ApiPropertyOptional({ description: 'Parent comment ID for replies' })
    @IsString()
    @IsOptional()
    parentId?: string;
}

export class UpdateCommentDto {
    @ApiProperty({ description: 'Updated comment content', maxLength: 2200 })
    @IsString()
    @MaxLength(2200)
    content: string;
}
