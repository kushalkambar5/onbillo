import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { shops, shopProducts, products, bills, billItems, users, staffRequests } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  constructor(private dbService: DbService) {
    // Ensure Groq API Key and base URL are configured in environment for OpenAI Agent SDK
    if (!process.env.OPENAI_API_KEY && process.env.GROQ_API_KEY) {
      process.env.OPENAI_API_KEY = process.env.GROQ_API_KEY;
    }
    if (!process.env.OPENAI_BASE_URL) {
      process.env.OPENAI_BASE_URL = 'https://api.groq.com/openai/v1';
    }
  }

  /**
   * Builds OpenAI Agent SDK tools dynamically for a specific shop context.
   */
  private createShopTools(shopId: string) {
    const getShopDetailsTool = tool({
      name: 'get_shop_details',
      description: 'Get details about the current shop including name, address, tax rate, GST, invoice counter, and settings.',
      parameters: z.object({}),
      execute: async () => {
        const [shop] = await this.dbService.db
          .select()
          .from(shops)
          .where(eq(shops.id, shopId))
          .limit(1);

        if (!shop) return JSON.stringify({ error: 'Shop not found' });
        return JSON.stringify(shop);
      },
    });

    const getInventoryTool = tool({
      name: 'get_shop_inventory',
      description: 'Get list of products in the shop inventory with unit prices, quantity stock, and low stock status.',
      parameters: z.object({
        searchQuery: z.string().optional().describe('Optional product name or barcode to filter'),
        lowStockOnly: z.boolean().optional().describe('If true, return only products with stock <= 5'),
      }),
      execute: async ({ searchQuery, lowStockOnly }) => {
        let baseQuery = this.dbService.db
          .select({
            shopProductId: shopProducts.id,
            productId: products.id,
            productName: products.name,
            brand: products.brand,
            category: products.category,
            barcode: products.barcode,
            unitPrice: shopProducts.unitPrice, // in paise
            quantity: shopProducts.quantity,
            isActive: shopProducts.isActive,
          })
          .from(shopProducts)
          .innerJoin(products, eq(products.id, shopProducts.productId))
          .where(eq(shopProducts.shopId, shopId));

        const result = await baseQuery;
        let filtered = result;

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (item) =>
              item.productName.toLowerCase().includes(q) ||
              (item.barcode && item.barcode.includes(q)) ||
              (item.brand && item.brand.toLowerCase().includes(q))
          );
        }

        if (lowStockOnly) {
          filtered = filtered.filter((item) => item.quantity <= 5);
        }

        const formatted = filtered.map((item) => ({
          ...item,
          unitPriceFormatted: `₹${(item.unitPrice / 100).toFixed(2)}`,
          isLowStock: item.quantity <= 5,
        }));

        return JSON.stringify({
          totalProducts: formatted.length,
          products: formatted.slice(0, 30), // capped for context limit
        });
      },
    });

    const getBillsTool = tool({
      name: 'get_recent_bills',
      description: 'Get recent sales bills for the shop with total price, items count, and timestamps.',
      parameters: z.object({
        limit: z.number().optional().describe('Number of recent bills to fetch, default 10'),
      }),
      execute: async ({ limit = 10 }) => {
        const recentBills = await this.dbService.db
          .select()
          .from(bills)
          .where(eq(bills.shopId, shopId))
          .orderBy(desc(bills.createdAt))
          .limit(Math.min(limit, 25));

        const formatted = recentBills.map((b) => ({
          billId: b.id,
          billNumber: b.billNumber,
          totalPriceRupees: (b.totalPrice / 100).toFixed(2),
          status: b.status,
          notes: b.notes,
          createdAt: b.createdAt,
        }));

        return JSON.stringify({
          count: formatted.length,
          bills: formatted,
        });
      },
    });

    const getAnalyticsTool = tool({
      name: 'get_shop_analytics_summary',
      description: 'Get high-level summary of shop sales revenue, total bills created, total products, and low stock count.',
      parameters: z.object({}),
      execute: async () => {
        const shopBills = await this.dbService.db
          .select()
          .from(bills)
          .where(and(eq(bills.shopId, shopId), eq(bills.status, 'active')));

        const activeProducts = await this.dbService.db
          .select()
          .from(shopProducts)
          .where(and(eq(shopProducts.shopId, shopId), eq(shopProducts.isActive, true)));

        const totalRevenuePaise = shopBills.reduce((acc, b) => acc + b.totalPrice, 0);
        const lowStockCount = activeProducts.filter((p) => p.quantity <= 5).length;

        return JSON.stringify({
          totalActiveBills: shopBills.length,
          totalRevenueRupees: (totalRevenuePaise / 100).toFixed(2),
          totalProductsInShop: activeProducts.length,
          lowStockProductsCount: lowStockCount,
        });
      },
    });

    const getStaffTool = tool({
      name: 'get_staff_members',
      description: 'Get members of the shop staff and pending join requests.',
      parameters: z.object({}),
      execute: async () => {
        const members = await this.dbService.db
          .select({
            userId: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            role: users.role,
          })
          .from(users)
          .where(eq(users.shopId, shopId));

        const requests = await this.dbService.db
          .select({
            requestId: staffRequests.id,
            requestedToName: users.name,
            requestedToEmail: users.email,
            status: staffRequests.status,
            createdAt: staffRequests.createdAt,
          })
          .from(staffRequests)
          .innerJoin(users, eq(users.id, staffRequests.requestedTo))
          .where(eq(staffRequests.shopId, shopId));

        return JSON.stringify({
          staffCount: members.length,
          members,
          requests,
        });
      },
    });

    return [getShopDetailsTool, getInventoryTool, getBillsTool, getAnalyticsTool, getStaffTool];
  }

  /**
   * Process a prompt from user using OpenAI Agent SDK
   */
  async processPrompt(
    shopId: string,
    prompt: string,
    history?: { role: 'user' | 'assistant'; content: string }[]
  ) {
    const shopTools = this.createShopTools(shopId);

    // Get basic shop info for system instructions
    const [shop] = await this.dbService.db
      .select({ name: shops.name, city: shops.city })
      .from(shops)
      .where(eq(shops.id, shopId))
      .limit(1);

    const shopName = shop?.name || 'Onbillo Shop';

    // Model configured for Groq: openai/gpt-oss-20b or groq/compound-mini
    const selectedModel = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

    const agent = new Agent({
      name: 'Onbillo Shop Assistant',
      instructions: `You are an intelligent, helpful AI assistant built into Onbillo POS & Inventory system for the shop "${shopName}".
Your role is to assist shop managers and staff with inventory queries, sales analysis, stock alerts, bill summaries, and store operations.
Rules:
1. Always use available tools when queried about real shop data (inventory, bills, sales, staff, settings).
2. Present financial numbers cleanly in Indian Rupees (₹). Note that prices in database tools are converted to Rupees.
3. Be concise, polite, and format key data using bullet points or markdown tables.
4. If asked about low stock, identify items with stock level <= 5.`,
      model: selectedModel,
      modelSettings: {
        maxTokens: 600,
      },
      tools: shopTools,
    });

    try {
      // Execute the agent run
      const runResult = await run(agent, prompt);

      return {
        response: runResult.finalOutput || 'No response generated.',
        agentName: agent.name,
      };
    } catch (error: any) {
      this.logger.error(`Error in OpenAI Agent SDK execution: ${error?.message}`, error?.stack);
      throw error;
    }
  }
}
