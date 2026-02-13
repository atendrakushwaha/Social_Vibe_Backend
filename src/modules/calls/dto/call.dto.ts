import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { CallStatus } from '../schemas/call.schema';

export class InitiateCallDto {
    @IsNotEmpty()
    @IsString()
    receiverId: string;

    @IsEnum(['audio', 'video'])
    callType: 'audio' | 'video';

    @IsOptional()
    @IsString()
    conversationId?: string;
}

export class UpdateCallStatusDto {
    @IsEnum(CallStatus)
    status: CallStatus;

    @IsOptional()
    sdpOffer?: string; // For WebRTC signaling

    @IsOptional()
    sdpAnswer?: string; // For WebRTC signaling

    @IsOptional()
    iceCandidate?: any; // For WebRTC signaling
}

export class AnswerCallDto {
    @IsBoolean()
    accept: boolean;

    @IsOptional()
    sdpAnswer?: string; // For WebRTC
}
