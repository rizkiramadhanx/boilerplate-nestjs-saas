import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TestSendDto } from './dto/test-send.dto';
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../../common/type/response';
import { AdminAuthGuard } from '../../app/auth/guards/admin-auth.guard';
import { WhatsappBackofficeService } from './whatsapp-backoffice.service';

@UseGuards(AdminAuthGuard)
@Controller('backoffice/whatsapp')
export class WhatsappBackofficeController {
  constructor(private readonly service: WhatsappBackofficeService) {}

  @Post('test-send')
  async testSend(@Body() dto: TestSendDto) {
    try {
      const ok = await this.service.testSend(dto.phone, dto.message);
      if (!ok) throw new Error('Gagal mengirim pesan');
      return createSuccessResponse('Pesan terkirim', null);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
}
