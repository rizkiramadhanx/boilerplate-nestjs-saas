import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class LoginWithIdentifierDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  identifier: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  password: string;
}

export class LoginWithPhoneDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[+]?[\d\s\-()]{6,20}$/, { message: 'Invalid phone number format' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  password: string;
}
