import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CategoryEntity } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUserType } from '../../security/user.decorator';
import { plainToInstance } from 'class-transformer';
import { ResponseMeta } from '../../common/type/response';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    currentUser: CurrentUserType,
  ): Promise<CategoryEntity> {
    // Check if category with same name already exists in outlet
    const existingCategory = await this.categoryRepository.findOne({
      where: {
        name: createCategoryDto.name,
        outlet: { id: currentUser.outlet.id },
      },
    });
    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = this.categoryRepository.create({
      name: createCategoryDto.name,
      outlet: { id: currentUser.outlet.id },
    });

    const savedCategory = await this.categoryRepository.save(category);
    return plainToInstance(CategoryEntity, savedCategory);
  }

  async findAll(paginationDto: PaginationDto, currentUser: CurrentUserType) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [categories, total] = await this.categoryRepository.findAndCount({
      skip,
      take: limit,
      where: {
        name: ILike(`%${paginationDto.keyword}%`),
        outlet: { id: currentUser.outlet.id },
      },
      relations: ['products'],
    });

    const categoriesSerialized = plainToInstance(CategoryEntity, categories);
    const totalPage = Math.ceil(total / limit);

    const meta: ResponseMeta = {
      page,
      limit,
      total,
      total_page: totalPage,
    };

    return {
      data: categoriesSerialized,
      meta,
    };
  }

  async findOne(
    id: string,
    currentUser: CurrentUserType,
  ): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne({
      where: {
        id,
        outlet: { id: currentUser.outlet.id },
      },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return plainToInstance(CategoryEntity, category);
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    currentUser: CurrentUserType,
  ): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne({
      where: {
        id,
        outlet: { id: currentUser.outlet.id },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if new name conflicts with existing category
    if (updateCategoryDto.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: {
          name: updateCategoryDto.name,
          outlet: { id: currentUser.outlet.id },
        },
      });
      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    Object.assign(category, updateCategoryDto);
    const updatedCategory = await this.categoryRepository.save(category);
    return plainToInstance(CategoryEntity, updatedCategory);
  }

  async remove(id: string, currentUser: CurrentUserType) {
    const category = await this.categoryRepository.findOne({
      where: {
        id,
        outlet: { id: currentUser.outlet.id },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryRepository.remove(category);
    return { message: 'Category deleted successfully' };
  }
}
