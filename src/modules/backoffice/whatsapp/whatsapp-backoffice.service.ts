import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsappBackofficeService {
  testSend(phone: string, message: string): Promise<boolean> {
    void phone;
    void message;
    return Promise.resolve(false);
  }
}
