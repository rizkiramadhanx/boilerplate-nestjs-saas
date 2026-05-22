import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  IsStrongPassword,
  Matches,
} from 'class-validator';
import { Match } from '../../../../common/decorators/confirmPassword.decorator';
import { IsAllowedEmail } from '../../../../common/decorators/is-allowed-email.decorator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @IsAllowedEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;

  @IsUUID()
  @IsOptional()
  branch_id: string;

  @IsUUID()
  @IsOptional()
  role_id?: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[+]?[\d\s\-()]{6,20}$/, { message: 'Invalid phone number format' })
  phone?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @IsEmail()
  @IsOptional()
  @IsAllowedEmail()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @IsUUID()
  @IsOptional()
  branch_id?: string;

  @IsUUID()
  @IsOptional()
  role_id?: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[+]?[\d\s\-()]{6,20}$/, { message: 'Invalid phone number format' })
  phone?: string;
}

export class UserResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsUUID()
  branch_id: string;

  @IsUUID()
  @IsOptional()
  role_id?: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  createdAt: string;

  @IsString()
  updatedAt: string;
}

export class CreateUserManualUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @IsAllowedEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @IsStrongPassword()
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;

  @IsUUID()
  @IsNotEmpty()
  branch_id: string;

  @IsUUID()
  @IsOptional()
  role_id?: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[+]?[\d\s\-()]{6,20}$/, { message: 'Invalid phone number format' })
  phone?: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  identifier: string;
}
