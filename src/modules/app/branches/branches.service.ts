import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { BranchEntity } from './entities/branch.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ResponseMeta } from '../../../common/type/response';
import { CurrentUserType } from '../../../security/user.decorator';
import { t } from '../../../constant/messages';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(BranchEntity)
    private readonly branchRepo: Repository<BranchEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
  ) {}

  private tenantIdOrThrow(user: CurrentUserType): string {
    const tenantId = user.tenant?.id;
    if (!tenantId) {
      throw new ForbiddenException(t('tenant_context_missing'));
    }
    return tenantId;
  }

  async create(dto: CreateBranchDto, currentUser: CurrentUserType) {
    const tenantId = this.tenantIdOrThrow(currentUser);
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException(t('tenant_context_missing'));

    const existing = await this.branchRepo.count({ where: { tenantId } });
    const isTrial = tenant.status === 'trial';
    const TRIAL_BRANCH_LIMIT = 1;
    const limit = isTrial ? TRIAL_BRANCH_LIMIT : tenant.branchQuota;
    if (existing >= limit) {
      throw new BadRequestException(
        isTrial
          ? `Masa trial maksimal ${TRIAL_BRANCH_LIMIT} cabang. Upgrade paket untuk menambah cabang.`
          : `Batas cabang sudah tercapai (${existing}/${limit}). Beli add-on untuk menambah kuota cabang.`,
      );
    }

    const branch = this.branchRepo.create({
      name: dto.name,
      address: dto.address,
      shiftMode: dto.shift_mode ?? false,
      tenantId,
    });
    const saved = await this.branchRepo.save(branch);
    return this.toResponse(saved);
  }

  async list(paginationDto: PaginationDto, currentUser: CurrentUserType) {
    const tenantId = this.tenantIdOrThrow(currentUser);
    const { page = 1, limit = 10, keyword } = paginationDto;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<BranchEntity> = {
      tenantId,
      ...(keyword?.trim() ? { name: ILike(`%${keyword.trim()}%`) } : {}),
    };

    const [branches, total] = await this.branchRepo.findAndCount({
      skip,
      take: limit,
      where,
      order: { createdAt: 'DESC' },
    });

    const data = branches.map((b) => this.toResponse(b));
    const meta: ResponseMeta = {
      page,
      limit,
      total,
      total_page: Math.ceil(total / limit),
    };
    return { data, meta };
  }

  async detail(id: string, currentUser: CurrentUserType) {
    const tenantId = this.tenantIdOrThrow(currentUser);
    const branch = await this.branchRepo.findOne({ where: { id, tenantId } });
    if (!branch) throw new NotFoundException(t('branch_not_found'));
    return this.toResponse(branch);
  }

  async update(id: string, dto: UpdateBranchDto, currentUser: CurrentUserType) {
    const tenantId = this.tenantIdOrThrow(currentUser);
    const branch = await this.branchRepo.findOne({ where: { id, tenantId } });
    if (!branch) throw new NotFoundException(t('branch_not_found'));

    if (dto.name !== undefined) branch.name = dto.name;
    if (dto.address !== undefined) branch.address = dto.address;
    if (dto.shift_mode !== undefined) branch.shiftMode = dto.shift_mode;
    const saved = await this.branchRepo.save(branch);
    return this.toResponse(saved);
  }

  async remove(id: string, currentUser: CurrentUserType) {
    const tenantId = this.tenantIdOrThrow(currentUser);
    const branch = await this.branchRepo.findOne({ where: { id, tenantId } });
    if (!branch) throw new NotFoundException(t('branch_not_found'));
    const count = await this.branchRepo.count({ where: { tenantId } });
    if (count <= 1) throw new BadRequestException(t('branch_minimum_one'));
    await this.branchRepo.remove(branch);
    return { message: 'Branch deleted' };
  }

  private toResponse(branch: BranchEntity) {
    return {
      id: branch.id,
      name: branch.name,
      address: branch.address ?? null,
      shift_mode: branch.shiftMode ?? false,
      tenant_id: branch.tenantId,
      created_at:
        branch.createdAt instanceof Date
          ? branch.createdAt.toISOString()
          : (branch.createdAt ?? null),
      updated_at:
        branch.updatedAt instanceof Date
          ? branch.updatedAt.toISOString()
          : (branch.updatedAt ?? null),
    };
  }
}
