import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { shopMembers, staffRequests, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class StaffService {
  constructor(private dbService: DbService) {}

  async listStaff(shopId: number) {
    return await this.dbService.db.select({
      member: shopMembers,
      user: users
    })
    .from(shopMembers)
    .innerJoin(users, eq(shopMembers.userId, users.id))
    .where(eq(shopMembers.shopId, shopId));
  }

  async inviteStaff(shopId: number, requestedTo: number, requestedBy: number, role: 'shop_worker' | 'owner') {
    const [request] = await this.dbService.db.insert(staffRequests).values({
      shopId,
      requestedBy,
      requestedTo,
      role: role || 'shop_worker',
      status: 'pending',
    }).returning();
    return request;
  }

  async updateStaffRole(shopId: number, id: number, role: 'owner' | 'shop_worker') {
    const [member] = await this.dbService.db.update(shopMembers).set({
      role,
    }).where(and(eq(shopMembers.id, id), eq(shopMembers.shopId, shopId))).returning();
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  async removeStaff(shopId: number, id: number) {
    await this.dbService.db.delete(shopMembers).where(and(eq(shopMembers.id, id), eq(shopMembers.shopId, shopId)));
    return { success: true };
  }

  async acceptInvite(shopId: number, userId: number) {
    return await this.dbService.db.transaction(async (tx) => {
      const [request] = await tx.select().from(staffRequests)
        .where(and(
          eq(staffRequests.shopId, shopId), 
          eq(staffRequests.requestedTo, userId), 
          eq(staffRequests.status, 'pending')
        )).limit(1);
      
      if (!request) {
        throw new NotFoundException('Pending invite not found');
      }

      await tx.update(staffRequests).set({ status: 'accepted', updatedAt: new Date() }).where(eq(staffRequests.id, request.id));

      const [newMember] = await tx.insert(shopMembers).values({
        shopId,
        userId,
        role: request.role,
      }).returning();

      return newMember;
    });
  }
}
