import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

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
  togglePremium(@Param('id') id: string, @Body() body: any) {
    return this.adminService.togglePremium(parseInt(id, 10), body.isPremium);
  }

  @Put('users/:id/ban')
  toggleBan(@Param('id') id: string, @Body() body: any) {
    return this.adminService.toggleBan(parseInt(id, 10), body.isBanned);
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
  approveProduct(@Param('id') id: string) {
    return this.adminService.approveProduct(parseInt(id, 10));
  }

  @Put('products/:id/reject')
  rejectProduct(@Param('id') id: string, @Body() body: any) {
    return this.adminService.rejectProduct(parseInt(id, 10), body.reason);
  }
}
