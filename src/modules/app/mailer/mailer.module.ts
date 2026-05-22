import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mailer.service';
import { MailerController } from './mailer.controller';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const port = Number(configService.get<string>('MAIL_PORT')) || 465;
        const secureEnv = configService.get<string>('MAIL_SECURE');
        const secure =
          secureEnv !== undefined ? secureEnv === 'true' : port === 465;
        const fromName =
          configService.get<string>('MAIL_FROM_NAME') || 'No Reply';
        const fromAddress = configService.get<string>('MAIL_FROM');

        return {
          transport: {
            host: configService.get<string>('MAIL_HOST'),
            port,
            secure,
            auth: {
              user: configService.get<string>('MAIL_USER'),
              pass: configService.get<string>('MAIL_PASS'),
            },
          },
          defaults: {
            from: `"${fromName}" <${fromAddress}>`,
          },
          template: {
            dir: path.join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [MailerController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
