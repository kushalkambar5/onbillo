import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import { products, shopProducts } from '../db/schema';
import { eq, and, or, ilike } from 'drizzle-orm';

@Injectable()
export class ProductsService {
  constructor(private dbService: DbService) {}

  // --- Shop Products ---
  async listShopProducts(shopId: number) {
    const result = await this.dbService.db
      .select({
        id: shopProducts.id,
        shopId: shopProducts.shopId,
        productId: shopProducts.productId,
        unitPrice: shopProducts.unitPrice,
        isActive: shopProducts.isActive,
        createdAt: shopProducts.createdAt,
        updatedAt: shopProducts.updatedAt,
        product: products,
      })
      .from(shopProducts)
      .innerJoin(products, eq(shopProducts.productId, products.id))
      .where(eq(shopProducts.shopId, shopId));
    return result;
  }

  async addShopProduct(shopId: number, data: any) {
    const [shopProduct] = await this.dbService.db
      .insert(shopProducts)
      .values({
        shopId,
        productId: data.productId,
        unitPrice: data.unitPrice,
        isActive: data.isActive ?? true,
      })
      .returning();

    const [product] = await this.dbService.db
      .select()
      .from(products)
      .where(eq(products.id, shopProduct.productId))
      .limit(1);
    return { ...shopProduct, product };
  }

  async updateShopProduct(shopId: number, id: number, data: any) {
    const [shopProduct] = await this.dbService.db
      .update(shopProducts)
      .set({
        unitPrice: data.unitPrice,
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(and(eq(shopProducts.id, id), eq(shopProducts.shopId, shopId)))
      .returning();

    if (!shopProduct) throw new NotFoundException('Shop product not found');

    const [product] = await this.dbService.db
      .select()
      .from(products)
      .where(eq(products.id, shopProduct.productId))
      .limit(1);
    return { ...shopProduct, product };
  }

  async deleteShopProduct(shopId: number, id: number) {
    await this.dbService.db
      .delete(shopProducts)
      .where(and(eq(shopProducts.id, id), eq(shopProducts.shopId, shopId)));
    return { success: true };
  }

  async lookupShopProductByBarcode(shopId: number, code: string) {
    const result = await this.dbService.db
      .select({
        shopProduct: shopProducts,
        product: products,
      })
      .from(shopProducts)
      .innerJoin(products, eq(shopProducts.productId, products.id))
      .where(and(eq(shopProducts.shopId, shopId), eq(products.barcode, code)))
      .limit(1);

    if (result.length === 0)
      throw new NotFoundException('Shop product not found');
    return result[0];
  }

  // --- Global Products ---
  async searchGlobalProducts(query?: string) {
    if (!query) {
      return await this.dbService.db
        .select()
        .from(products)
        .where(eq(products.status, 'approved'));
    }
    return await this.dbService.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.status, 'approved'),
          or(
            ilike(products.name, `%${query}%`),
            ilike(products.barcode, `%${query}%`),
            ilike(products.brand, `%${query}%`),
          ),
        ),
      );
  }

  async lookupGlobalProductByBarcode(code: string) {
    const [product] = await this.dbService.db
      .select()
      .from(products)
      .where(eq(products.barcode, code))
      .limit(1);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async addGlobalProduct(data: any, user: any) {
    const status = user.role === 'app_admin' ? 'approved' : 'pending';

    if (data.barcode) {
      const [existing] = await this.dbService.db
        .select()
        .from(products)
        .where(eq(products.barcode, data.barcode))
        .limit(1);
      if (existing && existing.status === 'approved') {
        throw new BadRequestException(
          'A verified product with this barcode already exists. Please use it.',
        );
      }
    }

    const [product] = await this.dbService.db
      .insert(products)
      .values({
        barcode: data.barcode,
        name: data.name,
        brand: data.brand,
        category: data.category,
        imageUrl: data.imageUrl,
        mrp: data.mrp,
        status: status,
        createdBy: user.id,
      })
      .returning();

    return product;
  }

  async updateGlobalProduct(id: number, data: any, user: any) {
    const [product] = await this.dbService.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!product) throw new NotFoundException('Product not found');

    if (user.role !== 'app_admin' && product.createdBy !== user.id) {
      throw new ForbiddenException('Not allowed to update this product');
    }

    const [updatedProduct] = await this.dbService.db
      .update(products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return updatedProduct;
  }

  async verifyProduct(id: number) {
    const [product] = await this.dbService.db
      .update(products)
      .set({
        status: 'approved',
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async deleteGlobalProduct(id: number, user: any) {
    const [product] = await this.dbService.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!product) throw new NotFoundException('Product not found');

    if (user.role !== 'app_admin') {
      if (product.createdBy !== user.id || product.status !== 'pending') {
        throw new ForbiddenException('Not allowed to delete this product');
      }
    }

    await this.dbService.db.delete(products).where(eq(products.id, id));
    return { success: true };
  }
}
