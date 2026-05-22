import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { CreateAdminBackofficeDto } from './create-admin-backoffice.dto';

export class RegisterAdminBackofficeDto extends CreateAdminBackofficeDto {
  @IsString()
  @IsNotEmpty({ message: 'register_secret is required' })
  @MinLength(3)
  register_secret: string;
}
