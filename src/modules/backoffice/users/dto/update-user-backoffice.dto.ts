import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  Matches,
} from 'class-validator';
import { IsAllowedEmail } from '../../../../common/decorators/is-allowed-email.decorator';

export class UpdateUserBackofficeDto {
  @IsString()
  @IsOptional()
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

  @IsBoolean()
  @IsOptional()
  is_confirmed?: boolean;

  @IsBoolean()
  @IsOptional()
  is_owner?: boolean;
}
