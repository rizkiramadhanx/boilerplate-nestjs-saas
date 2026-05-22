import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { UserBranchEntity } from './entities/user-branch.entity';
import { UserEntity } from './entities/user.entity';
import { BranchEntity } from '../branches/entities/branch.entity';
import {
  CreateUserBranchDto,
  UpdateUserBranchDto,
  UserBranchResponseDto,
} from './dto/user-branch.dto';
import { CurrentUserType } from '../../../security/user.decorator';
import { t } from '../../../constant/messages';

@Injectable()
export class UserBranchesService {
  constructor(
    @InjectRepository(UserBranchEntity)
    private readonly userBranchRepo: Repository<UserBranchEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchRepo: Repository<BranchEntity>,
  ) {}

  private tenantIdOrThrow(user: CurrentUserType): string {
    const tenantId = user.tenant?.id;
    if (!tenantId) throw new ForbiddenException(t('tenant_context_missing'));
    return tenantId;
  }

  async listForUser(userId: string, currentUser: CurrentUserType) {
    const tenantId = this.tenantIdOrThrow(currentUser);
    await this.assertUserInTenant(userId, tenantId);

    const assignments = await this.userBranchRepo.find({
      where: { userId, tenantId },
      relations: ['branch'],
      order: { createdAt: 'DESC' },
    });
    return assignments.map((a) => this.toResponse(a));
  }

  async create(
    userId: string,
    dto: CreateUserBranchDto,
    currentUser: CurrentUserType,
  ) {
    const tenantId = this.tenantIdOrThrow(currentUser);
    await this.assertUserInTenant(userId, tenantId);

    const branch = await this.branchRepo.findOne({
      where: { id: dto.branch_id, tenantId },
    });
    if (!branch) throw new NotFoundException(t('branch_not_found'));

    const existing = await this.userBranchRepo.findOne({
      where: { userId, branchId: dto.branch_id, tenantId },
    });
    if (existing) {
      throw new ConflictException(t('user_already_delegated_to_branch'));
    }

    const assignment = this.userBranchRepo.create({
      userId,
      branchId: dto.branch_id,
      tenantId,
      isActive: true,
    });
    const saved = await this.userBranchRepo.save(assignment);
    const withRelations = await this.userBranchRepo.findOne({
      where: { id: saved.id },
      relations: ['branch'],
    });
    return this.toResponse(withRelations!);
  }

  async update(
    assignmentId: string,
    dto: UpdateUserBranchDto,
    currentUser: CurrentUserType,
  ) {
    const tenantId = this.tenantIdOrThrow(currentUser);
    const assignment = await this.userBranchRepo.findOne({
      where: { id: assignmentId, tenantId },
    });
    if (!assignment) throw new NotFoundException(t('assignment_not_found'));

    if (dto.isActive !== undefined) assignment.isActive = dto.isActive;

    await this.userBranchRepo.save(assignment);
    const withRelations = await this.userBranchRepo.findOne({
      where: { id: assignment.id },
      relations: ['branch'],
    });
    return this.toResponse(withRelations!);
  }

  async remove(assignmentId: string, currentUser: CurrentUserType) {
    const tenantId = this.tenantIdOrThrow(currentUser);
    const assignment = await this.userBranchRepo.findOne({
      where: { id: assignmentId, tenantId },
    });
    if (!assignment) throw new NotFoundException(t('assignment_not_found'));
    await this.userBranchRepo.remove(assignment);
    return { message: 'Assignment removed' };
  }

  private async assertUserInTenant(userId: string, tenantId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId, tenantId },
    });
    if (!user) throw new NotFoundException(t('user_not_found'));
    return user;
  }

  private toResponse(entity: UserBranchEntity) {
    const instance = plainToInstance(UserBranchResponseDto, entity, {
      excludeExtraneousValues: true,
    });
    return instanceToPlain(instance, { exposeDefaultValues: true }) as Record<
      string,
      unknown
    >;
  }
}
