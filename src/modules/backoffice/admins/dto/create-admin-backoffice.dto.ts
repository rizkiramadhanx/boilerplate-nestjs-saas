import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from '../../../../common/decorators/confirmPassword.decorator';
import { IsAllowedEmail } from '../../../../common/decorators/is-allowed-email.decorator';

export class CreateAdminBackofficeDto {
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
}
