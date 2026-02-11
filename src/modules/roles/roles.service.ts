import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { RoleEntity } from './entities/role.entity';
import { OutletEntity } from '../outlets/entities/outlet.entity';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto } from './dto/role.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ResponseMeta } from '../../common/type/response';
import { CurrentUserType } from '../../security/user.decorator';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(OutletEntity)
    private readonly outletRepo: Repository<OutletEntity>,
  ) {}

  async createForOutlet(
    outletId: string,
    dto: CreateRoleDto,
    currentUser: CurrentUserType,
  ) {
    this.assertSameOutletOrThrow(outletId, currentUser);

    const outlet = await this.outletRepo.findOne({ where: { id: outletId } });
    if (!outlet) throw new NotFoundException('Outlet not found');

    const role = this.roleRepo.create({ ...dto, outlet });
    const savedRole = await this.roleRepo.save(role);
    const instance = plainToInstance(RoleResponseDto, savedRole, {
      excludeExtraneousValues: true,
    });
    return instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
  }

  async list(paginationDto: PaginationDto, currentUser: CurrentUserType) {
    const { page = 1, limit = 10, keyword } = paginationDto;
    const skip = (page - 1) * limit;

    const [roles, total] = await this.roleRepo.findAndCount({
      skip,
      take: limit,
      where: {
        name: ILike(`%${keyword}%`),
        outlet: { id: currentUser.outlet.id },
      },
      order: { id: 'ASC' },
    });

    const rolesSerialized = plainToInstance(RoleEntity, roles, {
      exposeDefaultValues: true,
    });
    const data = Array.isArray(rolesSerialized) ? rolesSerialized : [];
    const totalPage = Math.ceil(total / limit);

    const meta: ResponseMeta = {
      page,
      limit,
      total,
      total_page: totalPage,
    };

    return {
      data,
      meta,
    };
  }

  async detailRole(roleId: string, currentUser: CurrentUserType) {
    this.assertSameOutletOrThrow(roleId, currentUser);
    const roles = await this.roleRepo.find({
      where: { outlet: { id: roleId } },
    });
    const instances = plainToInstance(RoleResponseDto, roles, {
      excludeExtraneousValues: true,
    });
    const arr = Array.isArray(instances) ? instances : [instances];
    return arr.map(
      (r) =>
        instanceToPlain(r, { exposeDefaultValues: true }) as Record<
          string,
          unknown
        >,
    );
  }

  async updateRole(
    roleId: string,
    dto: UpdateRoleDto,
    currentUser: CurrentUserType,
  ) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.outlet?.id !== currentUser.outlet.id)
      throw new ForbiddenException('Cross-outlet access forbidden');

    Object.assign(role, dto);
    const updatedRole = await this.roleRepo.save(role);
    const instance = plainToInstance(RoleResponseDto, updatedRole, {
      excludeExtraneousValues: true,
    });
    return instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
  }

  async deleteRole(roleId: string, currentUser: CurrentUserType) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.outlet?.id !== currentUser.outlet.id)
      throw new ForbiddenException('Cross-outlet access forbidden');

    if (role.isAdmin) {
      throw new ForbiddenException('Admin role cannot be deleted');
    }

    await this.roleRepo.delete(roleId);
    return true;
  }

  private assertSameOutletOrThrow(outletId: string, user: CurrentUserType) {
    if (user.outlet.id !== outletId) {
      throw new ForbiddenException('Outlet mismatch');
    }
  }
}
