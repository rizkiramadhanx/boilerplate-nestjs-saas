import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../users/entities/user.entity';
import { OutletEntity } from '../../outlets/entities/outlet.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { RoleEntity } from '../../roles/entities/role.entity';
import { ResponseMeta } from '../../../common/type/response';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CreateUserBackofficeDto } from './dto/create-user-backoffice.dto';
import { UpdateUserBackofficeDto } from './dto/update-user-backoffice.dto';

@Injectable()
export class UsersBackofficeService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(OutletEntity)
    private outletRepository: Repository<OutletEntity>,
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
  ) {}

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, keyword = '' } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (keyword) where.name = ILike(`%${keyword}%`);

    const [users, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      relations: ['role', 'outlet'],
      order: { createdAt: 'DESC' },
      where,
    });

    const data = (Array.isArray(users) ? users : [users]).map((u) =>
      instanceToPlain(plainToInstance(UserEntity, u), {
        exposeDefaultValues: true,
      }),
    ) as Record<string, unknown>[];

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
      relations: ['role', 'outlet'],
    });
    if (!user) throw new NotFoundException('User not found');
    const instance = plainToInstance(UserEntity, user);
    return instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
  }

  async create(dto: CreateUserBackofficeDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      picture: dto.picture,
      outlet: { id: dto.outlet_id },
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
    if (!user) throw new NotFoundException('User not found');
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }
    if (dto.role_id) user.role = { id: dto.role_id } as any;
    if (dto.outlet_id) user.outlet = { id: dto.outlet_id } as any;
    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email;
    if (dto.picture) user.picture = dto.picture;
    const updated = await this.userRepository.save(user);
    const instance = plainToInstance(UserEntity, updated);
    return instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['outlet'],
    });
    if (!user) throw new NotFoundException('User not found');

    const outletId = user.outlet?.id;
    if (!outletId) {
      throw new NotFoundException('Outlet not found');
    }
    await this.userRepository.remove(user);

    if (!outletId) {
      return { message: 'User deleted successfully' };
    }

    const userCount = await this.userRepository.count({
      where: { outlet: { id: outletId } },
    });

    if (userCount > 0) {
      return { message: 'User deleted successfully' };
    }

    await this.userRepository.manager.transaction(async (tx) => {
      await tx
        .createQueryBuilder()
        .delete()
        .from(ProductEntity)
        .where('outlet_id = :outletId', { outletId })
        .execute();
      await tx
        .createQueryBuilder()
        .delete()
        .from(CategoryEntity)
        .where('outlet_id = :outletId', { outletId })
        .execute();
      await tx
        .createQueryBuilder()
        .delete()
        .from(RoleEntity)
        .where('outlet_id = :outletId', { outletId })
        .execute();
      await tx.delete(OutletEntity, { id: outletId });
    });

    return {
      message:
        'User deleted successfully. Outlet had no remaining users; outlet and all related data (products, categories, roles) have been deleted.',
    };
  }
}
