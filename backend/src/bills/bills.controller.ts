import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BillsService } from './bills.service';
import { AuthGuard } from '../auth/auth.guard';
import { ShopRolesGuard, ShopRoles } from '../auth/shop-roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateBillSchema, IdParamSchema } from '../common/validation/schemas';

@Controller('api/shops/:shopId/bills')
@UseGuards(AuthGuard, ShopRolesGuard)
export class BillsController {
  constructor(private billsService: BillsService) {}

  @Post()
  @ShopRoles('owner', 'shop_worker')
  createBill(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: number,
    @Body(new ZodValidationPipe(CreateBillSchema)) body: any,
    @CurrentUser() user: any,
  ) {
    return this.billsService.createBill(shopId, body, user.id);
  }

  @Get()
  @ShopRoles('owner', 'shop_worker', 'app_admin')
  listBills(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: number,
  ) {
    return this.billsService.listBills(shopId);
  }

  @Get(':id')
  @ShopRoles('owner', 'shop_worker', 'app_admin')
  getBillDetail(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: number,
    @Param('id', new ZodValidationPipe(IdParamSchema)) id: number,
  ) {
    return this.billsService.getBillDetail(shopId, id);
  }

  @Put(':id/cancel')
  @ShopRoles('owner', 'shop_worker')
  cancelBill(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: number,
    @Param('id', new ZodValidationPipe(IdParamSchema)) id: number,
  ) {
    return this.billsService.cancelBill(shopId, id);
  }
}
