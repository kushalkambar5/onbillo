import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(private dbService: DbService) {}

  async updatePhone(userId: string, phone: string) {
    const [user] = await this.dbService.db
      .update(users)
      .set({
        phone,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
