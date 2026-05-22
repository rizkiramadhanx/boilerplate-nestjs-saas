import { Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { UserBranchEntity } from './entities/user-branch.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogsModule } from '../logs/logs.module';
import { UserBranchesController } from './user-branches.controller';
import { UserBranchesService } from './user-branches.service';
import { BranchEntity } from '../branches/entities/branch.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { MailModule } from '../mailer/mailer.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserBranchEntity,
      BranchEntity,
      TenantEntity,
    ]),
    LogsModule,
    MailModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController, UserBranchesController],
  providers: [UserService, UserBranchesService],
  exports: [UserService, UserBranchesService],
})
export class UsersModule {}
