import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { BillsService } from './bills.service';
import { AuthGuard } from '../auth/auth.guard';
import { ShopRolesGuard, ShopRoles } from '../auth/shop-roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/shops/:shopId/bills')
@UseGuards(AuthGuard, ShopRolesGuard)
export class BillsController {
  constructor(private billsService: BillsService) {}

  @Post()
  @ShopRoles('owner', 'shop_worker')
  createBill(@Param('shopId') shopId: string, @Body() body: any, @CurrentUser() user: any) {
    return this.billsService.createBill(parseInt(shopId, 10), body, user.id);
  }

  @Get()
  @ShopRoles('owner', 'shop_worker', 'app_admin')
  listBills(@Param('shopId') shopId: string) {
    return this.billsService.listBills(parseInt(shopId, 10));
  }

  @Get(':id')
  @ShopRoles('owner', 'shop_worker', 'app_admin')
  getBillDetail(@Param('shopId') shopId: string, @Param('id') id: string) {
    return this.billsService.getBillDetail(parseInt(shopId, 10), parseInt(id, 10));
  }

  @Put(':id/cancel')
  @ShopRoles('owner', 'shop_worker')
  cancelBill(@Param('shopId') shopId: string, @Param('id') id: string) {
    return this.billsService.cancelBill(parseInt(shopId, 10), parseInt(id, 10));
  }
}
