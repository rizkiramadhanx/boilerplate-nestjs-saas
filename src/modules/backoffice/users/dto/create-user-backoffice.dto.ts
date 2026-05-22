import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  Matches,
} from 'class-validator';
import { Match } from '../../../../common/decorators/confirmPassword.decorator';
import { IsAllowedEmail } from '../../../../common/decorators/is-allowed-email.decorator';

export class CreateUserBackofficeDto {
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
  @Match('password', { message: 'confirm_password must match password' })
  confirm_password: string;

  @IsUUID()
  @IsNotEmpty({ message: 'branch_id is required for backoffice' })
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
