import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogEntity, LogStatus } from './entities/log.entity';

export interface CreateLogDto {
  action: string;
  status: LogStatus;
  statusCode: number;
  userId?: string;
  branchId?: string;
}

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(LogEntity)
    private readonly logRepo: Repository<LogEntity>,
  ) {}

  async createLog(data: CreateLogDto): Promise<LogEntity> {
    const log = this.logRepo.create(data);
    return this.logRepo.save(log);
  }
}
