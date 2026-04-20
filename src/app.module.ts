import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/app/auth/auth.module';
import { UsersModule } from './modules/app/users/users.module';
import { ProductsModule } from './modules/app/products/products.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RolesModule } from './modules/app/roles/roles.module';
import { CategoriesModule } from './modules/app/categories/categories.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MailModule } from './modules/app/mailer/mailer.module';
import { BackofficeModule } from './modules/backoffice/backoffice.module';
import { LogsModule } from './modules/app/logs/logs.module';

@Module({
  imports: [
    BackofficeModule,
    LogsModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    MailModule,
    RolesModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
