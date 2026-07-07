import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { shopMembers } from '../db/schema';
import { and, eq } from 'drizzle-orm';

export const ShopRoles = (...roles: string[]) => SetMetadata('shopRoles', roles);

@Injectable()
export class ShopRolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private dbService: DbService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>('shopRoles', context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const shopId = request.params.shopId || request.params.id;
    
    if (!user || !shopId) {
      return false;
    }
    
    if (user.role === 'app_admin' && requiredRoles.includes('app_admin')) {
      return true;
    }
    
    const [member] = await this.dbService.db
      .select()
      .from(shopMembers)
      .where(
        and(
          eq(shopMembers.shopId, parseInt(shopId, 10)),
          eq(shopMembers.userId, user.id)
        )
      )
      .limit(1);
      
    if (!member) {
      return false;
    }
    
    request.shopMember = member;

    return requiredRoles.includes(member.role);
  }
}
