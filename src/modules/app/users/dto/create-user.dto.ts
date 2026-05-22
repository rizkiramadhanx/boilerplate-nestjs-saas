import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MinLength } from 'class-validator';
import {
  CreateUserDto,
  CreateUserManualUserDto,
  UserResponseDto,
} from './base-user.dto';

export class RegisterUserDto extends CreateUserDto {
  createdAt: Date;
}

export class RegisterManualUserDto extends CreateUserManualUserDto {
  createdAt: Date;
}

export class UpdateUserDto extends PartialType(UserResponseDto) {
  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password?: string;
}
