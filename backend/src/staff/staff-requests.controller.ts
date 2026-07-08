import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('api/staff/invites')
@UseGuards(AuthGuard)
export class StaffRequestsController {
  constructor(private staffService: StaffService) {}

  @Get()
  listPendingInvites(@CurrentUser() user: any) {
    return this.staffService.listPendingInvites(user.id);
  }

  @Put(':id')
  respondToInvite(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const status = body.status;
    if (status !== 'accepted' && status !== 'rejected') {
      throw new Error('Invalid invitation status');
    }
    return this.staffService.respondToInvite(parseInt(id, 10), user.id, status);
  }
}
