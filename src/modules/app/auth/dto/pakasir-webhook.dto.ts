import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PakasirWebhookDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  order_id: string;

  @IsString()
  @IsNotEmpty()
  project: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsString()
  completed_at?: string;
}
