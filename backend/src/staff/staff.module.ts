import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffRequestsController } from './staff-requests.controller';
import { StaffService } from './staff.service';

@Module({
  controllers: [StaffController, StaffRequestsController],
  providers: [StaffService]
})
export class StaffModule {}
