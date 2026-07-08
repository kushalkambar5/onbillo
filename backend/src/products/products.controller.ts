import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateProductSchema,
  UpdateProductSchema,
  IdParamSchema,
  BarcodeSchema,
  SearchQuerySchema,
} from '../common/validation/schemas';

@Controller('api/products')
@UseGuards(AuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  searchGlobalProducts(
    @Query('q', new ZodValidationPipe(SearchQuerySchema)) query?: string,
  ) {
    return this.productsService.searchGlobalProducts(query);
  }

  @Get('barcode/:code')
  lookupGlobalProductByBarcode(
    @Param('code', new ZodValidationPipe(BarcodeSchema)) code: string,
  ) {
    return this.productsService.lookupGlobalProductByBarcode(code);
  }

  @Post()
  addGlobalProduct(
    @Body(new ZodValidationPipe(CreateProductSchema)) body: any,
    @CurrentUser() user: any,
  ) {
    return this.productsService.addGlobalProduct(body, user);
  }

  @Put(':id')
  updateGlobalProduct(
    @Param('id', new ZodValidationPipe(IdParamSchema)) id: number,
    @Body(new ZodValidationPipe(UpdateProductSchema)) body: any,
    @CurrentUser() user: any,
  ) {
    return this.productsService.updateGlobalProduct(id, body, user);
  }

  @Put('verify/:id')
  @UseGuards(RolesGuard)
  @Roles('app_admin')
  verifyProduct(@Param('id', new ZodValidationPipe(IdParamSchema)) id: number) {
    return this.productsService.verifyProduct(id);
  }

  @Delete(':id')
  deleteGlobalProduct(
    @Param('id', new ZodValidationPipe(IdParamSchema)) id: number,
    @CurrentUser() user: any,
  ) {
    return this.productsService.deleteGlobalProduct(id, user);
  }
}
