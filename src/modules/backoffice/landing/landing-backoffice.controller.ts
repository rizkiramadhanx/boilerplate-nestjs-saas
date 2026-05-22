import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../../common/type/response';
import { LandingBackofficeService } from './landing-backoffice.service';

@Controller('backoffice/landing')
export class LandingBackofficeController {
  constructor(private readonly landingService: LandingBackofficeService) {}

  @Get('packages')
  async getPackages(@Res({ passthrough: true }) res: Response) {
    try {
      const data = await this.landingService.getPackages();
      res.status(HttpStatus.OK);
      return createSuccessResponse('Get packages success', data);
    } catch (err) {
      console.error('Landing get packages', err);
      const status =
        err instanceof HttpException
          ? err.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        err instanceof HttpException ? err.message : 'Failed to get packages';
      res.status(status);
      return createErrorResponse(message, status);
    }
  }
}
