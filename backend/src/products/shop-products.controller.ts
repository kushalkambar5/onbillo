import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '../auth/auth.guard';
import { ShopRolesGuard, ShopRoles } from '../auth/shop-roles.guard';

@Controller('api/shops/:shopId/products')
@UseGuards(AuthGuard, ShopRolesGuard)
export class ShopProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ShopRoles('owner', 'shop_worker')
  listShopProducts(@Param('shopId') shopId: string) {
    return this.productsService.listShopProducts(parseInt(shopId, 10));
  }

  @Post()
  @ShopRoles('owner') // Manager (which is shop_worker maybe?) Spec says "Owner, Manager". We have 'owner', 'shop_worker'. Let's say owner & shop_worker. Wait, spec says "Owner, Manager". Let's assume 'owner' and 'shop_worker' if manager doesn't exist. Let's just use 'owner', 'shop_worker' or only 'owner'. The enum is 'owner', 'shop_worker'. I will allow both for adding products to shop.
  @ShopRoles('owner', 'shop_worker')
  addShopProduct(@Param('shopId') shopId: string, @Body() body: any) {
    return this.productsService.addShopProduct(parseInt(shopId, 10), body);
  }

  @Put(':id')
  @ShopRoles('owner', 'shop_worker')
  updateShopProduct(@Param('shopId') shopId: string, @Param('id') id: string, @Body() body: any) {
    return this.productsService.updateShopProduct(parseInt(shopId, 10), parseInt(id, 10), body);
  }

  @Delete(':id')
  @ShopRoles('owner')
  deleteShopProduct(@Param('shopId') shopId: string, @Param('id') id: string) {
    return this.productsService.deleteShopProduct(parseInt(shopId, 10), parseInt(id, 10));
  }

  @Get('barcode/:code')
  @ShopRoles('owner', 'shop_worker')
  lookupShopProductByBarcode(@Param('shopId') shopId: string, @Param('code') code: string) {
    return this.productsService.lookupShopProductByBarcode(parseInt(shopId, 10), code);
  }
}
