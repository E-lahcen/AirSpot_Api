import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@app/common/entities/base.entity';
import { Tenant } from '@app/modules/tenant/entities/tenant.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'brands', schema: 'public' })
export class Brand extends BaseEntity {
  @ApiProperty({
    description: 'Organization (tenant) ID that owns this brand',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid' })
  tenant_id: string;

  @ApiProperty({
    description: 'Brand name',
    example: 'Nike',
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    description: 'Brand description',
    example: 'A leading sportswear brand',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({
    description: 'Brand logo URL (image file)',
    example: 'https://example.com/logo.png',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string | null;

  @ApiProperty({
    description: 'Brand emoji (alternative to logo)',
    example: '🏢',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 10, nullable: true })
  emoji: string | null;

  @ApiProperty({
    description: 'Primary contact person name',
    example: 'John Doe',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_name: string | null;

  @ApiProperty({
    description: 'Primary contact email',
    example: 'contact@brand.com',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_email: string | null;

  @ManyToOne(() => Tenant, (tenant) => tenant.brands, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
