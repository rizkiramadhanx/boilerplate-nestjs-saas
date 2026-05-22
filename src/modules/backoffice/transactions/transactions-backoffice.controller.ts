import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
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
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AdminAuthGuard } from '../../app/auth/guards/admin-auth.guard';
import { TransactionsBackofficeService } from './transactions-backoffice.service';
import { TransactionType } from '../../app/transactions/enums/transaction-type.enum';
import { TransactionStatus } from '../../app/transactions/entities/transaction.entity';

@UseGuards(AdminAuthGuard)
@Controller('backoffice/transactions')
export class TransactionsBackofficeController {
  constructor(
    private readonly transactionsBackofficeService: TransactionsBackofficeService,
  ) {}

  @Get()
  async getAll(
    @Query() paginationDto: PaginationDto,
    @Query('tenant_id') tenantId: string | undefined,
    @Query('transaction_type') transactionType: TransactionType | undefined,
    @Query('status') status: TransactionStatus | undefined,
    @Query('date_from') dateFrom: string | undefined,
    @Query('date_to') dateTo: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.transactionsBackofficeService.findAll({
        ...paginationDto,
        tenantId: tenantId?.trim() || undefined,
        transactionType: transactionType || undefined,
        status: status || undefined,
        dateFrom: dateFrom?.trim() || undefined,
        dateTo: dateTo?.trim() || undefined,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse(
        'Get all transactions success',
        result.data,
        result.meta,
      );
    } catch (err) {
      console.error('Backoffice get all transactions', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return createErrorResponse(
        'Failed to get transactions',
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
      const data = await this.transactionsBackofficeService.findOne(id);
      if (!data) throw new NotFoundException('Transaction not found');
      res.status(HttpStatus.OK);
      return createSuccessResponse('Get transaction success', data);
    } catch (err) {
      console.error('Backoffice get transaction by id', err);
      const status =
        err instanceof HttpException ? err.getStatus() : HttpStatus.NOT_FOUND;
      const message =
        err instanceof HttpException ? err.message : 'Transaction not found';
      res.status(status);
      return createErrorResponse(message, status);
    }
  }
}
