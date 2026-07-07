import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { AuthGuard } from '../auth/auth.guard';
import { ShopRolesGuard, ShopRoles } from '../auth/shop-roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/shops')
@UseGuards(AuthGuard)
export class ShopsController {
  constructor(private shopsService: ShopsService) {}

  @Post()
  createShop(@Body() body: any, @CurrentUser() user: any) {
    return this.shopsService.createShop(body, user.id);
  }

  @Get()
  getUserShops(@CurrentUser() user: any) {
    return this.shopsService.getUserShops(user.id);
  }

  @Get(':id')
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner', 'shop_worker')
  getShop(@Param('id') id: string) {
    return this.shopsService.getShop(parseInt(id, 10));
  }

  @Put(':id')
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner')
  updateShop(@Param('id') id: string, @Body() body: any) {
    return this.shopsService.updateShop(parseInt(id, 10), body);
  }

  @Delete(':id')
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner')
  deleteShop(@Param('id') id: string) {
    return this.shopsService.deleteShop(parseInt(id, 10));
  }
}
