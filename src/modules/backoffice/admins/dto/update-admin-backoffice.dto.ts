import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAdminBackofficeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;
}
