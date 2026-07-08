import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UpdateMeSchema } from '../common/validation/schemas';

@Controller('api/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return user;
  }

  @Put('me')
  updateMe(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(UpdateMeSchema)) body: any,
  ) {
    return this.usersService.updatePhone(user.id, body.phone);
  }
}
