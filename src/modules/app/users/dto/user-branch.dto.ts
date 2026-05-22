import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateUserBranchDto {
  @IsUUID()
  branch_id: string;
}

export class UpdateUserBranchDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UserBranchResponseDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'user_id' })
  userId: string;

  @Expose({ name: 'branch_id' })
  branchId: string;

  @Expose({ name: 'is_active' })
  isActive: boolean;

  @Expose({ name: 'branch' })
  @Transform(({ obj }) =>
    obj.branch ? { id: obj.branch.id, name: obj.branch.name } : null,
  )
  branch?: { id: string; name: string } | null;

  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Expose({ name: 'updated_at' })
  updatedAt: Date;
}
