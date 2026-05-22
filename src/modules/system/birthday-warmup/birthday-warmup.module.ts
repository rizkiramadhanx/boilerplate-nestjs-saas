import { Module } from '@nestjs/common';
import { MailModule } from '../../app/mailer/mailer.module';
import { BirthdayWarmupService } from './birthday-warmup.service';

@Module({
  imports: [MailModule],
  providers: [BirthdayWarmupService],
})
export class BirthdayWarmupModule {}
