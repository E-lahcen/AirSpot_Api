import { ApiProperty } from '@nestjs/swagger';
import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @ApiProperty({
    description: 'Unique identifier for the entity',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Entity creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time',
  })
  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ApiProperty({
    description: 'Soft deletion timestamp',
    example: null,
    format: 'date-time',
    nullable: true,
  })
  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;
}
