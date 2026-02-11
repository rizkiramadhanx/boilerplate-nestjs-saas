import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  IsStrongPassword,
} from 'class-validator';
import { Match } from '../../../common/decorators/confirmPassword.decorator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;

  @IsUUID()
  @IsOptional()
  outlet_id: string;

  @IsUUID()
  @IsOptional()
  role_id?: string; // optional saat create, bisa assign belakangan

  @IsString()
  @IsOptional()
  picture?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @IsUUID()
  @IsOptional()
  outlet_id?: string;

  @IsUUID()
  @IsOptional()
  role_id?: string;

  @IsString()
  @IsOptional()
  picture?: string;
}

export class UserResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsUUID()
  outlet_id: string;

  @IsUUID()
  @IsOptional()
  role_id?: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsString()
  createdAt: string;

  @IsString()
  updatedAt: string;
}

export class CreateUserManualUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @IsStrongPassword()
  password: string;

  @IsString()
  @IsNotEmpty()
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;

  @IsUUID()
  @IsNotEmpty()
  outlet_id: string;

  @IsUUID()
  @IsOptional()
  role_id?: string;

  @IsString()
  @IsOptional()
  picture?: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
