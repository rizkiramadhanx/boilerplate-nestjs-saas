import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class UpdateUserBackofficeDto {
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

  @IsUUID()
  @IsOptional()
  outlet_id?: string;

  @IsUUID()
  @IsOptional()
  role_id?: string;

  @IsString()
  @IsOptional()
  picture?: string;
}
