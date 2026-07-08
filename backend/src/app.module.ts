import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ShopsModule } from './shops/shops.module';
import { ProductsModule } from './products/products.module';
import { BillsModule } from './bills/bills.module';
import { StaffModule } from './staff/staff.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';
import { DbModule } from './db/db.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    DbModule,
    AuthModule,
    WebhooksModule,
    ShopsModule,
    ProductsModule,
    BillsModule,
    StaffModule,
    AnalyticsModule,
    AdminModule,
    UploadModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
