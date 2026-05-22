import {
  Controller,
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
import { PaymentsBackofficeService } from './payments-backoffice.service';

@UseGuards(AdminAuthGuard)
@Controller('backoffice/payments')
export class PaymentsBackofficeController {
  constructor(
    private readonly paymentsBackofficeService: PaymentsBackofficeService,
  ) {}

  @Get()
  async getAll(
    @Query() paginationDto: PaginationDto,
    @Query('status') status: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.paymentsBackofficeService.findAll({
        ...paginationDto,
        status: status && status.trim() ? status.trim() : undefined,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse(
        'Get all payments success',
        result.data,
        result.meta,
      );
    } catch (err) {
      console.error('Backoffice get all payments', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return createErrorResponse(
        'Failed to get payments',
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
      const data = await this.paymentsBackofficeService.findOne(id);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Get payment success', data);
    } catch (err) {
      console.error('Backoffice get payment by id', err);
      const status =
        err instanceof HttpException ? err.getStatus() : HttpStatus.NOT_FOUND;
      const message =
        err instanceof HttpException ? err.message : 'Payment not found';
      res.status(status);
      return createErrorResponse(message, status);
    }
  }

  @Post(':id/validate')
  async validate(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const data = await this.paymentsBackofficeService.validate(id);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Payment validated', data);
    } catch (err) {
      console.error('Backoffice validate payment', err);
      const status =
        err instanceof HttpException
          ? err.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        err instanceof HttpException
          ? err.message
          : 'Gagal validasi ke Pakasir';
      res.status(status);
      return createErrorResponse(message, status);
    }
  }

  @Post(':id/mark-paid')
  async markAsPaid(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const data = await this.paymentsBackofficeService.markAsPaid(id);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Payment marked as paid', data);
    } catch (err) {
      console.error('Backoffice mark as paid', err);
      const status =
        err instanceof HttpException
          ? err.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        err instanceof HttpException ? err.message : 'Gagal mark as paid';
      res.status(status);
      return createErrorResponse(message, status);
    }
  }
}
