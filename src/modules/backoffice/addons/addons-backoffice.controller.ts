import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../../common/type/response';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AdminAuthGuard } from '../../app/auth/guards/admin-auth.guard';
import { AddonsBackofficeService } from './addons-backoffice.service';

@UseGuards(AdminAuthGuard)
@Controller('backoffice/addons')
export class AddonsBackofficeController {
  constructor(
    private readonly addonsBackofficeService: AddonsBackofficeService,
  ) {}

  @Get()
  async getAll(
    @Query() paginationDto: PaginationDto,
    @Query('status') status: string | undefined,
    @Query('type') type: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.addonsBackofficeService.findAll({
        ...paginationDto,
        status: status && status.trim() ? status.trim() : undefined,
        type: type && type.trim() ? type.trim() : undefined,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse(
        'Get all addons success',
        result.data,
        result.meta,
      );
    } catch (err) {
      console.error('Backoffice get all addons', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return createErrorResponse(
        'Failed to get addons',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const data = await this.addonsBackofficeService.findOne(id);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Get addon success', data);
    } catch (err) {
      const status =
        err instanceof HttpException ? err.getStatus() : HttpStatus.NOT_FOUND;
      const message =
        err instanceof HttpException ? err.message : 'Addon not found';
      res.status(status);
      return createErrorResponse(message, status);
    }
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const data = await this.addonsBackofficeService.cancel(id);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Addon cancelled', data);
    } catch (err) {
      const status =
        err instanceof HttpException
          ? err.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        err instanceof HttpException ? err.message : 'Gagal membatalkan add-on';
      res.status(status);
      return createErrorResponse(message, status);
    }
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const data = await this.addonsBackofficeService.remove(id);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Addon deleted', data);
    } catch (err) {
      const status =
        err instanceof HttpException
          ? err.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        err instanceof HttpException ? err.message : 'Gagal menghapus add-on';
      res.status(status);
      return createErrorResponse(message, status);
    }
  }
}
