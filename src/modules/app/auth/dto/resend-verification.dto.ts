import { IsEmail, IsNotEmpty } from 'class-validator';
import { IsAllowedEmail } from '../../../../common/decorators/is-allowed-email.decorator';

export class ResendVerificationDto {
  @IsEmail()
  @IsNotEmpty()
  @IsAllowedEmail()
  email: string;
}
