import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../../common/type/response';
import { TenantFilterDto } from './dto/tenant-filter.dto';
import { AdminAuthGuard } from '../../app/auth/guards/admin-auth.guard';
import { TenantsBackofficeService } from './tenants-backoffice.service';

@UseGuards(AdminAuthGuard)
@Controller('backoffice/tenants')
export class TenantsBackofficeController {
  constructor(
    private readonly tenantsBackofficeService: TenantsBackofficeService,
  ) {}

  @Get()
  async getAllTenants(
    @Query() paginationDto: TenantFilterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.tenantsBackofficeService.findAll(paginationDto);
      res.status(HttpStatus.OK);
      return createSuccessResponse(
        'Get all tenants success',
        result.data,
        result.meta,
      );
    } catch (err) {
      console.error('Backoffice get all tenants', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return createErrorResponse(
        'Failed to get tenants',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getTenantDetail(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.tenantsBackofficeService.findOne(id);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Get tenant detail success', result);
    } catch (err) {
      console.error('Backoffice get tenant detail', err);
      const status =
        err instanceof HttpException ? err.getStatus() : HttpStatus.NOT_FOUND;
      const message =
        err instanceof HttpException ? err.message : 'Failed to get tenant';
      res.status(status);
      return createErrorResponse(message, status);
    }
  }

  @Delete(':id')
  async deleteTenant(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.tenantsBackofficeService.remove(id);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Tenant deleted successfully', result);
    } catch (err) {
      console.error('Backoffice delete tenant', err);
      const status =
        err instanceof HttpException ? err.getStatus() : HttpStatus.NOT_FOUND;
      const message =
        err instanceof HttpException ? err.message : 'Failed to delete tenant';
      res.status(status);
      return createErrorResponse(message, status);
    }
  }
}
