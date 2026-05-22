import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class TenantFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsIn(['trial', 'active', 'expired', 'suspended', ''])
  status?: string;
}
