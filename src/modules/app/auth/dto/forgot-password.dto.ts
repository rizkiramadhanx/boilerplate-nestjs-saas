import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Match } from '../../../../common/decorators/confirmPassword.decorator';
import { IsAllowedEmail } from '../../../../common/decorators/is-allowed-email.decorator';

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @IsAllowedEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  new_password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Match('new_password', { message: 'Passwords do not match' })
  confirm_password: string;
}
