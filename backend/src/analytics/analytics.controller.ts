import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';
import { ShopRolesGuard, ShopRoles } from '../auth/shop-roles.guard';

@Controller('api/shops/:shopId/analytics')
@UseGuards(AuthGuard, ShopRolesGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  @ShopRoles('owner', 'app_admin')
  getSummary(@Param('shopId') shopId: string) {
    return this.analyticsService.getSummary(parseInt(shopId, 10));
  }

  @Get('top-products')
  @ShopRoles('owner', 'app_admin')
  getTopProducts(@Param('shopId') shopId: string) {
    return this.analyticsService.getTopProducts(parseInt(shopId, 10));
  }

  @Get('sales-trend')
  @ShopRoles('owner', 'app_admin')
  getSalesTrend(@Param('shopId') shopId: string) {
    return this.analyticsService.getSalesTrend(parseInt(shopId, 10));
  }
}
