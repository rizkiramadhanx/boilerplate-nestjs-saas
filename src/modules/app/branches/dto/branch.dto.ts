import { Expose, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  address?: string;

  @IsBoolean()
  @IsOptional()
  shift_mode?: boolean;
}

export class UpdateBranchDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  address?: string;

  @IsBoolean()
  @IsOptional()
  shift_mode?: boolean;
}

export class BranchResponseDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'name' })
  name: string;

  @Expose({ name: 'address' })
  address?: string;

  @Expose()
  @Transform(({ obj }) => obj.shiftMode ?? false)
  shift_mode: boolean;

  @Expose({ name: 'tenant_id' })
  @Transform(({ obj }) => obj.tenantId)
  tenantId: string;

  @Expose({ name: 'created_at' })
  @Transform(({ obj }) => {
    const raw = obj.createdAt ?? obj.created_at;
    if (!raw) return null;
    return raw instanceof Date ? raw.toISOString() : String(raw);
  })
  createdAt: string | null;

  @Expose({ name: 'updated_at' })
  @Transform(({ obj }) => {
    const raw = obj.updatedAt ?? obj.updated_at;
    if (!raw) return null;
    return raw instanceof Date ? raw.toISOString() : String(raw);
  })
  updatedAt: string | null;
}
