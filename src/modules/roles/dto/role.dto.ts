import { Expose, Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean = false;

  @IsArray()
  @ArrayUnique()
  @ArrayNotEmpty()
  @IsString({ each: true })
  modules: string[];
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;

  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  modules?: string[];
}

export class RoleResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  isAdmin: boolean;

  @Expose()
  modules: string[];

  @Expose()
  @Transform(({ obj }) => obj.outlet?.id)
  outletId: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
