import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import { shopMembers, staffRequests, users, shops } from '../db/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class StaffService {
  constructor(private dbService: DbService) {}

  async listStaff(shopId: number) {
    const results = await this.dbService.db
      .select({
        member: shopMembers,
        user: users,
      })
      .from(shopMembers)
      .innerJoin(users, eq(shopMembers.userId, users.id))
      .where(eq(shopMembers.shopId, shopId));

    return results.map((row) => ({
      ...row.member,
      user: row.user,
    }));
  }

  async inviteStaff(
    shopId: number,
    requestedTo: number,
    requestedBy: number,
    role: 'shop_worker' | 'owner',
  ) {
    const [request] = await this.dbService.db
      .insert(staffRequests)
      .values({
        shopId,
        requestedBy,
        requestedTo,
        role: role || 'shop_worker',
        status: 'pending',
      })
      .returning();
    return request;
  }

  async inviteStaffByEmail(
    shopId: number,
    email: string,
    requestedBy: number,
    role: 'shop_worker' | 'owner',
  ) {
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!user) {
      throw new NotFoundException(
        'User with this email not found in Onbillo database.',
      );
    }

    const [existingMember] = await this.dbService.db
      .select()
      .from(shopMembers)
      .where(
        and(eq(shopMembers.shopId, shopId), eq(shopMembers.userId, user.id)),
      )
      .limit(1);
    if (existingMember) {
      throw new BadRequestException('User is already a member of this shop.');
    }

    const [existingRequest] = await this.dbService.db
      .select()
      .from(staffRequests)
      .where(
        and(
          eq(staffRequests.shopId, shopId),
          eq(staffRequests.requestedTo, user.id),
          eq(staffRequests.status, 'pending'),
        ),
      )
      .limit(1);
    if (existingRequest) {
      throw new BadRequestException(
        'An invitation is already pending for this user.',
      );
    }

    const [request] = await this.dbService.db
      .insert(staffRequests)
      .values({
        shopId,
        requestedBy,
        requestedTo: user.id,
        role: role || 'shop_worker',
        status: 'pending',
      })
      .returning();

    return {
      ...request,
      receiverEmail: user.email,
      receiverName: user.name,
    };
  }

  async updateStaffRole(
    shopId: number,
    id: number,
    role: 'owner' | 'shop_worker',
  ) {
    const [member] = await this.dbService.db
      .update(shopMembers)
      .set({
        role,
      })
      .where(and(eq(shopMembers.id, id), eq(shopMembers.shopId, shopId)))
      .returning();
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  async removeStaff(shopId: number, id: number) {
    await this.dbService.db
      .delete(shopMembers)
      .where(and(eq(shopMembers.id, id), eq(shopMembers.shopId, shopId)));
    return { success: true };
  }

  async acceptInvite(shopId: number, userId: number) {
    return await this.dbService.db.transaction(async (tx) => {
      const [request] = await tx
        .select()
        .from(staffRequests)
        .where(
          and(
            eq(staffRequests.shopId, shopId),
            eq(staffRequests.requestedTo, userId),
            eq(staffRequests.status, 'pending'),
          ),
        )
        .limit(1);

      if (!request) {
        throw new NotFoundException('Pending invite not found');
      }

      await tx
        .update(staffRequests)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(staffRequests.id, request.id));

      const [newMember] = await tx
        .insert(shopMembers)
        .values({
          shopId,
          userId,
          role: request.role,
        })
        .returning();

      return newMember;
    });
  }

  async listPendingInvites(userId: number) {
    const result = await this.dbService.db
      .select({
        id: staffRequests.id,
        shopId: staffRequests.shopId,
        requestedBy: staffRequests.requestedBy,
        requestedTo: staffRequests.requestedTo,
        role: staffRequests.role,
        status: staffRequests.status,
        createdAt: staffRequests.createdAt,
        shopName: shops.name,
        requesterName: users.name,
      })
      .from(staffRequests)
      .innerJoin(shops, eq(staffRequests.shopId, shops.id))
      .innerJoin(users, eq(staffRequests.requestedBy, users.id))
      .where(
        and(
          eq(staffRequests.requestedTo, userId),
          eq(staffRequests.status, 'pending'),
        ),
      );
    return result;
  }

  async respondToInvite(
    requestId: number,
    userId: number,
    status: 'accepted' | 'rejected',
  ) {
    return await this.dbService.db.transaction(async (tx) => {
      const [request] = await tx
        .select()
        .from(staffRequests)
        .where(
          and(
            eq(staffRequests.id, requestId),
            eq(staffRequests.requestedTo, userId),
            eq(staffRequests.status, 'pending'),
          ),
        )
        .limit(1);

      if (!request) {
        throw new NotFoundException('Pending invite not found');
      }

      const [updatedRequest] = await tx
        .update(staffRequests)
        .set({ status, updatedAt: new Date() })
        .where(eq(staffRequests.id, requestId))
        .returning();

      if (status === 'accepted') {
        await tx.insert(shopMembers).values({
          shopId: request.shopId,
          userId,
          role: request.role,
        });
      }

      return updatedRequest;
    });
  }
}
