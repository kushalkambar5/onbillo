import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  TogglePremiumSchema,
  ToggleBanSchema,
  RejectProductSchema,
  IdParamSchema,
} from '../common/validation/schemas';

@Controller('api/admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('app_admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Put('users/:id/premium')
  togglePremium(
    @Param('id', new ZodValidationPipe(IdParamSchema)) id: string,
    @Body(new ZodValidationPipe(TogglePremiumSchema)) body: any,
  ) {
    return this.adminService.togglePremium(id, body.isPremium);
  }

  @Put('users/:id/ban')
  toggleBan(
    @Param('id', new ZodValidationPipe(IdParamSchema)) id: string,
    @Body(new ZodValidationPipe(ToggleBanSchema)) body: any,
  ) {
    return this.adminService.toggleBan(id, body.isBanned);
  }

  @Get('shops')
  listShops() {
    return this.adminService.listShops();
  }

  @Get('products/pending')
  listPendingProducts() {
    return this.adminService.listPendingProducts();
  }

  @Put('products/:id/approve')
  approveProduct(
    @Param('id', new ZodValidationPipe(IdParamSchema)) id: string,
  ) {
    return this.adminService.approveProduct(id);
  }

  @Put('products/:id/reject')
  rejectProduct(
    @Param('id', new ZodValidationPipe(IdParamSchema)) id: string,
    @Body(new ZodValidationPipe(RejectProductSchema)) body: any,
  ) {
    return this.adminService.rejectProduct(id, body.reason);
  }
}
