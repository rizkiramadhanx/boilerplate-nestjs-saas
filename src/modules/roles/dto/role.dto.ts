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
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'name' })
  name: string;

  @Expose({ name: 'is_admin' })
  isAdmin: boolean;

  @Expose({ name: 'modules' })
  modules: string[];

  @Expose({ name: 'outlet_id' })
  @Transform(({ obj }) => obj.outlet?.id ?? obj.outletId)
  outletId: string;

  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
