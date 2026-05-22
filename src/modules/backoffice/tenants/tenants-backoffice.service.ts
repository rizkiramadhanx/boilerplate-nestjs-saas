import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TenantEntity } from '../../app/tenants/entities/tenant.entity';
import { BranchEntity } from '../../app/branches/entities/branch.entity';
import { UserEntity } from '../../app/users/entities/user.entity';
import { SubscriptionEntity } from '../subscriptions/entities/subscription.entity';
import { TenantFilterDto } from './dto/tenant-filter.dto';
import { ResponseMeta } from '../../../common/type/response';
import { t } from '../../../constant/messages';

type TenantListItem = {
  id: string;
  name: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string | null;
  status: string;
  plan: string | null;
  created_at: string;
  branches: { id: string; name: string }[];
  users: { id: string; name: string; email: string }[];
};

@Injectable()
export class TenantsBackofficeService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
  ) {}

  async findAll(paginationDto: TenantFilterDto) {
    const { page = 1, limit = 10, keyword = '', status = '' } = paginationDto;
    const skip = (page - 1) * limit;

    const qb = this.tenantRepository
      .createQueryBuilder('tenant')
      .orderBy('tenant.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (keyword) {
      qb.andWhere(
        '(tenant.name ILIKE :kw OR tenant.owner_email ILIKE :kw OR tenant.owner_phone ILIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }
    if (status) {
      qb.andWhere('tenant.status = :status', { status });
    }

    const [tenants, total] = await qb.getManyAndCount();

    const tenantIds = tenants.map((t) => t.id);
    const branches = tenantIds.length
      ? await this.branchRepository.find({
          where: { tenantId: In(tenantIds) },
          select: ['id', 'name', 'tenantId'],
          order: { createdAt: 'ASC' },
        })
      : [];
    const users = tenantIds.length
      ? await this.userRepository.find({
          where: { tenantId: In(tenantIds) },
          select: ['id', 'name', 'email', 'phone', 'isOwner', 'tenantId'],
          order: { createdAt: 'ASC' },
        })
      : [];

    const data: TenantListItem[] = tenants.map((t) => {
      const owner = users.find((u) => u.tenantId === t.id && u.isOwner);
      return {
        id: t.id,
        name: t.name,
        owner_name: t.ownerName,
        owner_email: t.ownerEmail,
        owner_phone: owner?.phone ?? null,
        status: t.status,
        plan: t.plan ?? null,
        created_at: t.createdAt.toISOString(),
        branches: branches
          .filter((b) => b.tenantId === t.id)
          .map((b) => ({ id: b.id, name: b.name })),
        users: users
          .filter((u) => u.tenantId === t.id)
          .map((u) => ({ id: u.id, name: u.name, email: u.email })),
      };
    });

    const meta: ResponseMeta = {
      page,
      limit,
      total,
      total_page: Math.ceil(total / limit),
    };
    return { data, meta };
  }

  async findOne(id: string) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException(t('tenant_not_found'));

    const branches = await this.branchRepository.find({
      where: { tenantId: id },
      select: ['id', 'name', 'createdAt'],
      order: { createdAt: 'ASC' },
    });

    const users = await this.userRepository.find({
      where: { tenantId: id },
      select: [
        'id',
        'name',
        'email',
        'phone',
        'isOwner',
        'isConfirmed',
        'lastLogin',
        'createdAt',
      ],
      order: { createdAt: 'ASC' },
    });

    const owner = users.find((u) => u.isOwner);

    const subscriptions = await this.subscriptionRepository.find({
      where: { tenantId: id },
      order: { createdAt: 'DESC' },
    });

    return {
      id: tenant.id,
      name: tenant.name,
      owner_name: tenant.ownerName,
      owner_email: tenant.ownerEmail,
      owner_phone: owner?.phone ?? null,
      status: tenant.status,
      plan: tenant.plan ?? null,
      created_at: tenant.createdAt.toISOString(),
      branches: branches.map((b) => ({
        id: b.id,
        name: b.name,
        created_at: b.createdAt.toISOString(),
      })),
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone ?? null,
        is_owner: u.isOwner,
        is_confirmed: u.isConfirmed,
        last_login: u.lastLogin ?? null,
        created_at: u.createdAt.toISOString(),
      })),
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        plan: s.plan,
        status: s.status,
        amount: s.amount,
        period_start: s.periodStart?.toISOString() ?? null,
        period_end: s.periodEnd?.toISOString() ?? null,
        is_trial: s.isTrial,
        paid_at: s.paidAt?.toISOString() ?? null,
        created_at: s.createdAt.toISOString(),
      })),
    };
  }

  async remove(id: string) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(t('tenant_not_found'));
    }
    await this.tenantRepository.remove(tenant);
    return { message: 'Tenant berhasil dihapus' };
  }
}
