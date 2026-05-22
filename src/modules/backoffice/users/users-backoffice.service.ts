import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../app/users/entities/user.entity';
import { BranchEntity } from '../../app/branches/entities/branch.entity';
import { RoleEntity } from '../../app/roles/entities/role.entity';
import { ResponseMeta } from '../../../common/type/response';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CreateUserBackofficeDto } from './dto/create-user-backoffice.dto';
import { UpdateUserBackofficeDto } from './dto/update-user-backoffice.dto';
import { t } from '../../../constant/messages';

@Injectable()
export class UsersBackofficeService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(BranchEntity)
    private branchRepository: Repository<BranchEntity>,
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
  ) {}

  async findAll(
    paginationDto: PaginationDto & { role?: string; sort?: string },
  ) {
    const {
      page = 1,
      limit = 10,
      keyword = '',
      role = '',
      sort = 'created_at',
    } = paginationDto;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.branch', 'branch')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .skip(skip)
      .take(limit);

    if (sort === 'last_login') {
      qb.orderBy('user.lastLogin', 'DESC', 'NULLS LAST');
    } else {
      qb.orderBy('user.createdAt', 'DESC');
    }

    if (keyword) {
      qb.andWhere(
        '(user.name ILIKE :kw OR user.email ILIKE :kw OR user.phone ILIKE :kw OR tenant.name ILIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }

    if (role === 'owner') {
      qb.andWhere('user.is_owner = true');
    } else if (role === 'staff') {
      qb.andWhere('user.is_owner = false');
    }

    const [users, total] = await qb.getManyAndCount();

    const data = (Array.isArray(users) ? users : [users]).map((u) => {
      const plain = instanceToPlain(plainToInstance(UserEntity, u), {
        exposeDefaultValues: true,
      }) as Record<string, unknown>;
      plain.tenant_name = u.tenant?.name ?? null;
      plain.current_plan = u.tenant?.plan ?? null;
      plain.is_confirmed = u.isConfirmed;
      plain.is_owner = u.isOwner;
      plain.last_login = u.lastLogin ?? null;
      plain.created_at = u.createdAt;
      plain.updated_at = u.updatedAt;
      return plain;
    });

    const totalPage = Math.ceil(total / limit);
    const meta: ResponseMeta = {
      page,
      limit,
      total,
      total_page: totalPage,
    };
    return { data, meta };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'branch', 'tenant'],
    });
    if (!user) throw new NotFoundException(t('user_not_found'));
    const plain = instanceToPlain(plainToInstance(UserEntity, user), {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
    plain.tenant_name = user.tenant?.name ?? null;
    plain.is_confirmed = user.isConfirmed;
    plain.is_owner = user.isOwner;
    plain.last_login = user.lastLogin ?? null;
    plain.created_at = user.createdAt;
    plain.updated_at = user.updatedAt;
    return plain;
  }

  async create(dto: CreateUserBackofficeDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(t('user_email_already_exists'));
    }
    const branch = await this.branchRepository.findOne({
      where: { id: dto.branch_id },
    });
    if (!branch) throw new NotFoundException(t('branch_not_found'));

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      picture: dto.picture,
      phone: dto.phone,
      isConfirmed: true,
      tenantId: branch.tenantId,
      branch: { id: dto.branch_id },
      role: dto.role_id ? { id: dto.role_id } : null,
    });
    const saved = await this.userRepository.save(newUser);
    const instance = plainToInstance(UserEntity, saved);
    return instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
  }

  async update(id: string, dto: UpdateUserBackofficeDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(t('user_not_found'));
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }
    if (dto.role_id) user.role = { id: dto.role_id } as any;
    if (dto.branch_id) user.branch = { id: dto.branch_id } as any;
    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email;
    if (dto.picture) user.picture = dto.picture;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.is_confirmed !== undefined) user.isConfirmed = dto.is_confirmed;
    if (dto.is_owner !== undefined) {
      if (!dto.is_owner && user.isOwner && user.tenantId) {
        const ownerCount = await this.userRepository.count({
          where: { tenantId: user.tenantId, isOwner: true },
        });
        if (ownerCount <= 1) {
          throw new ConflictException(
            'Tenant harus memiliki minimal 1 owner. Tetapkan owner lain sebelum mengubah role ini.',
          );
        }
      }
      user.isOwner = dto.is_owner;
    }
    const updated = await this.userRepository.save(user);
    const instance = plainToInstance(UserEntity, updated);
    return instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['branch'],
    });
    if (!user) throw new NotFoundException(t('user_not_found'));

    const branchId = user.branch?.id;
    if (!branchId) {
      throw new NotFoundException(t('branch_not_found'));
    }
    await this.userRepository.remove(user);

    if (!branchId) {
      return { message: 'User deleted successfully' };
    }

    const userCount = await this.userRepository.count({
      where: { branch: { id: branchId } },
    });

    if (userCount > 0) {
      return { message: 'User deleted successfully' };
    }

    await this.userRepository.manager.transaction(async (tx) => {
      await tx
        .createQueryBuilder()
        .delete()
        .from(RoleEntity)
        .where('branch_id = :branchId', { branchId })
        .execute();
      await tx.delete(BranchEntity, { id: branchId });
    });

    return {
      message:
        'User deleted successfully. Branch had no remaining users; branch and related roles have been deleted.',
    };
  }
}
