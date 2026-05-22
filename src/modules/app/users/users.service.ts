import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { UpdateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CreateUserDto } from './dto/base-user.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ResponseMeta } from '../../../common/type/response';
import { CurrentUserType } from '../../../security/user.decorator';
import * as bcrypt from 'bcrypt';
import { t } from '../../../constant/messages';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mailer/mailer.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(TenantEntity)
    private tenantRepository: Repository<TenantEntity>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async createUser(createUserDto: CreateUserDto, currentUser: CurrentUserType) {
    const tenantId = currentUser.tenant?.id;
    if (!tenantId) {
      throw new ForbiddenException(t('tenant_context_missing'));
    }

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(t('tenant_context_missing'));
    }

    const existingCount = await this.userRepository.count({
      where: { tenantId },
    });
    const isTrial = tenant.status === 'trial';
    const TRIAL_USER_LIMIT = 2;
    const limit = isTrial ? TRIAL_USER_LIMIT : tenant.userQuota;
    if (existingCount >= limit) {
      throw new BadRequestException(
        isTrial
          ? `Masa trial maksimal ${TRIAL_USER_LIMIT} user (owner termasuk). Upgrade paket untuk menambah user.`
          : `Batas user sudah tercapai (${existingCount}/${limit}). Beli add-on untuk menambah kuota user.`,
      );
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException(t('user_email_already_exists'));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create new user
    const newUser = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
      picture: createUserDto.picture,
      phone: createUserDto.phone,
      isConfirmed: false,
      tenantId: currentUser.tenant?.id,
      branch: currentUser.branch?.id
        ? { id: currentUser.branch.id }
        : undefined,
      role: createUserDto.role_id ? { id: createUserDto.role_id } : null,
    });

    const savedUser = await this.userRepository.save(newUser);

    const isProduction =
      this.configService.get<string>('config.node_env') === 'production';
    const expiresIn = isProduction ? '15m' : '1d';
    const token = this.jwtService.sign(
      { sub: savedUser.id, email: savedUser.email },
      { expiresIn },
    );
    const confirmationUrl = `${this.configService.get<string>('FRONT_END_URL')}/auth/confirm?code=${token}`;
    await this.mailService.sendVerificationEmail(
      savedUser.email,
      savedUser.name,
      confirmationUrl,
    );

    const instance = plainToInstance(UserEntity, savedUser);
    return instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
  }

  async getUserById(id: string, currentUser: CurrentUserType) {
    const whereCondition: any = { id };

    // Jika user bukan admin, filter berdasarkan branch
    if (currentUser.role && !currentUser.role.isAdmin && currentUser.branch) {
      whereCondition.branch = {
        id: currentUser.branch.id,
      };
    }

    const user = await this.userRepository.findOne({
      where: whereCondition,
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(t('user_not_found'));
    }

    const instance = plainToInstance(UserEntity, user);
    return instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: CurrentUserType,
  ) {
    const whereCondition: any = { id };

    // Jika user bukan admin, filter berdasarkan branch
    if (currentUser.role && !currentUser.role.isAdmin && currentUser.branch) {
      whereCondition.branch = {
        id: currentUser.branch.id,
      };
    }

    const user = await this.userRepository.findOne({
      where: whereCondition,
    });

    if (!user) {
      throw new NotFoundException(t('user_not_found'));
    }

    // Check email uniqueness if email is being changed
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailTaken = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (emailTaken) {
        throw new ConflictException(t('user_email_already_exists'));
      }
    }

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Handle role update
    if (updateUserDto.role_id) {
      user.role = { id: updateUserDto.role_id } as any;
    }

    // Handle branch update
    if (updateUserDto.branch_id) {
      user.branch = { id: updateUserDto.branch_id } as any;
    }

    // Assign other fields
    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.password) user.password = updateUserDto.password;
    if (updateUserDto.picture) user.picture = updateUserDto.picture;
    if (updateUserDto.phone !== undefined) user.phone = updateUserDto.phone;

    const updatedUser = await this.userRepository.save(user);
    const instance = plainToInstance(UserEntity, updatedUser);
    return instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
  }

  async deleteUser(id: string, currentUser: CurrentUserType) {
    const whereCondition: any = { id };

    // Jika user bukan admin, filter berdasarkan branch
    if (currentUser.role && !currentUser.role.isAdmin && currentUser.branch) {
      whereCondition.branch = {
        id: currentUser.branch.id,
      };
    }

    const user = await this.userRepository.findOne({
      where: whereCondition,
    });

    if (!user) {
      throw new NotFoundException(t('user_not_found'));
    }

    if (user.isOwner) {
      throw new ForbiddenException(t('user_owner_cannot_be_deleted'));
    }

    if (user.id === currentUser.id) {
      throw new ForbiddenException(t('user_cannot_delete_self'));
    }

    const tenantId = currentUser.tenant?.id;
    if (!tenantId) throw new ForbiddenException(t('tenant_context_missing'));
    const count = await this.userRepository.count({ where: { tenantId } });
    if (count <= 1) throw new BadRequestException(t('user_minimum_one'));

    await this.userRepository.remove(user);
    return { message: 'User deleted successfully' };
  }

  async updateUserProfile(email: string, user: UpdateUserDto) {
    const userExists = await this.userRepository.findOne({ where: { email } });
    if (!userExists) throw new NotFoundException(t('user_not_found'));

    if (user.name) userExists.name = user.name;
    if (user.email) userExists.email = user.email;
    if (user.picture !== undefined) userExists.picture = user.picture;
    if (user.phone !== undefined) userExists.phone = user.phone;
    if (user.password) {
      userExists.password = await bcrypt.hash(user.password, 10);
    }
    if (user.role_id) userExists.role = { id: user.role_id } as any;
    if (user.branch_id) userExists.branch = { id: user.branch_id } as any;

    const updated = await this.userRepository.save(userExists);
    const instance = plainToInstance(UserEntity, updated);
    return instanceToPlain(instance, { exposeDefaultValues: true }) as Record<
      string,
      unknown
    >;
  }

  async getAllUser(paginationDto: PaginationDto, currentUser: CurrentUserType) {
    const tenantId = currentUser.tenant?.id;
    if (!tenantId) throw new ForbiddenException(t('tenant_context_missing'));

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const whereCondition: any = { tenantId };
    if (paginationDto.keyword?.trim()) {
      whereCondition.name = ILike(`%${paginationDto.keyword.trim()}%`);
    }

    const [users, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      relations: ['role', 'branch'],
      select: {
        id: true,
        name: true,
        email: true,
        picture: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          id: true,
        },
        role: {
          id: true,
          isAdmin: true,
          name: true,
        },
      },
      where: whereCondition,
    });

    const data = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      picture: u.picture ?? null,
      phone: u.phone ?? null,
      branch_id: u.branch?.id ?? null,
      role: u.role
        ? {
            id: u.role.id,
            name: u.role.name,
          }
        : null,
      role_id: u.role?.id ?? null,
      created_at: u.createdAt ? u.createdAt.toISOString() : null,
      updated_at: u.updatedAt ? u.updatedAt.toISOString() : null,
    }));
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
}
