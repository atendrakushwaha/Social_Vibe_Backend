import { IsNotEmpty, IsString, IsArray, IsOptional, IsEnum, MaxLength, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConversationDto {
    @IsArray()
    @IsNotEmpty()
    participantIds: string[];

    @IsEnum(['direct', 'group'])
    @IsOptional()
    type?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    groupName?: string;
}

export class SendMessageDto {
    @IsEnum(['text', 'image', 'video', 'voice', 'post', 'reel', 'story', 'profile'])
    @IsNotEmpty()
    type: string;

    @IsString()
    @MaxLength(5000)
    @IsOptional()
    content?: string;

    @IsArray()
    @IsOptional()
    attachments?: Array<{
        type: string;
        url?: string;
        thumbnail?: string;
        duration?: number;
        referenceId?: string;
    }>;

    @IsString()
    @IsOptional()
    replyToId?: string;

    @IsBoolean()
    @IsOptional()
    isViewOnce?: boolean;
}

export class MessageReactionDto {
    @IsString()
    @IsNotEmpty()
    emoji: string;
}

export class MarkAsReadDto {
    @IsArray()
    @IsNotEmpty()
    messageIds: string[];
}

export class UpdateGroupDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    groupName?: string;

    @IsArray()
    @IsOptional()
    participantIds?: string[];

    @IsArray()
    @IsOptional()
    adminIds?: string[];
}
