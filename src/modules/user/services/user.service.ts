import { Injectable } from '@nestjs/common';
import { TenantConnectionService } from '@app/modules/tenant/services/tenant-connection.service';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  async createUser(data: Partial<User>): Promise<User> {
    const userRepo = await this.tenantConnection.getRepository(User);

    const user = userRepo.create(data);

    return userRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const userRepo = await this.tenantConnection.getRepository(User);
    return userRepo.findOne({ where: { email }, relations: ['roles'] });
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const userRepo = await this.tenantConnection.getRepository(User);
    return userRepo.findOne({
      where: { firebase_uid: firebaseUid },
      relations: ['roles'],
    });
  }
  async findById(id: string): Promise<User | null> {
    const userRepo = await this.tenantConnection.getRepository(User);
    return userRepo.findOne({ where: { id }, relations: ['roles'] });
  }
}
