import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UpdateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateUserDto } from './dto/base-user.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ResponseMeta } from '../../common/type/response';
import { CurrentUserType } from '../../security/user.decorator';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async createUser(createUserDto: CreateUserDto, currentUser: CurrentUserType) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create new user
    const newUser = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
      picture: createUserDto.picture,
      outlet: { id: currentUser.outlet.id },
      role: createUserDto.role_id ? { id: createUserDto.role_id } : null,
    });

    const savedUser = await this.userRepository.save(newUser);
    const instance = plainToInstance(UserEntity, savedUser);
    return instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
  }

  async getUserById(id: string, currentUser: CurrentUserType) {
    const whereCondition: any = { id };

    // Jika user bukan admin, filter berdasarkan outlet
    if (currentUser.role && !currentUser.role.isAdmin && currentUser.outlet) {
      whereCondition.outlet = {
        id: currentUser.outlet.id,
      };
    }

    const user = await this.userRepository.findOne({
      where: whereCondition,
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
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

    // Jika user bukan admin, filter berdasarkan outlet
    if (currentUser.role && !currentUser.role.isAdmin && currentUser.outlet) {
      whereCondition.outlet = {
        id: currentUser.outlet.id,
      };
    }

    const user = await this.userRepository.findOne({
      where: whereCondition,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Handle role update
    if (updateUserDto.role_id) {
      user.role = { id: updateUserDto.role_id } as any;
    }

    // Handle outlet update
    if (updateUserDto.outlet_id) {
      user.outlet = { id: updateUserDto.outlet_id } as any;
    }

    // Assign other fields
    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.password) user.password = updateUserDto.password;
    if (updateUserDto.picture) user.picture = updateUserDto.picture;

    const updatedUser = await this.userRepository.save(user);
    const instance = plainToInstance(UserEntity, updatedUser);
    return instanceToPlain(instance, {
      exposeDefaultValues: true,
    }) as Record<string, unknown>;
  }

  async deleteUser(id: string, currentUser: CurrentUserType) {
    const whereCondition: any = { id };

    // Jika user bukan admin, filter berdasarkan outlet
    if (currentUser.role && !currentUser.role.isAdmin && currentUser.outlet) {
      whereCondition.outlet = {
        id: currentUser.outlet.id,
      };
    }

    const user = await this.userRepository.findOne({
      where: whereCondition,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);
    return { message: 'User deleted successfully' };
  }

  async updateUserProfile(email: string, user: UpdateUserDto) {
    const userExists = this.userRepository.findOne({ where: { email } });
    if (!userExists) throw new NotFoundException('User not found');

    Object.assign(userExists, user);
    return this.userRepository.save(user);
  }

  async getAllUser(paginationDto: PaginationDto, currentUser: CurrentUserType) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      relations: ['role'],
      select: {
        id: true,
        name: true,
        email: true,
        picture: true,
        createdAt: true,
        updatedAt: true,
        role: {
          id: true,
          isAdmin: true,
          name: true,
        },
      },
      where: {
        name: ILike(`%${paginationDto.keyword}%`),
        outlet: {
          id: currentUser.outlet.id,
        },
      },
    });

    const usersSerialized = plainToInstance(UserEntity, users);
    const data = (
      Array.isArray(usersSerialized) ? usersSerialized : [usersSerialized]
    ).map(
      (u) =>
        instanceToPlain(u, { exposeDefaultValues: true }) as Record<
          string,
          unknown
        >,
    );
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
