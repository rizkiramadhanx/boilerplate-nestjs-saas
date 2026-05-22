import { IsNotEmpty, IsUUID } from 'class-validator';

export class BillingCheckoutDto {
  @IsUUID()
  @IsNotEmpty()
  pricing_id: string;
}
