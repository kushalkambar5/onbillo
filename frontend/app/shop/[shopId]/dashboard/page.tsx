"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@clerk/nextjs";
import { billsApi, productsApi, Bill, ShopProduct } from "../../../utils/api";
import { mockBills, mockShopProducts } from "../../../utils/api/mockData";
import { Skeleton } from "boneyard-js/react";
import { 
  TrendingUp, 
  ShoppingBag, 
  Receipt, 
  AlertTriangle,
  ArrowUpRight,
  TrendingDown
} from "lucide-react";

export default function ShopDashboard({
  params: paramsPromise,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const params = use(paramsPromise);
  const shopId = parseInt(params.shopId, 10);
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const isBoneyard = typeof window !== "undefined" && 
          ((window as any).__BONEYARD_BUILD || window.location.search.includes("boneyard=true"));
        
        if (isBoneyard) {
          setBills(mockBills[shopId] || mockBills[1] || []);
          setProducts(mockShopProducts[shopId] || mockShopProducts[1] || []);
          setLoading(false);
          return;
        }

        const token = await getToken();
        const [billsList, productsList] = await Promise.all([
          billsApi.getShopBills(token, shopId),
          productsApi.getShopProducts(token, shopId)
        ]);
        setBills(billsList);
        setProducts(productsList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [shopId, getToken]);

  // Compute analytics dynamically
  const activeBills = bills.filter(b => b.status === "active");
  const totalSalesPaise = activeBills.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalSalesRs = totalSalesPaise / 100;
  
  const totalInvoices = activeBills.length;
  const avgBillRs = totalInvoices > 0 ? (totalSalesRs / totalInvoices) : 0;
  
  const activeProductsCount = products.filter(p => p.isActive).length;
  
  const displaySales = totalSalesRs;
  const displayInvoices = totalInvoices;
  const displayAvgBill = avgBillRs;
  const displayProducts = activeProductsCount;

  // Calculate trends dynamically by comparing this week vs previous week
  const nowTime = new Date().getTime();
  const sevenDaysAgo = nowTime - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = nowTime - 14 * 24 * 60 * 60 * 1000;

  const thisWeekBills = activeBills.filter(b => {
    const t = new Date(b.createdAt).getTime();
    return t >= sevenDaysAgo;
  });

  const prevWeekBills = activeBills.filter(b => {
    const t = new Date(b.createdAt).getTime();
    return t >= fourteenDaysAgo && t < sevenDaysAgo;
  });

  // 1. Total Revenue Trend
  const thisWeekSales = thisWeekBills.reduce((sum, b) => sum + b.totalPrice, 0) / 100;
  const prevWeekSales = prevWeekBills.reduce((sum, b) => sum + b.totalPrice, 0) / 100;
  let salesTrendPercentage = 0;
  if (prevWeekSales > 0) {
    salesTrendPercentage = ((thisWeekSales - prevWeekSales) / prevWeekSales) * 100;
  } else if (thisWeekSales > 0) {
    salesTrendPercentage = 100;
  }

  // 2. Invoices Generated Trend
  const thisWeekInvoices = thisWeekBills.length;
  const prevWeekInvoices = prevWeekBills.length;
  let invoicesTrendPercentage = 0;
  if (prevWeekInvoices > 0) {
    invoicesTrendPercentage = ((thisWeekInvoices - prevWeekInvoices) / prevWeekInvoices) * 100;
  } else if (thisWeekInvoices > 0) {
    invoicesTrendPercentage = 100;
  }

  // 3. Average Bill Trend
  const thisWeekAvgBill = thisWeekInvoices > 0 ? thisWeekSales / thisWeekInvoices : 0;
  const prevWeekAvgBill = prevWeekInvoices > 0 ? prevWeekSales / prevWeekInvoices : 0;
  let avgBillTrendPercentage = 0;
  if (prevWeekAvgBill > 0) {
    avgBillTrendPercentage = ((thisWeekAvgBill - prevWeekAvgBill) / prevWeekAvgBill) * 100;
  } else if (thisWeekAvgBill > 0) {
    avgBillTrendPercentage = 100;
  }

  // Calculate daily sales trend dynamically for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const salesTrendMap = new Map<string, number>();
  last7Days.forEach(date => salesTrendMap.set(date, 0));

  activeBills.forEach(b => {
    const dateStr = new Date(b.createdAt).toISOString().split("T")[0];
    if (salesTrendMap.has(dateStr)) {
      salesTrendMap.set(dateStr, salesTrendMap.get(dateStr)! + b.totalPrice / 100);
    }
  });

  const salesHistory = last7Days.map(date => salesTrendMap.get(date) || 0);

  const maxVal = Math.max(...salesHistory, 100); // Minimum scale height of 100 Rs
  const chartHeight = 120;
  const chartWidth = 500;
  const points = salesHistory.map((val, idx) => {
    const x = (idx / (salesHistory.length - 1)) * chartWidth;
    const y = chartHeight - (val / maxVal) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  }).join(" ");

  // Calculate Top Selling Categories dynamically based on items sold
  const categorySalesMap = new Map<string, number>();
  let totalItemsSold = 0;

  activeBills.forEach(b => {
    b.items?.forEach(item => {
      const shopProduct = products.find(sp => sp.id === item.shopProductId);
      const category = shopProduct?.product.category || "Uncategorized";
      categorySalesMap.set(category, (categorySalesMap.get(category) || 0) + item.quantity);
      totalItemsSold += item.quantity;
    });
  });

  const sortedCategories = Array.from(categorySalesMap.entries())
    .map(([category, count]) => ({
      category,
      percentage: totalItemsSold > 0 ? Math.round((count / totalItemsSold) * 100) : 0
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 4);

  return (
    <Skeleton name="shop-dashboard" loading={loading}>
      <div className="space-y-8">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-sans">Business Analytics</h1>
      </div>

      {/* 2. Key Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Revenue */}
        <div className="bg-canvas border border-hairline rounded-2xl p-5 shadow-sm hover:border-hairline-strong transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-mute font-sans uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-primary/5 flex items-center justify-center text-brand-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl font-bold text-foreground tracking-tight">
              ₹{displaySales.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            {salesTrendPercentage >= 0 ? (
              <p className="text-[10px] text-brand-primary font-bold flex items-center gap-0.5 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +{salesTrendPercentage.toFixed(1)}% from last week
              </p>
            ) : (
              <p className="text-[10px] text-error-deep font-bold flex items-center gap-0.5 mt-1">
                <TrendingDown className="w-3.5 h-3.5" /> {salesTrendPercentage.toFixed(1)}% from last week
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Invoice count */}
        <div className="bg-canvas border border-hairline rounded-2xl p-5 shadow-sm hover:border-hairline-strong transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-mute font-sans uppercase tracking-wider">
              Invoices Generated
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-primary/5 flex items-center justify-center text-brand-primary">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl font-bold text-foreground tracking-tight">
              {displayInvoices}
            </h3>
            {invoicesTrendPercentage >= 0 ? (
              <p className="text-[10px] text-brand-primary font-bold flex items-center gap-0.5 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +{invoicesTrendPercentage.toFixed(1)}% daily average
              </p>
            ) : (
              <p className="text-[10px] text-error-deep font-bold flex items-center gap-0.5 mt-1">
                <TrendingDown className="w-3.5 h-3.5" /> {invoicesTrendPercentage.toFixed(1)}% daily average
              </p>
            )}
          </div>
        </div>

        {/* Card 3: Avg Bill Value */}
        <div className="bg-canvas border border-hairline rounded-2xl p-5 shadow-sm hover:border-hairline-strong transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-mute font-sans uppercase tracking-wider">
              Average Bill
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-primary/5 flex items-center justify-center text-brand-primary">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl font-bold text-foreground tracking-tight">
              ₹{displayAvgBill.toFixed(2)}
            </h3>
            {avgBillTrendPercentage >= 0 ? (
              <p className="text-[10px] text-brand-primary font-bold flex items-center gap-0.5 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +{avgBillTrendPercentage.toFixed(1)}% basket increase
              </p>
            ) : (
              <p className="text-[10px] text-error-deep font-bold flex items-center gap-0.5 mt-1">
                <TrendingDown className="w-3.5 h-3.5" /> {avgBillTrendPercentage.toFixed(1)}% basket decrease
              </p>
            )}
          </div>
        </div>

        {/* Card 4: Active Products */}
        <div className="bg-canvas border border-hairline rounded-2xl p-5 shadow-sm hover:border-hairline-strong transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-mute font-sans uppercase tracking-wider">
              Active Inventory
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-primary/5 flex items-center justify-center text-brand-primary">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl font-bold text-foreground tracking-tight">
              {displayProducts}
            </h3>
            <p className="text-[10px] text-mute font-semibold flex items-center gap-1 mt-1">
              <span>●</span> {products.filter(p => !p.isActive).length} products inactive
            </p>
          </div>
        </div>
      </div>

      {/* 3. Charts & List Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales trend chart */}
        <div className="bg-canvas border border-hairline rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground font-sans">Sales Trend</h3>
              <p className="text-[10px] text-mute font-semibold">Weekly aggregate overview</p>
            </div>
            <div className="px-2.5 py-1 rounded bg-canvas-soft border border-hairline text-[10px] font-bold text-body uppercase font-mono">
              Live Feed
            </div>
          </div>

          {/* SVG Sparkline */}
          <div className="w-full h-44 bg-canvas-soft rounded-xl border border-hairline flex items-center justify-center p-4 relative overflow-hidden">
            <svg 
              className="w-full h-full"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              preserveAspectRatio="none"
            >
              {/* Fill Gradient under the line */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              
              {/* Background gridlines */}
              <line x1="0" y1="30" x2={chartWidth} y2="30" stroke="var(--color-hairline)" strokeWidth="0.75" />
              <line x1="0" y1="60" x2={chartWidth} y2="60" stroke="var(--color-hairline)" strokeWidth="0.75" />
              <line x1="0" y1="90" x2={chartWidth} y2="90" stroke="var(--color-hairline)" strokeWidth="0.75" />

              {/* Area path */}
              <path
                d={`M 0,${chartHeight} L ${points} L ${chartWidth},${chartHeight} Z`}
                fill="url(#chartGrad)"
              />
              
              {/* Chart Line */}
              <polyline
                fill="none"
                stroke="var(--color-brand-primary)"
                strokeWidth="2"
                points={points}
              />
            </svg>
          </div>
        </div>

        {/* Top selling products / categories */}
        <div className="bg-canvas border border-hairline rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground font-sans">Top Selling Categories</h3>
            <p className="text-[10px] text-mute font-semibold">Based on inventory category tag</p>
          </div>
          
          <div className="space-y-3.5 pt-2">
            {sortedCategories.length === 0 ? (
              <div className="text-xs text-mute py-8 text-center">
                No category sales recorded yet.
              </div>
            ) : (
              sortedCategories.map(({ category, percentage }) => (
                <div key={category}>
                  <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
                    <span>{category}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-canvas-soft border border-hairline h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-primary h-full rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </Skeleton>
  );
}
