import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '../auth/auth.guard';
import { ShopRolesGuard, ShopRoles } from '../auth/shop-roles.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateShopProductSchema,
  UpdateShopProductSchema,
  IdParamSchema,
  BarcodeSchema,
  CreateCustomProductSchema,
} from '../common/validation/schemas';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/shops/:shopId/products')
@UseGuards(AuthGuard, ShopRolesGuard)
export class ShopProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ShopRoles('owner', 'shop_worker')
  listShopProducts(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: string,
  ) {
    return this.productsService.listShopProducts(shopId);
  }

  @Post()
  @ShopRoles('owner', 'shop_worker')
  addShopProduct(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: string,
    @Body(new ZodValidationPipe(CreateShopProductSchema)) body: any,
  ) {
    return this.productsService.addShopProduct(shopId, body);
  }

  @Post('custom')
  @ShopRoles('owner', 'shop_worker')
  addCustomProduct(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: string,
    @Body(new ZodValidationPipe(CreateCustomProductSchema)) body: any,
    @CurrentUser() user: any,
  ) {
    return this.productsService.addCustomProduct(shopId, body, user);
  }


  @Put(':id')
  @ShopRoles('owner', 'shop_worker')
  updateShopProduct(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: string,
    @Param('id', new ZodValidationPipe(IdParamSchema)) id: string,
    @Body(new ZodValidationPipe(UpdateShopProductSchema)) body: any,
  ) {
    return this.productsService.updateShopProduct(shopId, id, body);
  }

  @Delete(':id')
  @ShopRoles('owner')
  deleteShopProduct(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: string,
    @Param('id', new ZodValidationPipe(IdParamSchema)) id: string,
  ) {
    return this.productsService.deleteShopProduct(shopId, id);
  }

  @Get('barcode/:code')
  @ShopRoles('owner', 'shop_worker')
  lookupShopProductByBarcode(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: string,
    @Param('code', new ZodValidationPipe(BarcodeSchema)) code: string,
  ) {
    return this.productsService.lookupShopProductByBarcode(shopId, code);
  }
}
