import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsPhoneNumber,
  Min,
  IsInt,
} from 'class-validator';

export class CreateProfileDto {
  @ApiProperty({ example: 'Atendra Kushwaha' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 20 })
  @Type(() => Number)       // ✅ converts string → number
  @IsInt()                  // ✅ better than IsNumber for age
  @Min(1)
  age: number;


  @ApiProperty({ example: 'Delhi' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: '+919876543210' })
  @IsPhoneNumber('IN')
  phone: string;

  // ✅ THIS IS THE IMPORTANT PART
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  avatar?: any;
}
