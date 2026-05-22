import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../app/mailer/mailer.service';
import * as fs from 'fs';
import * as path from 'path';
import { Cron } from '@nestjs/schedule';

interface BirthdayContact {
  nama: string;
  email: string;
  tanggal_lahir: string;
  hari: number | null;
  bulan: number | null;
  tahun: number | null;
  posisi: string;
  sent: boolean;
}

const DATA_PATH = path.join(process.cwd(), 'birthday_list.json');

@Injectable()
export class BirthdayWarmupService {
  private readonly logger = new Logger(BirthdayWarmupService.name);

  constructor(private readonly mailService: MailService) {}

  @Cron('0 3 * * *')
  async sendBirthdayEmails() {
    if (process.env.NODE_ENV !== 'production') return;
    const now = new Date();
    const hariIni = now.getUTCDate();
    const bulanIni = now.getUTCMonth() + 1;

    let contacts: BirthdayContact[];
    try {
      const raw = fs.readFileSync(DATA_PATH, 'utf8');
      contacts = JSON.parse(raw);
    } catch {
      this.logger.error('Gagal membaca birthday_list.json');
      return;
    }

    const targets = contacts.filter(
      (c) => c.hari === hariIni && c.bulan === bulanIni && !c.sent && c.email,
    );

    if (!targets.length) {
      this.logger.log(
        `[Birthday] Tidak ada ulang tahun hari ini (${hariIni}/${bulanIni})`,
      );
      return;
    }

    // Ambil 10-15 secara acak
    const limit = Math.floor(Math.random() * 6) + 10; // 10..15
    const selected = targets.sort(() => Math.random() - 0.5).slice(0, limit);

    this.logger.log(
      `[Birthday] ${targets.length} orang ultah hari ini, kirim ke ${selected.length}`,
    );

    const tahunIni = now.getUTCFullYear();

    let successCount = 0;
    for (const contact of selected) {
      try {
        const usia = contact.tahun ? tahunIni - contact.tahun : null;
        await this.mailService.sendBirthdayEmail(
          contact.email,
          contact.nama,
          usia,
        );
        contact.sent = true;
        successCount++;
      } catch (err) {
        this.logger.error(`Gagal kirim ke ${contact.email}`, err);
      }
    }

    // Persist status sent
    try {
      fs.writeFileSync(DATA_PATH, JSON.stringify(contacts, null, 2), 'utf8');
    } catch {
      this.logger.error('Gagal menyimpan update birthday_list.json');
    }

    this.logger.log(
      `[Birthday] Selesai: ${successCount}/${selected.length} email terkirim`,
    );
  }
}
