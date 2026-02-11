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
import { CurrentUser, CurrentUserType } from '../../security/user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../common/type/response';
import ACTION_ROLES from 'src/constant/action-roles';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('role:read')
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
        'Failed to get roles',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('list-action')
  async listRoles() {
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
      const created = await this.rolesService.createForOutlet(
        user.outlet.id,
        dto,
        user,
      );
      res.status(HttpStatus.CREATED);
      return createSuccessResponse('Role created', created);
    } catch (err) {
      console.error('Failed create role', err);
      res.status(HttpStatus.CONFLICT);
      return createErrorResponse('Failed to create role', HttpStatus.CONFLICT);
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
      return createErrorResponse('Role not found', HttpStatus.NOT_FOUND);
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
      res.status(HttpStatus.OK);
      return createSuccessResponse('Role updated', updated);
    } catch (err) {
      console.error('Failed update role', err);
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse('Failed to update role', HttpStatus.NOT_FOUND);
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
      res.status(HttpStatus.OK);
      return createSuccessResponse('Role deleted', true);
    } catch (err) {
      console.error('Failed delete role', err);
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse('Failed to delete role', HttpStatus.NOT_FOUND);
    }
  }
}
