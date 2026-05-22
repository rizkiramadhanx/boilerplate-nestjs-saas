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
} from '../../../common/type/response';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CreateUserDto } from './dto/base-user.dto';
import { UpdateUserDto } from './dto/create-user.dto';
import { CurrentUser, CurrentUserType } from '../../../security/user.decorator';
import { LogsService } from '../logs/logs.service';
import { t } from '../../../constant/messages';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly usersService: UserService,
    private readonly logsService: LogsService,
  ) {}

  @Permissions('user:read')
  @Get()
  async getAllProfile(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.usersService.getAllUser(
        paginationDto,
        currentUser,
      );

      res.status(HttpStatus.OK);
      return createSuccessResponse(
        'Get All user success',
        result.data,
        result.meta,
      );
    } catch (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return createErrorResponse(
        t('failed_get_users'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Permissions('user:read')
  @Get(':id')
  async getUserById(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const user = await this.usersService.getUserById(id, currentUser);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Get user success', user);
    } catch (err) {
      console.error('Failed get user by id', err);
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(t('user_not_found'), HttpStatus.NOT_FOUND);
    }
  }

  @Permissions('user:create')
  @Post()
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const user = await this.usersService.createUser(
        createUserDto,
        currentUser,
      );
      await this.logsService.createLog({
        action: 'user:create',
        branchId: currentUser.branch?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.CREATED,
      });
      res.status(HttpStatus.CREATED);
      return createSuccessResponse('User created successfully', user);
    } catch (err) {
      console.error('Failed create user', err);
      await this.logsService.createLog({
        action: 'user:create',
        branchId: currentUser.branch?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.CONFLICT,
      });
      res.status(HttpStatus.CONFLICT);
      return createErrorResponse(t('failed_create_user'), HttpStatus.CONFLICT);
    }
  }

  @Permissions('user:update')
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const user = await this.usersService.updateUser(
        id,
        updateUserDto,
        currentUser,
      );
      await this.logsService.createLog({
        action: 'user:update',
        branchId: currentUser.branch?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse('User updated successfully', user);
    } catch (err) {
      console.error('Failed update user', err);
      await this.logsService.createLog({
        action: 'user:update',
        branchId: currentUser.branch?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.NOT_FOUND,
      });
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(t('failed_update_user'), HttpStatus.NOT_FOUND);
    }
  }

  @Permissions('user:delete')
  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.usersService.deleteUser(id, currentUser);
      await this.logsService.createLog({
        action: 'user:delete',
        branchId: currentUser.branch?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse('User deleted successfully', result);
    } catch (err) {
      console.error('Failed delete user', err);
      await this.logsService.createLog({
        action: 'user:delete',
        branchId: currentUser.branch?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.NOT_FOUND,
      });
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(t('failed_delete_user'), HttpStatus.NOT_FOUND);
    }
  }
}
