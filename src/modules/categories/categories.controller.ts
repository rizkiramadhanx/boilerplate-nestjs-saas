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
import { CurrentUser, CurrentUserType } from '../../security/user.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../common/type/response';

@Controller('category')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Permissions('category:create')
  @Post()
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res() res: Response,
  ) {
    try {
      const category = await this.categoriesService.create(
        createCategoryDto,
        currentUser,
      );

      return res
        .status(HttpStatus.CREATED)
        .json(createSuccessResponse('Category created successfully', category));
    } catch (err) {
      console.error('Failed create category', err);
      return res
        .status(HttpStatus.CONFLICT)
        .json(createErrorResponse('Failed to create category', err.message));
    }
  }

  @Permissions('category:read')
  @Get()
  async findAll(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res() res: Response,
  ) {
    try {
      const result = await this.categoriesService.findAll(
        paginationDto,
        currentUser,
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createSuccessResponse(
            'Get all categories success',
            result.data,
            result.meta,
          ),
        );
    } catch (err) {
      console.error('Failed get all categories', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(createErrorResponse('Failed to get categories', err.message));
    }
  }

  @Permissions('category:read')
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res() res: Response,
  ) {
    try {
      const category = await this.categoriesService.findOne(id, currentUser);

      return res
        .status(HttpStatus.OK)
        .json(createSuccessResponse('Get category success', category));
    } catch (err) {
      console.error('Failed get category by id', err);
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(createErrorResponse('Category not found', err.message));
    }
  }

  @Permissions('category:update')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res() res: Response,
  ) {
    try {
      const category = await this.categoriesService.update(
        id,
        updateCategoryDto,
        currentUser,
      );

      return res
        .status(HttpStatus.OK)
        .json(createSuccessResponse('Category updated successfully', category));
    } catch (err) {
      console.error('Failed update category', err);
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(createErrorResponse('Failed to update category', err.message));
    }
  }

  @Permissions('category:delete')
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res() res: Response,
  ) {
    try {
      const result = await this.categoriesService.remove(id, currentUser);

      return res
        .status(HttpStatus.OK)
        .json(createSuccessResponse('Category deleted successfully', result));
    } catch (err) {
      console.error('Failed delete category', err);
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(createErrorResponse('Failed to delete category', err.message));
    }
  }
}
