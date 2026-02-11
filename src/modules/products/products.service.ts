import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BaseProductDto } from './dto/base-product.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ILike, Repository } from 'typeorm';
import { ProductEntity } from './entities/product.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ResponseMeta } from '../../common/type/response';
import { CurrentUserType } from '../../security/user.decorator';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
  ) {}
  async createProduct(
    createProductDto: BaseProductDto,
    currentUser: CurrentUserType,
  ) {
    // Check if product with same SKU already exists
    if (createProductDto.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: createProductDto.sku },
      });
      if (existingProduct) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    // Extract category_id from DTO
    const { category_id, ...productData } = createProductDto;

    // Create new product
    const newProduct = this.productRepository.create({
      ...productData,
      outlet: { id: currentUser.outlet.id },
      category: category_id ? ({ id: category_id } as any) : null,
      isActive:
        createProductDto.isActive !== undefined
          ? createProductDto.isActive
          : true,
    });

    const savedProduct = await this.productRepository.save(newProduct);
    const instance = plainToInstance(ProductEntity, savedProduct);
    return instanceToPlain(instance) as Record<string, unknown>;
  }

  async getAllProducts(
    paginationDto: PaginationDto,
    currentUser: CurrentUserType,
  ) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Jika user bukan admin, filter berdasarkan outlet

    const [products, total] = await this.productRepository.findAndCount({
      skip,
      take: limit,
      where: {
        name: ILike(`%${paginationDto.keyword}%`),
        outlet: { id: currentUser.outlet.id },
      },
      relations: ['outlet', 'category'],
    });

    const productsSerialized = plainToInstance(ProductEntity, products, {
      excludeExtraneousValues: true,
    });
    const data = (
      Array.isArray(productsSerialized)
        ? productsSerialized
        : [productsSerialized]
    ).map((p) => instanceToPlain(p) as Record<string, unknown>);

    const totalPage = Math.ceil(total / limit);

    const meta: ResponseMeta = {
      page: Number(page),
      limit: Number(limit),
      total,
      total_page: totalPage,
    };

    return {
      data,
      meta,
    };
  }

  async getProductById(id: string, currentUser: CurrentUserType) {
    const product = await this.productRepository.findOne({
      where: { id, outlet: { id: currentUser.outlet.id } },
      relations: ['outlet', 'category'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const instance = plainToInstance(ProductEntity, product);
    return instanceToPlain(instance) as Record<string, unknown>;
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    currentUser: CurrentUserType,
  ) {
    const product = await this.productRepository.findOne({
      where: {
        id,
        outlet: { id: currentUser.outlet.id },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Extract category_id from DTO
    const { category_id, ...productData } = updateProductDto;

    // Update product fields
    Object.assign(product, productData);

    // Handle category relationship update
    if (category_id !== undefined) {
      product.category = category_id ? ({ id: category_id } as any) : null;
    }

    const updatedProduct = await this.productRepository.save(product);
    const instance = plainToInstance(ProductEntity, updatedProduct);
    return instanceToPlain(instance) as Record<string, unknown>;
  }

  async deleteProduct(id: string, currentUser: CurrentUserType) {
    const product = await this.productRepository.findOne({
      where: {
        outlet: { id: currentUser.outlet.id },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.productRepository.remove(product);
    return { message: 'Product deleted successfully' };
  }

  // Legacy methods for backward compatibility
  create(id: string, createProductDto: CreateProductDto) {
    const newProduct = this.productRepository.create({
      ...createProductDto,
      outlet: { id: id },
    });
    return this.productRepository.save(newProduct);
  }

  async findAll(outletId: string) {
    const products = await this.productRepository.find({
      where: { outlet: { id: outletId } },
    });
    return products;
  }

  async findOne(id: string, outletId: string) {
    const product = await this.productRepository.findOne({
      where: { id: id, outlet: { id: outletId } },
    });

    if (!product) {
      throw new NotFoundException(
        'Product not found or you do not have access to this product.',
      );
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string) {
    return this.productRepository.delete(id);
  }
}
