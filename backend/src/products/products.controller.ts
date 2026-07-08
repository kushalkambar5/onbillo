import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/products')
@UseGuards(AuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  searchGlobalProducts(@Query('q') query?: string) {
    return this.productsService.searchGlobalProducts(query);
  }

  @Get('barcode/:code')
  lookupGlobalProductByBarcode(@Param('code') code: string) {
    return this.productsService.lookupGlobalProductByBarcode(code);
  }

  @Post()
  addGlobalProduct(@Body() body: any, @CurrentUser() user: any) {
    return this.productsService.addGlobalProduct(body, user);
  }

  @Put(':id')
  updateGlobalProduct(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.productsService.updateGlobalProduct(parseInt(id, 10), body, user);
  }

  @Put('verify/:id')
  @UseGuards(RolesGuard)
  @Roles('app_admin')
  verifyProduct(@Param('id') id: string) {
    return this.productsService.verifyProduct(parseInt(id, 10));
  }

  @Delete(':id')
  deleteGlobalProduct(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.deleteGlobalProduct(parseInt(id, 10), user);
  }
}
