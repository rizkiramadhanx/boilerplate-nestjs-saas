import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { RoleEntity } from './entities/role.entity';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto } from './dto/role.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ResponseMeta } from '../../../common/type/response';
import { CurrentUserType } from '../../../security/user.decorator';
import { t } from '../../../constant/messages';
import ACTION_ROLES from '../../../constant/action-roles';

@Injectable()
export class RolesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const allActions = ACTION_ROLES.flatMap((m) =>
      m.actions.map((a) => a.value),
    );
    const admins = await this.roleRepo.find({ where: { isAdmin: true } });
    const stale = admins.filter((r) => {
      if (!Array.isArray(r.modules)) return true;
      if (r.modules.length !== allActions.length) return true;
      const set = new Set(r.modules);
      return allActions.some((a) => !set.has(a));
    });
    if (stale.length === 0) return;
    for (const role of stale) role.modules = [...allActions];
    await this.roleRepo.save(stale);
    this.logger.log(
      `Synced ${stale.length} admin role(s) with ${allActions.length} action(s)`,
    );
  }

  private tenantIdOrThrow(user: CurrentUserType): string {
    const tenantId = user.tenant?.id;
    if (!tenantId) throw new ForbiddenException(t('tenant_context_missing'));
    return tenantId;
  }

  async createForTenant(dto: CreateRoleDto, currentUser: CurrentUserType) {
    const tenantId = this.tenantIdOrThrow(currentUser);
    const role = this.roleRepo.create({ ...dto, tenantId });
    const savedRole = await this.roleRepo.save(role);
    return this.toResponse(savedRole);
  }

  async list(paginationDto: PaginationDto, currentUser: CurrentUserType) {
    const tenantId = this.tenantIdOrThrow(currentUser);
    const { page = 1, limit = 10, keyword } = paginationDto;
    const skip = (page - 1) * limit;

    const whereCondition: FindOptionsWhere<RoleEntity> = {
      tenantId,
      ...(keyword?.trim() ? { name: ILike(`%${keyword.trim()}%`) } : {}),
    };

    const [roles, total] = await this.roleRepo.findAndCount({
      skip,
      take: limit,
      where: whereCondition,
      order: { id: 'ASC' },
    });

    const data = roles.map((r) => this.toResponse(r));
    const totalPage = Math.ceil(total / limit);

    const meta: ResponseMeta = {
      page,
      limit,
      total,
      total_page: totalPage,
    };

    return { data, meta };
  }

  async detailRole(roleId: string, currentUser: CurrentUserType) {
    const tenantId = this.tenantIdOrThrow(currentUser);
    const role = await this.roleRepo.findOne({
      where: { id: roleId, tenantId },
    });

    if (!role) throw new NotFoundException(t('role_not_found'));

    return this.toResponse(role);
  }

  async updateRole(
    roleId: string,
    dto: UpdateRoleDto,
    currentUser: CurrentUserType,
  ) {
    const tenantId = this.tenantIdOrThrow(currentUser);
    const role = await this.roleRepo.findOne({
      where: { id: roleId, tenantId },
    });

    if (!role) throw new NotFoundException(t('role_not_found'));
    if (role.isAdmin)
      throw new ForbiddenException(t('role_admin_cannot_be_changed'));

    Object.assign(role, dto);
    const updatedRole = await this.roleRepo.save(role);
    return this.toResponse(updatedRole);
  }

  async deleteRole(roleId: string, currentUser: CurrentUserType) {
    const tenantId = this.tenantIdOrThrow(currentUser);
    const role = await this.roleRepo.findOne({
      where: { id: roleId, tenantId },
    });

    if (!role) throw new NotFoundException(t('role_not_found'));
    if (role.isAdmin)
      throw new ForbiddenException(t('role_admin_cannot_be_deleted'));
    const count = await this.roleRepo.count({ where: { tenantId } });
    if (count <= 1) throw new BadRequestException(t('role_minimum_one'));

    await this.roleRepo.delete(roleId);
    return true;
  }

  private toResponse(role: RoleEntity) {
    const instance = plainToInstance(RoleResponseDto, role, {
      excludeExtraneousValues: true,
    });
    return instanceToPlain(instance, { exposeDefaultValues: true }) as Record<
      string,
      unknown
    >;
  }
}
