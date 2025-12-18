import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BrandService } from '../services/brand.service';
import { CreateBrandDto, UpdateBrandDto, FilterBrandDto } from '../dto';
import { Brand } from '../entities/brand.entity';
import { AuthGuard } from '@app/modules/auth/guards/auth.guard';
import { Roles } from '@app/modules/auth/decorators/roles.decorator';

@ApiTags('Brands')
@ApiBearerAuth()
@Controller('brands')
@UseGuards(AuthGuard)
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiResponse({
    status: 201,
    description: 'Brand created successfully',
    type: Brand,
  })
  @ApiResponse({
    status: 409,
    description: 'Brand with this name already exists for this organization',
  })
  @Roles('owner', 'admin', 'super_admin')
  async create(@Body() createBrandDto: CreateBrandDto): Promise<Brand> {
    return await this.brandService.create(createBrandDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all brands with optional filtering' })
  @ApiResponse({
    status: 200,
    description: 'List of brands retrieved successfully',
  })
  async findAll(@Query() filterDto: FilterBrandDto) {
    return await this.brandService.findAll(filterDto);
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get all brands for a specific organization' })
  @ApiResponse({
    status: 200,
    description: 'List of brands for the organization retrieved successfully',
    type: [Brand],
  })
  async findByTenant(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
  ): Promise<Brand[]> {
    return await this.brandService.findByTenant(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a brand by ID' })
  @ApiResponse({
    status: 200,
    description: 'Brand retrieved successfully',
    type: Brand,
  })
  @ApiResponse({
    status: 404,
    description: 'Brand not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Brand> {
    return await this.brandService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a brand' })
  @ApiResponse({
    status: 200,
    description: 'Brand updated successfully',
    type: Brand,
  })
  @ApiResponse({
    status: 404,
    description: 'Brand not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Brand with this name already exists for this organization',
  })
  @Roles('owner', 'admin', 'super_admin')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBrandDto: UpdateBrandDto,
  ): Promise<Brand> {
    return await this.brandService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a brand (soft delete)' })
  @ApiResponse({
    status: 204,
    description: 'Brand deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Brand not found',
  })
  @Roles('owner', 'admin', 'super_admin')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.brandService.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted brand' })
  @ApiResponse({
    status: 200,
    description: 'Brand restored successfully',
    type: Brand,
  })
  @ApiResponse({
    status: 404,
    description: 'Brand not found',
  })
  @Roles('owner', 'admin', 'super_admin')
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<Brand> {
    return await this.brandService.restore(id);
  }
}
