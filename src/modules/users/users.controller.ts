import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  HttpStatus,
  Res,
  Query,
  Body,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { UserService } from './users.service';
import { Response } from 'express';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../common/type/response';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateUserDto } from './dto/base-user.dto';
import { UpdateUserDto } from './dto/create-user.dto';
import { CurrentUser, CurrentUserType } from '../../security/user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Permissions('user:read')
  @Get()
  async getAllProfile(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res() res: Response,
  ) {
    try {
      const result = await this.usersService.getAllUser(
        paginationDto,
        currentUser,
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createSuccessResponse(
            'Get All user success',
            result.data,
            result.meta,
          ),
        );
    } catch (err) {
      console.error('Failed get all user profile', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(createErrorResponse('Failed to get profile', err.message));
    }
  }

  @Permissions('user:read')
  @Get(':id')
  async getUserById(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res() res: Response,
  ) {
    try {
      const user = await this.usersService.getUserById(id, currentUser);

      return res
        .status(HttpStatus.OK)
        .json(createSuccessResponse('Get user success', user));
    } catch (err) {
      console.error('Failed get user by id', err);
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(createErrorResponse('User not found', err.message));
    }
  }

  @Permissions('user:create')
  @Post()
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res() res: Response,
  ) {
    try {
      const user = await this.usersService.createUser(
        createUserDto,
        currentUser,
      );

      return res
        .status(HttpStatus.CREATED)
        .json(createSuccessResponse('User created successfully', user));
    } catch (err) {
      console.error('Failed create user', err);
      return res
        .status(HttpStatus.CONFLICT)
        .json(createErrorResponse('Failed to create user', err.message));
    }
  }

  @Permissions('user:update')
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res() res: Response,
  ) {
    try {
      const user = await this.usersService.updateUser(
        id,
        updateUserDto,
        currentUser,
      );

      return res
        .status(HttpStatus.OK)
        .json(createSuccessResponse('User updated successfully', user));
    } catch (err) {
      console.error('Failed update user', err);
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(createErrorResponse('Failed to update user', err.message));
    }
  }

  @Permissions('user:delete')
  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res() res: Response,
  ) {
    try {
      const result = await this.usersService.deleteUser(id, currentUser);

      return res
        .status(HttpStatus.OK)
        .json(createSuccessResponse('User deleted successfully', result));
    } catch (err) {
      console.error('Failed delete user', err);
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(createErrorResponse('Failed to delete user', err.message));
    }
  }
}
