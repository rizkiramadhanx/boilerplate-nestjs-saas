import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsAllowedEmail } from '../../../../common/decorators/is-allowed-email.decorator';

export class RegisterWithBranchDto {
  @IsEmail()
  @IsNotEmpty()
  @IsAllowedEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  @Matches(/^[+]?[\d\s\-()]{6,20}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  branch_name: string;
}
