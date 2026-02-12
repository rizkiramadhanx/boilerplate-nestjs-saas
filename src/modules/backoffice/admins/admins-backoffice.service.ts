import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { AdminEntity } from './entities/admin.entity';
import { ResponseMeta } from '../../../common/type/response';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CreateAdminBackofficeDto } from './dto/create-admin-backoffice.dto';
import { RegisterAdminBackofficeDto } from './dto/register-admin-backoffice.dto';
import { LoginAdminBackofficeDto } from './dto/login-admin-backoffice.dto';
import { UpdateAdminBackofficeDto } from './dto/update-admin-backoffice.dto';

@Injectable()
export class AdminsBackofficeService {
  constructor(
    @InjectRepository(AdminEntity)
    private adminRepository: Repository<AdminEntity>,
    private configService: ConfigService,
    private jwtService: JwtService,
    @Inject('ADMIN_REFRESH_TOKEN_SERVICE')
    private refreshTokenService: JwtService,
  ) {}

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, keyword = '' } = paginationDto;
    const skip = (page - 1) * limit;

    const [admins, total] = await this.adminRepository.findAndCount({
      skip,
      take: limit,
      where: keyword ? { name: ILike(`%${keyword}%`) } : {},
      order: { createdAt: 'DESC' },
    });

    const data = (Array.isArray(admins) ? admins : [admins]).map((a) =>
      instanceToPlain(plainToInstance(AdminEntity, a), {
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
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('Admin not found');
    const instance = plainToInstance(AdminEntity, admin);
    return instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
  }

  async create(dto: CreateAdminBackofficeDto) {
    const existing = await this.adminRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Admin with this email already exists');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const admin = this.adminRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });
    const saved = await this.adminRepository.save(admin);
    const instance = plainToInstance(AdminEntity, saved);
    return instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
  }

  async update(id: string, dto: UpdateAdminBackofficeDto) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('Admin not found');
    if (dto.email && dto.email !== admin.email) {
      const existing = await this.adminRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Admin with this email already exists');
      }
    }
    if (dto.password) {
      admin.password = await bcrypt.hash(dto.password, 10);
    }
    if (dto.name) admin.name = dto.name;
    if (dto.email) admin.email = dto.email;
    const updated = await this.adminRepository.save(admin);
    const instance = plainToInstance(AdminEntity, updated);
    return instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
  }

  async remove(id: string) {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('Admin not found');
    await this.adminRepository.remove(admin);
    return { message: 'Admin deleted successfully' };
  }

  async register(dto: RegisterAdminBackofficeDto) {
    const secret = this.configService
      .get<string>('ADMIN_SECRET_REGISTER')
      ?.trim();
    if (!secret) {
      throw new ForbiddenException('Admin registration is not configured');
    }
    if (dto.register_secret?.trim() !== secret) {
      throw new ForbiddenException('Invalid register secret');
    }
    const existing = await this.adminRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Admin with this email already exists');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const admin = this.adminRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });
    const saved = await this.adminRepository.save(admin);
    const instance = plainToInstance(AdminEntity, saved);
    const profile = instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
    const tokens = this.generateTokens(saved);
    return { ...tokens, admin: profile };
  }

  async login(dto: LoginAdminBackofficeDto) {
    const admin = await this.adminRepository.findOne({
      where: { email: dto.email },
    });
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await bcrypt.compare(dto.password, admin.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const instance = plainToInstance(AdminEntity, admin);
    const profile = instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
    const tokens = this.generateTokens(admin);
    return { ...tokens, admin: profile };
  }

  private generateTokens(admin: AdminEntity) {
    const payload = { sub: admin.id, email: admin.email, type: 'admin' };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.refreshTokenService.sign(payload);
    return { access_token, refresh_token };
  }
}
