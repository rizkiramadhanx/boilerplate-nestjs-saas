import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RolesModule } from './modules/roles/roles.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MailModule } from './modules/mailer/mailer.module';
import { BackofficeModule } from './modules/backoffice/backoffice.module';

@Module({
  imports: [
    BackofficeModule,
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
