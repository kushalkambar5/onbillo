import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import { products, shopProducts, users, billItems } from '../db/schema';
import { eq, and, or, ilike, inArray, notInArray } from 'drizzle-orm';


@Injectable()
export class ProductsService {
  constructor(private dbService: DbService) {}

  // --- Shop Products ---
  async listShopProducts(shopId: string) {
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

  async addShopProduct(shopId: string, data: any) {
    const [product] = await this.dbService.db
      .select()
      .from(products)
      .where(eq(products.id, data.productId))
      .limit(1);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [existing] = await this.dbService.db
      .select()
      .from(shopProducts)
      .where(
        and(
          eq(shopProducts.shopId, shopId),
          eq(shopProducts.productId, data.productId),
        ),
      )
      .limit(1);
    if (existing) {
      throw new BadRequestException('This product is already in your shop.');
    }

    if (product.status === 'pending') {
      if (!product.createdBy) {
        throw new ForbiddenException(
          'You cannot add this pending product to your shop.',
        );
      }
      const [creator] = await this.dbService.db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, product.createdBy),
            eq(users.shopId, shopId),
          ),
        )
        .limit(1);
      if (!creator) {
        throw new ForbiddenException(
          'You cannot add this pending product to your shop.',
        );
      }
    }

    const [shopProduct] = await this.dbService.db
      .insert(shopProducts)
      .values({
        shopId,
        productId: data.productId,
        unitPrice: data.unitPrice,
        isActive: data.isActive ?? true,
      })
      .returning();

    return { ...shopProduct, product };
  }


  async updateShopProduct(shopId: string, id: string, data: any) {
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

  async deleteShopProduct(shopId: string, id: string) {
    // 1. Get the shop product and the associated product
    const [shopProduct] = await this.dbService.db
      .select({
        id: shopProducts.id,
        productId: shopProducts.productId,
        productStatus: products.status,
      })
      .from(shopProducts)
      .innerJoin(products, eq(shopProducts.productId, products.id))
      .where(and(eq(shopProducts.id, id), eq(shopProducts.shopId, shopId)))
      .limit(1);

    if (!shopProduct) {
      throw new NotFoundException('Shop product not found');
    }

    // 2. Check if the shop product is referenced in any bills
    const [hasBills] = await this.dbService.db
      .select()
      .from(billItems)
      .where(eq(billItems.shopProductId, id))
      .limit(1);

    if (hasBills) {
      throw new BadRequestException(
        'Cannot delete this product because it has historical billing records.',
      );
    }

    // 3. Delete from shop_products
    await this.dbService.db
      .delete(shopProducts)
      .where(eq(shopProducts.id, id));

    // 4. If product is not approved, delete it from the products table too
    if (shopProduct.productStatus !== 'approved') {
      await this.dbService.db
        .delete(products)
        .where(eq(products.id, shopProduct.productId));
    }

    return { success: true };
  }

  async lookupShopProductByBarcode(shopId: string, code: string) {
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
  async searchGlobalProducts(user: any, query?: string, shopId?: string) {
    let isMember = false;
    let memberUserIds: string[] = [];

    if (shopId) {
      const membersList = await this.dbService.db
        .select({ userId: users.id })
        .from(users)
        .where(eq(users.shopId, shopId));
      memberUserIds = membersList.map((m) => m.userId);
      isMember = memberUserIds.includes(user.id) || user.role === 'app_admin';
    }

    const approvedClause = eq(products.status, 'approved');
    const userClause = eq(products.createdBy, user.id);

    let visibilityClause: any;
    if (shopId) {
      visibilityClause = approvedClause;
    } else if (isMember) {
      const conditions: any[] = [userClause];
      if (memberUserIds.length > 0) {
        conditions.push(inArray(products.createdBy, memberUserIds));
      }
      visibilityClause = or(
        approvedClause,
        and(eq(products.status, 'pending'), or(...conditions)),
      );
    } else {
      visibilityClause = or(
        approvedClause,
        and(eq(products.status, 'pending'), userClause),
      );
    }

    let shopProductIds: string[] = [];
    if (shopId) {
      const existingShopProducts = await this.dbService.db
        .select({ productId: shopProducts.productId })
        .from(shopProducts)
        .where(eq(shopProducts.shopId, shopId));
      shopProductIds = existingShopProducts
        .map((sp) => sp.productId)
        .filter(Boolean);
    }

    const conditions: any[] = [visibilityClause];

    if (shopId && shopProductIds.length > 0) {
      conditions.push(notInArray(products.id, shopProductIds));
    }

    if (query) {
      conditions.push(
        or(
          ilike(products.name, `%${query}%`),
          ilike(products.barcode, `%${query}%`),
          ilike(products.brand, `%${query}%`),
        ),
      );
    }

    return await this.dbService.db
      .select()
      .from(products)
      .where(and(...conditions));
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

  async addCustomProduct(shopId: string, data: any, user: any) {
    const status = user.role === 'app_admin' ? 'approved' : 'pending';

    if (data.barcode) {
      const [existing] = await this.dbService.db
        .select()
        .from(products)
        .where(eq(products.barcode, data.barcode))
        .limit(1);

      if (existing) {
        if (existing.status === 'approved') {
          throw new BadRequestException(
            'A verified product with this barcode already exists. Please search and add it.',
          );
        }

        const [existingShopProduct] = await this.dbService.db
          .select()
          .from(shopProducts)
          .where(
            and(
              eq(shopProducts.shopId, shopId),
              eq(shopProducts.productId, existing.id),
            ),
          )
          .limit(1);
        if (existingShopProduct) {
          throw new BadRequestException(
            'This pending product is already in your shop.',
          );
        }

        if (!existing.createdBy) {
          throw new BadRequestException(
            'A pending product with this barcode already exists.',
          );
        }

        const [creator] = await this.dbService.db
          .select()
          .from(users)
          .where(
            and(
              eq(users.id, existing.createdBy),
              eq(users.shopId, shopId),
            ),
          )
          .limit(1);
        if (!creator && existing.createdBy !== user.id) {
          throw new BadRequestException(
            'A pending product with this barcode already exists but belongs to another shop.',
          );
        }

        const [shopProduct] = await this.dbService.db
          .insert(shopProducts)
          .values({
            shopId,
            productId: existing.id,
            unitPrice: data.unitPrice,
            isActive: true,
          })
          .returning();

        return { ...shopProduct, product: existing };
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

    const [shopProduct] = await this.dbService.db
      .insert(shopProducts)
      .values({
        shopId,
        productId: product.id,
        unitPrice: data.unitPrice,
        isActive: true,
      })
      .returning();

    return { ...shopProduct, product };
  }


  async updateGlobalProduct(id: string, data: any, user: any) {
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

  async verifyProduct(id: string) {
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

  async deleteGlobalProduct(id: string, user: any) {
    if (user.role === 'shop_worker') {
      throw new ForbiddenException('Workers are not allowed to delete products');
    }

    const [product] = await this.dbService.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!product) throw new NotFoundException('Product not found');

    if (product.status === 'approved') {
      throw new BadRequestException('Approved products cannot be deleted.');
    }

    if (user.role !== 'app_admin') {
      if (product.createdBy !== user.id || product.status !== 'pending') {
        throw new ForbiddenException('Not allowed to delete this product');
      }
    }

    await this.dbService.db.delete(products).where(eq(products.id, id));
    return { success: true };
  }
}
