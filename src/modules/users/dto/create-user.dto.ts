import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'kushwahaatendra' })
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'Atendra Kumar Kushwaha', required: false })
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'atendra@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
