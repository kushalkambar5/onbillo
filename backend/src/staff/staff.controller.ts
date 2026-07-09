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
import { StaffService } from './staff.service';
import { AuthGuard } from '../auth/auth.guard';
import { ShopRolesGuard, ShopRoles } from '../auth/shop-roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  InviteStaffRoleSchema,
  InviteStaffByEmailSchema,
  IdParamSchema,
} from '../common/validation/schemas';

@Controller('api/shops/:shopId/staff')
@UseGuards(AuthGuard)
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner', 'shop_worker', 'app_admin')
  listStaff(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: string,
  ) {
    return this.staffService.listStaff(shopId);
  }

  @Get('invites')
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner', 'shop_worker', 'app_admin')
  listShopInvites(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: string,
  ) {
    return this.staffService.listShopInvites(shopId);
  }

  @Post('invite')
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner')
  inviteStaffByEmail(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: string,
    @Body(new ZodValidationPipe(InviteStaffByEmailSchema)) body: any,
    @CurrentUser() user: any,
  ) {
    return this.staffService.inviteStaffByEmail(
      shopId,
      body.email,
      user.id,
      body.role,
    );
  }

  @Post(':user_id')
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner')
  inviteStaff(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: string,
    @Param('user_id', new ZodValidationPipe(IdParamSchema)) userId: string,
    @Body(new ZodValidationPipe(InviteStaffRoleSchema)) body: any,
    @CurrentUser() user: any,
  ) {
    return this.staffService.inviteStaff(shopId, userId, user.id, body.role);
  }

  @Put('accept')
  acceptInvite(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: string,
    @CurrentUser() user: any,
  ) {
    return this.staffService.acceptInvite(shopId, user.id);
  }

  @Put(':id')
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner')
  updateStaffRole(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: string,
    @Param('id', new ZodValidationPipe(IdParamSchema)) id: string,
    @Body(new ZodValidationPipe(InviteStaffRoleSchema)) body: any,
  ) {
    return this.staffService.updateStaffRole(shopId, id, body.role);
  }

  @Delete(':id')
  @UseGuards(ShopRolesGuard)
  @ShopRoles('owner')
  removeStaff(
    @Param('shopId', new ZodValidationPipe(IdParamSchema)) shopId: string,
    @Param('id', new ZodValidationPipe(IdParamSchema)) id: string,
  ) {
    return this.staffService.removeStaff(shopId, id);
  }
}
