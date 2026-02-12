import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  HttpStatus,
  Res,
  Query,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../../common/type/response';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AdminsBackofficeService } from './admins-backoffice.service';
import { CreateAdminBackofficeDto } from './dto/create-admin-backoffice.dto';
import { RegisterAdminBackofficeDto } from './dto/register-admin-backoffice.dto';
import { LoginAdminBackofficeDto } from './dto/login-admin-backoffice.dto';
import { UpdateAdminBackofficeDto } from './dto/update-admin-backoffice.dto';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';

@Controller('backoffice/admins')
export class AdminsBackofficeController {
  constructor(
    private readonly adminsBackofficeService: AdminsBackofficeService,
  ) {}

  @UseGuards(AdminAuthGuard)
  @Get()
  async getAllAdmins(
    @Query() paginationDto: PaginationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.adminsBackofficeService.findAll(paginationDto);
      res.status(HttpStatus.OK);
      return createSuccessResponse(
        'Get all admins success',
        result.data,
        result.meta,
      );
    } catch (err) {
      console.error('Backoffice get all admins', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return createErrorResponse(
        'Failed to get admins',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(AdminAuthGuard)
  @Get(':id')
  async getAdminById(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const admin = await this.adminsBackofficeService.findOne(id);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Get admin success', admin);
    } catch (err) {
      console.error('Backoffice get admin by id', err);
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse('Admin not found', HttpStatus.NOT_FOUND);
    }
  }

  @Post('register')
  async registerAdmin(
    @Body() dto: RegisterAdminBackofficeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.adminsBackofficeService.register(dto);
      res.status(HttpStatus.CREATED);
      return createSuccessResponse('Admin registered successfully', result);
    } catch (err) {
      console.error('Backoffice register admin', err);
      const status =
        err.status === 403
          ? HttpStatus.FORBIDDEN
          : err.status === 409
            ? HttpStatus.CONFLICT
            : HttpStatus.BAD_REQUEST;
      res.status(status);
      return createErrorResponse(
        err.message || 'Failed to register admin',
        status,
      );
    }
  }

  @Post('login')
  async loginAdmin(
    @Body() dto: LoginAdminBackofficeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.adminsBackofficeService.login(dto);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Admin login success', result);
    } catch (err) {
      console.error('Backoffice admin login', err);
      res.status(HttpStatus.UNAUTHORIZED);
      return createErrorResponse(
        err.message || 'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @UseGuards(AdminAuthGuard)
  @Post()
  async createAdmin(
    @Body() dto: CreateAdminBackofficeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const admin = await this.adminsBackofficeService.create(dto);
      res.status(HttpStatus.CREATED);
      return createSuccessResponse('Admin created successfully', admin);
    } catch (err) {
      console.error('Backoffice create admin', err);
      res.status(HttpStatus.CONFLICT);
      return createErrorResponse('Failed to create admin', HttpStatus.CONFLICT);
    }
  }

  @UseGuards(AdminAuthGuard)
  @Put(':id')
  async updateAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateAdminBackofficeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const admin = await this.adminsBackofficeService.update(id, dto);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Admin updated successfully', admin);
    } catch (err) {
      console.error('Backoffice update admin', err);
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(
        'Failed to update admin',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @UseGuards(AdminAuthGuard)
  @Delete(':id')
  async deleteAdmin(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.adminsBackofficeService.remove(id);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Admin deleted successfully', result);
    } catch (err) {
      console.error('Backoffice delete admin', err);
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(
        'Failed to delete admin',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
