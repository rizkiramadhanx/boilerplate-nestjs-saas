import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogEntity } from './entities/log.entity';
import { LogsService } from './logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([LogEntity])],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
