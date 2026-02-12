import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { Match } from '../../../../common/decorators/confirmPassword.decorator';

export class CreateUserBackofficeDto {
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
  @Match('password', { message: 'confirm_password must match password' })
  confirm_password: string;

  @IsUUID()
  @IsNotEmpty({ message: 'outlet_id is required for backoffice' })
  outlet_id: string;

  @IsUUID()
  @IsOptional()
  role_id?: string;

  @IsString()
  @IsOptional()
  picture?: string;
}
