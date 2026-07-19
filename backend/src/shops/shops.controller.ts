import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ShopsService } from './shops.service';
import { AuthGuard } from '../auth/auth.guard';
import { ShopRolesGuard, ShopRoles } from '../auth/shop-roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateShopSchema,
  UpdateShopSchema,
  IdParamSchema,
} from '../common/validation/schemas';

@Controller('api/shops')
@UseGuards(AuthGuard)
export class ShopsController {
  constructor(private shopsService: ShopsService) {}

  @Post()
  createShop(
    @Body(new ZodValidationPipe(CreateShopSchema)) body: any,
    @CurrentUser() user: any,
  ) {
    return this.shopsService.createShop(body, user.id);
  }

  @Get()
  getUserShops(@CurrentUser() user: any) {
    return this.shopsService.getUserShops(user.id);
  }

  @Get(':id')
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner', 'shop_worker')
  getShop(@Param('id', new ZodValidationPipe(IdParamSchema)) id: string) {
    return this.shopsService.getShop(id);
  }

  @Put(':id')
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner')
  updateShop(
    @Param('id', new ZodValidationPipe(IdParamSchema)) id: string,
    @Body(new ZodValidationPipe(UpdateShopSchema)) body: any,
  ) {
    console.log('[ShopsController] updateShop body:', body);
    return this.shopsService.updateShop(id, body);
  }

  @Delete(':id')
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner')
  deleteShop(@Param('id', new ZodValidationPipe(IdParamSchema)) id: string) {
    return this.shopsService.deleteShop(id);
  }
}
