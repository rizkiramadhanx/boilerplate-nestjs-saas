import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from '../../app/transactions/entities/transaction.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ResponseMeta } from '../../../common/type/response';
import { TransactionType } from '../../app/transactions/enums/transaction-type.enum';
import { TransactionStatus } from '../../app/transactions/entities/transaction.entity';

type TransactionListFilter = PaginationDto & {
  tenantId?: string;
  transactionType?: TransactionType;
  status?: TransactionStatus;
  dateFrom?: string;
  dateTo?: string;
};

function toResponse(t: TransactionEntity) {
  return {
    id: t.id,
    tenant_id: t.tenantId,
    tenant_name: t.tenant?.name ?? null,
    branch_id: t.branchId,
    branch_name: t.branch?.name ?? null,
    user_id: t.userId ?? null,
    user_name: t.user ? `${t.user.name}` : null,
    shift_id: t.shiftId ?? null,
    transaction_type: t.transactionType,
    payment_source: t.paymentSource,
    customer_name: t.customerName,
    principal: t.principal,
    customer_fee: t.customerFee,
    agent_fee: t.agentFee,
    destination_number: t.destinationNumber ?? null,
    destination_name: t.destinationName ?? null,
    destination_provider: t.destinationProvider ?? null,
    status: t.status,
    notes: t.notes ?? null,
    voided_at: t.voidedAt ? t.voidedAt.toISOString() : null,
    void_reason: t.voidReason ?? null,
    created_at: t.createdAt.toISOString(),
    updated_at: t.updatedAt.toISOString(),
  };
}

@Injectable()
export class TransactionsBackofficeService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

  async findAll(filter: TransactionListFilter) {
    const {
      page = 1,
      limit = 20,
      tenantId,
      transactionType,
      status,
      dateFrom,
      dateTo,
    } = filter;
    const skip = (page - 1) * limit;

    const qb = this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.tenant', 'tenant')
      .leftJoinAndSelect('tx.branch', 'branch')
      .leftJoinAndSelect('tx.user', 'user')
      .orderBy('tx.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (tenantId) {
      qb.andWhere('tx.tenantId = :tenantId', { tenantId });
    }
    if (transactionType) {
      qb.andWhere('tx.transactionType = :transactionType', { transactionType });
    }
    if (status) {
      qb.andWhere('tx.status = :status', { status });
    }
    if (dateFrom) {
      qb.andWhere('tx.createdAt >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      qb.andWhere('tx.createdAt <= :dateTo', { dateTo: to });
    }

    const [rows, total] = await qb.getManyAndCount();

    const meta: ResponseMeta = {
      page,
      limit,
      total,
      total_page: Math.ceil(total / limit),
    };
    return { data: rows.map(toResponse), meta };
  }

  async findOne(id: string) {
    const row = await this.transactionRepository.findOne({
      where: { id },
      relations: ['tenant', 'branch', 'user'],
    });
    if (!row) return null;
    return toResponse(row);
  }
}
