import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CheckPakasirPaymentQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  order_id: string;
}
