import { BaseEntity } from '@app/common/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('email_verifications')
export class EmailVerification extends BaseEntity {
  @Column()
  email: string;

  @Column()
  code: string;

  @Column()
  expires_at: Date;

  @Column({ default: false })
  is_verified: boolean;
}
