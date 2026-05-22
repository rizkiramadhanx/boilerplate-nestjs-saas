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
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser, CurrentUserType } from '../../../security/user.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../../common/type/response';
import { LogsService } from '../logs/logs.service';
import { t } from '../../../constant/messages';

@Controller('branch')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
    private readonly logsService: LogsService,
  ) {}

  @Get()
  @Permissions('option:branch', 'branch:read')
  async all(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.branchesService.list(
        paginationDto,
        currentUser,
      );
      res.status(HttpStatus.OK);
      return createSuccessResponse(
        'Get all branches success',
        result.data,
        result.meta,
      );
    } catch (err) {
      console.error('Failed get all branches', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return createErrorResponse(
        t('failed_get_branches'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @Permissions('branch:create')
  async create(
    @Body() dto: CreateBranchDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const branch = await this.branchesService.create(dto, currentUser);
      await this.logsService.createLog({
        action: 'branch:create',
        branchId: currentUser.branch?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.CREATED,
      });
      res.status(HttpStatus.CREATED);
      return createSuccessResponse('Branch created', branch);
    } catch (err) {
      console.error('Failed create branch', err);
      await this.logsService.createLog({
        action: 'branch:create',
        branchId: currentUser.branch?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.CONFLICT,
      });
      res.status(HttpStatus.CONFLICT);
      return createErrorResponse(
        t('failed_create_branch'),
        HttpStatus.CONFLICT,
      );
    }
  }

  @Get(':id')
  @Permissions('branch:read')
  async detail(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const branch = await this.branchesService.detail(id, currentUser);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Branch detail', branch);
    } catch (err) {
      console.error('Failed get branch detail', err);
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(t('branch_not_found'), HttpStatus.NOT_FOUND);
    }
  }

  @Patch(':id')
  @Permissions('branch:update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const branch = await this.branchesService.update(id, dto, currentUser);
      await this.logsService.createLog({
        action: 'branch:update',
        branchId: currentUser.branch?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse('Branch updated', branch);
    } catch (err) {
      console.error('Failed update branch', err);
      await this.logsService.createLog({
        action: 'branch:update',
        branchId: currentUser.branch?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.NOT_FOUND,
      });
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(
        t('failed_update_branch'),
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Delete(':id')
  @Permissions('branch:delete')
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      await this.branchesService.remove(id, currentUser);
      await this.logsService.createLog({
        action: 'branch:delete',
        branchId: currentUser.branch?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse('Branch deleted', true);
    } catch (err) {
      console.error('Failed delete branch', err);
      await this.logsService.createLog({
        action: 'branch:delete',
        branchId: currentUser.branch?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.NOT_FOUND,
      });
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(
        t('failed_delete_branch'),
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
