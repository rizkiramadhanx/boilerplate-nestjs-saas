import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser, CurrentUserType } from '../../../security/user.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../../common/type/response';
import { LogsService } from '../logs/logs.service';

@Controller('category')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly logsService: LogsService,
  ) {}

  @Permissions('category:create')
  @Post()
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const category = await this.categoriesService.create(
        createCategoryDto,
        currentUser,
      );
      await this.logsService.createLog({
        action: 'category:create',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.CREATED,
      });
      res.status(HttpStatus.CREATED);
      return createSuccessResponse('Category created successfully', category);
    } catch (err) {
      console.error('Failed create category', err);
      await this.logsService.createLog({
        action: 'category:create',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.CONFLICT,
      });
      res.status(HttpStatus.CONFLICT);
      return createErrorResponse(
        'Failed to create category',
        HttpStatus.CONFLICT,
      );
    }
  }

  @Permissions('category:read')
  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.categoriesService.findAll(
        paginationDto,
        currentUser,
      );
      await this.logsService.createLog({
        action: 'category:read',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse(
        'Get all categories success',
        result.data,
        result.meta,
      );
    } catch (err) {
      console.error('Failed get all categories', err);
      await this.logsService.createLog({
        action: 'category:read',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return createErrorResponse(
        'Failed to get categories',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Permissions('category:read')
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const category = await this.categoriesService.findOne(id, currentUser);
      await this.logsService.createLog({
        action: 'category:read',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse('Get category success', category);
    } catch (err) {
      console.error('Failed get category by id', err);
      await this.logsService.createLog({
        action: 'category:read',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.NOT_FOUND,
      });
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse('Category not found', HttpStatus.NOT_FOUND);
    }
  }

  @Permissions('category:update')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const category = await this.categoriesService.update(
        id,
        updateCategoryDto,
        currentUser,
      );
      await this.logsService.createLog({
        action: 'category:update',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse('Category updated successfully', category);
    } catch (err) {
      console.error('Failed update category', err);
      await this.logsService.createLog({
        action: 'category:update',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.NOT_FOUND,
      });
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(
        'Failed to update category',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Permissions('category:delete')
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.categoriesService.remove(id, currentUser);
      await this.logsService.createLog({
        action: 'category:delete',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse('Category deleted successfully', result);
    } catch (err) {
      console.error('Failed delete category', err);
      await this.logsService.createLog({
        action: 'category:delete',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.NOT_FOUND,
      });
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(
        'Failed to delete category',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
