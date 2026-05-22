import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { UserBranchesService } from './user-branches.service';
import {
  CreateUserBranchDto,
  UpdateUserBranchDto,
} from './dto/user-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser, CurrentUserType } from '../../../security/user.decorator';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../../common/type/response';
import { LogsService } from '../logs/logs.service';
import { t } from '../../../constant/messages';

@Controller('user/:userId/branch')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserBranchesController {
  constructor(
    private readonly svc: UserBranchesService,
    private readonly logsService: LogsService,
  ) {}

  @Get()
  @Permissions('user:read')
  async list(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const data = await this.svc.listForUser(userId, currentUser);
      return createSuccessResponse('Delegation list', data);
    } catch (err) {
      console.error('Failed list delegation', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return createErrorResponse(
        err instanceof Error ? err.message : t('failed_list_delegation'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @Permissions('user:update')
  async create(
    @Param('userId') userId: string,
    @Body() dto: CreateUserBranchDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const created = await this.svc.create(userId, dto, currentUser);
      await this.logsService.createLog({
        action: 'user:delegate:create',
        branchId: currentUser.branch?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.CREATED,
      });
      res.status(HttpStatus.CREATED);
      return createSuccessResponse('User delegated to branch', created);
    } catch (err) {
      console.error('Failed create delegation', err);
      const message =
        err instanceof Error ? err.message : t('failed_create_delegation');
      const code =
        err instanceof Error && 'status' in err
          ? (err as { status: number }).status
          : HttpStatus.CONFLICT;
      res.status(code);
      return createErrorResponse(message, code);
    }
  }

  @Patch(':assignmentId')
  @Permissions('user:update')
  async update(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: UpdateUserBranchDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const updated = await this.svc.update(assignmentId, dto, currentUser);
      await this.logsService.createLog({
        action: 'user:delegate:update',
        branchId: currentUser.branch?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      return createSuccessResponse('Delegation updated', updated);
    } catch (err) {
      console.error('Failed update delegation', err);
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(
        err instanceof Error ? err.message : t('failed_update_delegation'),
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Delete(':assignmentId')
  @Permissions('user:update')
  async remove(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      await this.svc.remove(assignmentId, currentUser);
      await this.logsService.createLog({
        action: 'user:delegate:delete',
        branchId: currentUser.branch?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      return createSuccessResponse('Delegation removed', true);
    } catch (err) {
      console.error('Failed remove delegation', err);
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(
        err instanceof Error ? err.message : t('failed_remove_delegation'),
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
