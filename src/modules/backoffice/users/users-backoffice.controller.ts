import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../../common/type/response';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { CreateUserBackofficeDto } from './dto/create-user-backoffice.dto';
import { UpdateUserBackofficeDto } from './dto/update-user-backoffice.dto';
import { UsersBackofficeService } from './users-backoffice.service';

@UseGuards(AdminAuthGuard)
@Controller('backoffice/users')
export class UsersBackofficeController {
  constructor(
    private readonly usersBackofficeService: UsersBackofficeService,
  ) {}

  @Get()
  async getAllUsers(
    @Query() paginationDto: PaginationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.usersBackofficeService.findAll(paginationDto);
      res.status(HttpStatus.OK);
      return createSuccessResponse(
        'Get all users success',
        result.data,
        result.meta,
      );
    } catch (err) {
      console.error('Backoffice get all users', err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return createErrorResponse(
        'Failed to get users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getUserById(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const user = await this.usersBackofficeService.findOne(id);
      res.status(HttpStatus.OK);
      return createSuccessResponse('Get user success', user);
    } catch (err) {
      console.error('Backoffice get user by id', err);
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse('User not found', HttpStatus.NOT_FOUND);
    }
  }

  @Post()
  async createUser(
    @Body() createUserDto: CreateUserBackofficeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const user = await this.usersBackofficeService.create(createUserDto);
      res.status(HttpStatus.CREATED);
      return createSuccessResponse('User created successfully', user);
    } catch (err) {
      console.error('Backoffice create user', err);
      res.status(HttpStatus.CONFLICT);
      return createErrorResponse('Failed to create user', HttpStatus.CONFLICT);
    }
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserBackofficeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const user = await this.usersBackofficeService.update(id, updateUserDto);
      res.status(HttpStatus.OK);
      return createSuccessResponse('User updated successfully', user);
    } catch (err) {
      console.error('Backoffice update user', err);
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse('Failed to update user', HttpStatus.NOT_FOUND);
    }
  }

  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.usersBackofficeService.remove(id);
      res.status(HttpStatus.OK);
      return createSuccessResponse('User deleted successfully', result);
    } catch (err) {
      console.error('Backoffice delete user', err);
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse('Failed to delete user', HttpStatus.NOT_FOUND);
    }
  }
}
