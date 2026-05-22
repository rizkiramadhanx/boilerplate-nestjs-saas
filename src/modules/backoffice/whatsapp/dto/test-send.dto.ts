import { IsNotEmpty, IsString } from 'class-validator';

export class TestSendDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
