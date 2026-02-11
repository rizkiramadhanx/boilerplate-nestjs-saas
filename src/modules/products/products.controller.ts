import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../common/type/response';
import { CurrentUser, CurrentUserType } from '../../security/user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BaseProductDto } from './dto/base-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('product')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Permissions('product:read')
  @Get()
  async getAllProducts(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res() res: Response,
  ) {
    try {
      const result = await this.productsService.getAllProducts(
        paginationDto,
        currentUser,
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createSuccessResponse(
            'Get all products success',
            result.data,
            result.meta,
          ),
        );
    } catch (err) {
      console.error('Failed get all products', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(createErrorResponse('Failed to get products', err.message));
    }
  }

  @Permissions('product:read')
  @Get(':id')
  async getProductById(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res() res: Response,
  ) {
    try {
      const product = await this.productsService.getProductById(
        id,
        currentUser,
      );

      return res
        .status(HttpStatus.OK)
        .json(createSuccessResponse('Get product success', product));
    } catch (err) {
      console.error('Failed get product by id', err);
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(createErrorResponse('Product not found', err.message));
    }
  }

  @Permissions('product:create')
  @Post()
  async createProduct(
    @Body() createProductDto: BaseProductDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res() res: Response,
  ) {
    try {
      const product = await this.productsService.createProduct(
        createProductDto,
        currentUser,
      );

      return res
        .status(HttpStatus.CREATED)
        .json(createSuccessResponse('Product created successfully', product));
    } catch (err) {
      console.error('Failed create product', err);
      return res
        .status(HttpStatus.CONFLICT)
        .json(createErrorResponse('Failed to create product', err.message));
    }
  }

  @Permissions('product:update')
  @Patch(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res() res: Response,
  ) {
    try {
      const product = await this.productsService.updateProduct(
        id,
        updateProductDto,
        currentUser,
      );

      return res
        .status(HttpStatus.OK)
        .json(createSuccessResponse('Product updated successfully', product));
    } catch (err) {
      console.error('Failed update product', err);
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(createErrorResponse('Failed to update product', err.message));
    }
  }

  @Permissions('product:delete')
  @Delete(':id')
  async deleteProduct(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res() res: Response,
  ) {
    try {
      const result = await this.productsService.deleteProduct(id, currentUser);

      return res
        .status(HttpStatus.OK)
        .json(createSuccessResponse('Product deleted successfully', result));
    } catch (err) {
      console.error('Failed delete product', err);
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(createErrorResponse('Failed to delete product', err.message));
    }
  }
}
