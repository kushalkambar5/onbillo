import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { AuthGuard } from '../auth/auth.guard';
import { ShopRolesGuard, ShopRoles } from '../auth/shop-roles.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { IdParamSchema, AiAssistantPromptSchema } from '../common/validation/schemas';

@Controller('api/shops/:id/ai-assistant')
@UseGuards(AuthGuard, ShopRolesGuard)
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post()
  @ShopRoles('owner', 'shop_worker')
  async handlePrompt(
    @Param('id', new ZodValidationPipe(IdParamSchema)) shopId: string,
    @Body(new ZodValidationPipe(AiAssistantPromptSchema)) body: { prompt: string; history?: any[] },
  ) {
    return this.aiAssistantService.processPrompt(shopId, body.prompt, body.history);
  }
}
