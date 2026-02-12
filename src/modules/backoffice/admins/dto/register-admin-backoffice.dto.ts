import { IsNotEmpty, IsString } from 'class-validator';
import { CreateAdminBackofficeDto } from './create-admin-backoffice.dto';

export class RegisterAdminBackofficeDto extends CreateAdminBackofficeDto {
  @IsString()
  @IsNotEmpty({ message: 'register_secret is required' })
  register_secret: string;
}
