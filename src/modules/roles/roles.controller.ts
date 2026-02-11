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
    @Res() res: Response,
  ) {
    try {
      const result = await this.rolesService.list(paginationDto, currentUser);
      return res
        .status(HttpStatus.OK)
        .json(
          createSuccessResponse(
            'Get all roles success',
            result.data,
            result.meta,
          ),
        );
    } catch (err) {
      console.error('Failed get all roles', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(createErrorResponse('Failed to get roles', err.message));
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
  ) {
    const created = await this.rolesService.createForOutlet(
      user.outlet.id,
      dto,
      user,
    );
    return {
      status: HttpStatus.CREATED,
      message: 'Role created',
      data: created,
    };
  }

  @Get(':roleId')
  @Permissions('role:read')
  async detail(
    @Param('roleId') roleId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    const items = await this.rolesService.detailRole(roleId, user);
    return { status: HttpStatus.OK, message: 'Role detail', data: items };
  }

  @Patch(':roleId')
  @Permissions('role:update')
  async update(
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const updated = await this.rolesService.updateRole(roleId, dto, user);
    return { status: HttpStatus.OK, message: 'Role updated', data: updated };
  }

  @Delete(':roleId')
  @Permissions('role:delete')
  async remove(
    @Param('roleId') roleId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.rolesService.deleteRole(roleId, user);
    return { status: HttpStatus.OK, message: 'Role deleted' };
  }
}
