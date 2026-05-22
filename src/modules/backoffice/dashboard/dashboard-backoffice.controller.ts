import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../../common/type/response';
import { AdminAuthGuard } from '../../app/auth/guards/admin-auth.guard';
import { DashboardBackofficeService } from './dashboard-backoffice.service';

@UseGuards(AdminAuthGuard)
@Controller('backoffice/dashboard')
export class DashboardBackofficeController {
  constructor(
    private readonly dashboardBackofficeService: DashboardBackofficeService,
  ) {}

  @Get('summary')
  async getSummary(
    @Query('year') year: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const parsedYear = year ? Number(year) : undefined;
      const yearArg =
        parsedYear && !Number.isNaN(parsedYear) ? parsedYear : undefined;
      const data = await this.dashboardBackofficeService.getSummary(yearArg);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Dashboard summary', data);
    } catch (err) {
      console.error('Backoffice dashboard summary', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return createErrorResponse(
        'Failed to load dashboard summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
