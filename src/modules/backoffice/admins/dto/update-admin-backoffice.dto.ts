import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { IsAllowedEmail } from '../../../../common/decorators/is-allowed-email.decorator';

export class UpdateAdminBackofficeDto {
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
}
