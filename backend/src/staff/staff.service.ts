import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import { staffRequests, users, shops } from '../db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

@Injectable()
export class StaffService {
  constructor(private dbService: DbService) {}

  async listStaff(shopId: string) {
    const results = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.shopId, shopId));

    return results.map((user) => ({
      id: user.id,
      shopId: user.shopId,
      userId: user.id,
      role: user.role === 'shop_owner' ? 'owner' : 'shop_worker',
      isActive: !user.isBanned,
      joinedAt: user.createdAt,
      user: user,
    }));
  }

  async inviteStaff(
    shopId: string,
    requestedTo: string,
    requestedBy: string,
    role: 'shop_worker' | 'owner',
  ) {
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, requestedTo))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.shopId) {
      if (user.shopId === shopId) {
        throw new BadRequestException('User is already a member of this shop.');
      } else {
        throw new BadRequestException('User is already associated with another shop.');
      }
    }

    const [existingRequest] = await this.dbService.db
      .select()
      .from(staffRequests)
      .where(
        and(
          eq(staffRequests.shopId, shopId),
          eq(staffRequests.requestedTo, requestedTo),
        ),
      )
      .limit(1);

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        throw new BadRequestException(
          'An invitation is already pending for this user.',
        );
      }
      await this.dbService.db
        .delete(staffRequests)
        .where(eq(staffRequests.id, existingRequest.id));
    }

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
    shopId: string,
    email: string,
    requestedBy: string,
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

    if (user.shopId) {
      if (user.shopId === shopId) {
        throw new BadRequestException('User is already a member of this shop.');
      } else {
        throw new BadRequestException('User is already associated with another shop.');
      }
    }

    const [existingRequest] = await this.dbService.db
      .select()
      .from(staffRequests)
      .where(
        and(
          eq(staffRequests.shopId, shopId),
          eq(staffRequests.requestedTo, user.id),
        ),
      )
      .limit(1);

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        throw new BadRequestException(
          'An invitation is already pending for this user.',
        );
      }
      // Delete old accepted/rejected request to avoid unique constraint issue
      await this.dbService.db
        .delete(staffRequests)
        .where(eq(staffRequests.id, existingRequest.id));
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
    shopId: string,
    id: string,
    role: 'owner' | 'shop_worker',
  ) {
    const mappedRole = role === 'owner' ? 'shop_owner' : 'shop_worker';
    const [user] = await this.dbService.db
      .update(users)
      .set({
        role: mappedRole,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, id), eq(users.shopId, shopId)))
      .returning();
    if (!user) throw new NotFoundException('Member not found');
    
    return {
      id: user.id,
      shopId: user.shopId,
      userId: user.id,
      role: role,
    };
  }

  async removeStaff(shopId: string, id: string) {
    await this.dbService.db
      .update(users)
      .set({
        shopId: null,
        role: null,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, id), eq(users.shopId, shopId)));
    return { success: true };
  }

  async acceptInvite(shopId: string, userId: string) {
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

      // Check if user is already associated with a shop
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (user && user.shopId) {
        throw new BadRequestException('You are already associated with a shop.');
      }

      await tx
        .update(staffRequests)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(staffRequests.id, request.id));

      const mappedRole = request.role === 'owner' ? 'shop_owner' : 'shop_worker';
      const [updatedUser] = await tx
        .update(users)
        .set({
          shopId,
          role: mappedRole,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      return {
        id: updatedUser.id,
        shopId: updatedUser.shopId,
        userId: updatedUser.id,
        role: request.role,
      };
    });
  }

  async listPendingInvites(userId: string) {
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
        eq(staffRequests.requestedTo, userId),
      )
      .orderBy(desc(staffRequests.createdAt));
    return result;
  }

  async listShopInvites(shopId: string) {
    const result = await this.dbService.db
      .select({
        id: staffRequests.id,
        shopId: staffRequests.shopId,
        requestedBy: staffRequests.requestedBy,
        requestedTo: staffRequests.requestedTo,
        role: staffRequests.role,
        status: staffRequests.status,
        createdAt: staffRequests.createdAt,
        receiverEmail: users.email,
        receiverName: users.name,
      })
      .from(staffRequests)
      .innerJoin(users, eq(staffRequests.requestedTo, users.id))
      .where(eq(staffRequests.shopId, shopId));
    return result;
  }

  async respondToInvite(
    requestId: string,
    userId: string,
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

      if (status === 'accepted') {
        // Check if user is already associated with a shop
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        if (user && user.shopId) {
          throw new BadRequestException('You are already associated with a shop.');
        }
      }

      const [updatedRequest] = await tx
        .update(staffRequests)
        .set({ status, updatedAt: new Date() })
        .where(eq(staffRequests.id, requestId))
        .returning();

      if (status === 'accepted') {
        const mappedRole = request.role === 'owner' ? 'shop_owner' : 'shop_worker';
        await tx
          .update(users)
          .set({
            shopId: request.shopId,
            role: mappedRole,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }

      return updatedRequest;
    });
  }
}
