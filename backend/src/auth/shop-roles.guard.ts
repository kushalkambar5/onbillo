import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { DbService } from '../db/db.service';

export const ShopRoles = (...roles: string[]) =>
  SetMetadata('shopRoles', roles);

@Injectable()
export class ShopRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dbService: DbService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(
      'shopRoles',
      context.getHandler(),
    );
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

    if (!user.shopId || user.shopId !== shopId) {
      return false;
    }

    const currentRole = user.role === 'shop_owner' ? 'owner' : user.role;

    request.shopMember = {
      id: user.id,
      shopId: user.shopId,
      userId: user.id,
      role: currentRole,
    };

    return requiredRoles.includes(currentRole);
  }
}
