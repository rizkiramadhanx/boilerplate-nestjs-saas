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
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../../common/type/response';
import { CurrentUser, CurrentUserType } from '../../../security/user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BaseProductDto } from './dto/base-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { LogsService } from '../logs/logs.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('product')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly logsService: LogsService,
  ) {}

  @Permissions('product:read')
  @Get()
  async getAllProducts(
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.productsService.getAllProducts(
        paginationDto,
        currentUser,
      );
      await this.logsService.createLog({
        action: 'product:read',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse(
        'Get all products success',
        result.data,
        result.meta,
      );
    } catch (err) {
      console.error('Failed get all products', err);
      await this.logsService.createLog({
        action: 'product:read',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return createErrorResponse(
        'Failed to get products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Permissions('product:read')
  @Get(':id')
  async getProductById(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const product = await this.productsService.getProductById(
        id,
        currentUser,
      );
      await this.logsService.createLog({
        action: 'product:read',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse('Get product success', product);
    } catch (err) {
      console.error('Failed get product by id', err);
      await this.logsService.createLog({
        action: 'product:read',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.NOT_FOUND,
      });
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse('Product not found', HttpStatus.NOT_FOUND);
    }
  }

  @Permissions('product:create')
  @Post()
  async createProduct(
    @Body() createProductDto: BaseProductDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const product = await this.productsService.createProduct(
        createProductDto,
        currentUser,
      );
      await this.logsService.createLog({
        action: 'product:create',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.CREATED,
      });
      res.status(HttpStatus.CREATED);
      return createSuccessResponse('Product created successfully', product);
    } catch (err) {
      console.error('Failed create product', err);
      await this.logsService.createLog({
        action: 'product:create',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.CONFLICT,
      });
      res.status(HttpStatus.CONFLICT);
      return createErrorResponse(
        'Failed to create product',
        HttpStatus.CONFLICT,
      );
    }
  }

  @Permissions('product:update')
  @Patch(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const product = await this.productsService.updateProduct(
        id,
        updateProductDto,
        currentUser,
      );
      await this.logsService.createLog({
        action: 'product:update',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse('Product updated successfully', product);
    } catch (err) {
      console.error('Failed update product', err);
      await this.logsService.createLog({
        action: 'product:update',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.NOT_FOUND,
      });
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(
        'Failed to update product',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Permissions('product:delete')
  @Delete(':id')
  async deleteProduct(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.productsService.deleteProduct(id, currentUser);
      await this.logsService.createLog({
        action: 'product:delete',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'SUCCESS',
        statusCode: HttpStatus.OK,
      });
      res.status(HttpStatus.OK);
      return createSuccessResponse('Product deleted successfully', result);
    } catch (err) {
      console.error('Failed delete product', err);
      await this.logsService.createLog({
        action: 'product:delete',
        outletId: currentUser.outlet?.id,
        userId: currentUser.id,
        status: 'ERROR',
        statusCode: HttpStatus.NOT_FOUND,
      });
      res.status(HttpStatus.NOT_FOUND);
      return createErrorResponse(
        'Failed to delete product',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
