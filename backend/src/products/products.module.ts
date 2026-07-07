import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ShopProductsController } from './shop-products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController, ShopProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
