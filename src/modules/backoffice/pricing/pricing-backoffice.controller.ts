import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../../common/type/response';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AdminAuthGuard } from '../../app/auth/guards/admin-auth.guard';
import { CreatePricingBackofficeDto } from './dto/create-pricing-backoffice.dto';
import { UpdatePricingBackofficeDto } from './dto/update-pricing-backoffice.dto';
import { PricingBackofficeService } from './pricing-backoffice.service';

@UseGuards(AdminAuthGuard)
@Controller('backoffice/pricing')
export class PricingBackofficeController {
  constructor(
    private readonly pricingBackofficeService: PricingBackofficeService,
  ) {}

  @Get()
  async list(
    @Query() paginationDto: PaginationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.pricingBackofficeService.findAll(paginationDto);
      res.status(HttpStatus.OK);
      return createSuccessResponse(
        'Get all pricing success',
        result.data,
        result.meta,
      );
    } catch (err) {
      console.error('Backoffice get all pricing', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return createErrorResponse(
        'Failed to get pricing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const row = await this.pricingBackofficeService.findOne(id);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Get pricing success', row);
    } catch (err) {
      console.error('Backoffice get pricing by id', err);
      const status =
        err instanceof HttpException ? err.getStatus() : HttpStatus.NOT_FOUND;
      const message =
        err instanceof HttpException ? err.message : 'Pricing not found';
      res.status(status);
      return createErrorResponse(message, status);
    }
  }

  @Post()
  async create(
    @Body() dto: CreatePricingBackofficeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const row = await this.pricingBackofficeService.create(dto);
      res.status(HttpStatus.CREATED);
      return createSuccessResponse('Pricing created successfully', row);
    } catch (err) {
      console.error('Backoffice create pricing', err);
      const status =
        err instanceof HttpException ? err.getStatus() : HttpStatus.BAD_REQUEST;
      const message =
        err instanceof HttpException ? err.message : 'Failed to create pricing';
      res.status(status);
      return createErrorResponse(message, status);
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePricingBackofficeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const row = await this.pricingBackofficeService.update(id, dto);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Pricing updated successfully', row);
    } catch (err) {
      console.error('Backoffice update pricing', err);
      const status =
        err instanceof HttpException ? err.getStatus() : HttpStatus.BAD_REQUEST;
      const message =
        err instanceof HttpException ? err.message : 'Failed to update pricing';
      res.status(status);
      return createErrorResponse(message, status);
    }
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.pricingBackofficeService.remove(id);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Pricing deleted successfully', result);
    } catch (err) {
      console.error('Backoffice delete pricing', err);
      const status =
        err instanceof HttpException ? err.getStatus() : HttpStatus.NOT_FOUND;
      const message =
        err instanceof HttpException ? err.message : 'Failed to delete pricing';
      res.status(status);
      return createErrorResponse(message, status);
    }
  }
}
