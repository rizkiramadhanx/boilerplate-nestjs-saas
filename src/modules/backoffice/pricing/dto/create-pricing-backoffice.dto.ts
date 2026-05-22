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

export class CreatePricingBackofficeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(32)
  plan: string;

  @IsNumberString()
  price: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  period_months: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  default_user_quota: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  default_branch_quota: number;

  @IsNumberString()
  extra_user_price: string;

  @IsNumberString()
  extra_branch_price: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  trial_days: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  trial_max_transactions: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_landing?: boolean;
}
