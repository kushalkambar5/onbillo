import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { AuthGuard } from '../auth/auth.guard';
import { ShopRolesGuard, ShopRoles } from '../auth/shop-roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/shops/:shopId/staff')
@UseGuards(AuthGuard)
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner', 'app_admin')
  listStaff(@Param('shopId') shopId: string) {
    return this.staffService.listStaff(parseInt(shopId, 10));
  }

  @Post(':user_id')
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner')
  inviteStaff(@Param('shopId') shopId: string, @Param('user_id') userId: string, @Body() body: any, @CurrentUser() user: any) {
    return this.staffService.inviteStaff(parseInt(shopId, 10), parseInt(userId, 10), user.id, body.role);
  }

  @Post('invite')
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner')
  inviteStaffByEmail(@Param('shopId') shopId: string, @Body() body: any, @CurrentUser() user: any) {
    return this.staffService.inviteStaffByEmail(parseInt(shopId, 10), body.email, user.id, body.role);
  }

  @Put('accept')
  acceptInvite(@Param('shopId') shopId: string, @CurrentUser() user: any) {
    return this.staffService.acceptInvite(parseInt(shopId, 10), user.id);
  }

  @Put(':id')
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner')
  updateStaffRole(@Param('shopId') shopId: string, @Param('id') id: string, @Body() body: any) {
    return this.staffService.updateStaffRole(parseInt(shopId, 10), parseInt(id, 10), body.role);
  }

  @Delete(':id')
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner')
  removeStaff(@Param('shopId') shopId: string, @Param('id') id: string) {
    return this.staffService.removeStaff(parseInt(shopId, 10), parseInt(id, 10));
  }
}
