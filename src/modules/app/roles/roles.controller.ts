import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser, CurrentUserType } from '../../../security/user.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../../common/type/response';
import ACTION_ROLES from 'src/constant/action-roles';
import { LogsService } from '../logs/logs.service';
import { t } from '../../../constant/messages';

@Controller('role')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly logsService: LogsService,
  ) {}

  @Get()
  @Permissions('option:role', 'role:read')
  async all(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.rolesService.list(paginationDto, currentUser);
      res.status(HttpStatus.OK);
      return createSuccessResponse(
        'Get all roles success',
        result.data,
        result.meta,
      );
    } catch (err) {
      console.error('Failed get all roles', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return createErrorResponse(
        t('failed_get_roles'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('list-action')
  async listRoles(@CurrentUser() currentUser: CurrentUserType) {
    await this.logsService.createLog({
      action: 'role:list-action',
      branchId: currentUser.branch?.id,
      userId: currentUser.id,
      status: 'SUCCESS',
      statusCode: HttpStatus.OK,
    });
    return {
      status: HttpStatus.OK,
      message: 'Action list',
      data: ACTION_ROLES,
    };
  }

  @Post()
  @Permissions('role:create')
  async create(
    @Body() dto: CreateRoleDto,
    @CurrentUser() user: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const created = await this.rolesService.createForTenant(dto, user);
      await this.logsService.createLog({
        action: 'role:create',
        branchId: user.branch?.id,
        userId: user.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.CREATED,
      });
      res.status(HttpStatus.CREATED);
      return createSuccessResponse('Role created', created);
    } catch (err) {
      console.error('Failed create role', err);
      await this.logsService.createLog({
        action: 'role:create',
        branchId: user.branch?.id,
        userId: user.id,
        status: 'ERROR',
        statusCode: HttpStatus.CONFLICT,
      });
      res.status(HttpStatus.CONFLICT);
      return createErrorResponse(t('failed_create_role'), HttpStatus.CONFLICT);
    }
  }

  @Get(':roleId')
  @Permissions('role:read')
  async detail(
    @Param('roleId') roleId: string,
    @CurrentUser() user: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const items = await this.rolesService.detailRole(roleId, user);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Role detail', items);
    } catch (err) {
      console.error('Failed get role detail', err);
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(t('role_not_found'), HttpStatus.NOT_FOUND);
    }
  }

  @Patch(':roleId')
  @Permissions('role:update')
  async update(
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const updated = await this.rolesService.updateRole(roleId, dto, user);
      await this.logsService.createLog({
        action: 'role:update',
        branchId: user.branch?.id,
        userId: user.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse('Role updated', updated);
    } catch (err) {
      console.error('Failed update role', err);
      await this.logsService.createLog({
        action: 'role:update',
        branchId: user.branch?.id,
        userId: user.id,
        status: 'ERROR',
        statusCode: HttpStatus.NOT_FOUND,
      });
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(t('failed_update_role'), HttpStatus.NOT_FOUND);
    }
  }

  @Delete(':roleId')
  @Permissions('role:delete')
  async remove(
    @Param('roleId') roleId: string,
    @CurrentUser() user: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      await this.rolesService.deleteRole(roleId, user);
      await this.logsService.createLog({
        action: 'role:delete',
        branchId: user.branch?.id,
        userId: user.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse('Role deleted', true);
    } catch (err) {
      console.error('Failed delete role', err);
      await this.logsService.createLog({
        action: 'role:delete',
        branchId: user.branch?.id,
        userId: user.id,
        status: 'ERROR',
        statusCode: HttpStatus.NOT_FOUND,
      });
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(t('failed_delete_role'), HttpStatus.NOT_FOUND);
    }
  }
}
