import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';

export class UpdatePricingBackofficeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(32)
  plan?: string;

  @IsOptional()
  @IsNumberString()
  price?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  period_months?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  default_user_quota?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  default_branch_quota?: number;

  @IsOptional()
  @IsNumberString()
  extra_user_price?: string;

  @IsOptional()
  @IsNumberString()
  extra_branch_price?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  trial_days?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  trial_max_transactions?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_landing?: boolean;
}
