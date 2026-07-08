import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  RespondToInviteSchema,
  IdParamSchema,
} from '../common/validation/schemas';

@Controller('api/staff/invites')
@UseGuards(AuthGuard)
export class StaffRequestsController {
  constructor(private staffService: StaffService) {}

  @Get()
  listPendingInvites(@CurrentUser() user: any) {
    return this.staffService.listPendingInvites(user.id);
  }

  @Put(':id')
  respondToInvite(
    @Param('id', new ZodValidationPipe(IdParamSchema)) id: string,
    @Body(new ZodValidationPipe(RespondToInviteSchema)) body: any,
    @CurrentUser() user: any,
  ) {
    return this.staffService.respondToInvite(id, user.id, body.status);
  }
}
