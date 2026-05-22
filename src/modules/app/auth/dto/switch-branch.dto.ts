import { Transform } from 'class-transformer';
import { IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

/**
 * Body switch cabang — hanya UUID cabang; field lain di-strip oleh ValidationPipe (whitelist).
 */
export class SwitchBranchDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().slice(0, 36) : value,
  )
  @IsUUID('all', { message: 'branch_id harus berupa UUID yang valid' })
  @MaxLength(36, { message: 'branch_id tidak valid' })
  @IsNotEmpty()
  branch_id: string;
}
