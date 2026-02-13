import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'My first post' })
  @IsString()
  @IsNotEmpty()
  caption: string;

//   @ApiProperty({ type: 'string', format: 'binary', required: true })
//   @IsString()
//   @IsNotEmpty()
//   image: string; // filename or URL
}
