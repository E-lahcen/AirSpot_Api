import { BaseEntity } from '@app/common/entities/base.entity';
import { Tenant } from '@app/modules/tenant/entities/tenant.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

@Entity({ name: 'user_tenant', schema: 'public' })
@Unique(['user_id', 'tenant_id'])
export class UserTenant extends BaseEntity {
  @Column()
  email: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
