import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { RefreshCw, TrendingUp, TrendingDown, ShoppingCart, Package, DollarSign, Activity, FileText, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";
import { Badge } from "../components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import Pagination from "../components/ui/Pagination";
import { formatCurrency, cn } from "../lib/utils";
import api from "../lib/api";
import { exportData } from "../lib/export";

const PIE_COLORS = ["#0f766e", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#ccfbf1"];

function ExportButtons({ type, params = {} }) {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (format) => {
    setExporting(format);
    await exportData(type, format, params);
    setExporting(null);
  };

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => handleExport("excel")}
        disabled={exporting}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
      >
        <FileSpreadsheet className="h-3.5 w-3.5" />
        {exporting === "excel" ? "..." : "Excel"}
      </button>
      <button
        onClick={() => handleExport("pdf")}
        disabled={exporting}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
      >
        <FileText className="h-3.5 w-3.5" />
        {exporting === "pdf" ? "..." : "PDF"}
      </button>
    </div>
  );
}

function ChangeBadge({ value }) {
  if (value === 0) return <span className="text-[11px] text-slate-400">No change</span>;
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}{value}%
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, change, color = "text-teal-600" }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <ChangeBadge value={change} />
        </div>
        <p className="mt-3 text-xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-medium text-slate-600 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-[13px]" style={{ color: entry.color }}>
          {entry.name}: {entry.name.includes("Revenue") || entry.name.includes("revenue") || entry.name.includes("Total") ? formatCurrency(entry.value) : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

function SalesReportView({ data }) {
  const { summary, top_products, daily_sales, payment_breakdown, category_breakdown } = data;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Total Revenue</p><p className="text-xl font-bold">{formatCurrency(summary.total_sales)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Total Orders</p><p className="text-xl font-bold">{summary.total_orders}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Avg Order</p><p className="text-xl font-bold">{formatCurrency(summary.avg_order)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Items Sold</p><p className="text-xl font-bold">{summary.total_items}</p></CardContent></Card>
      </div>
      {daily_sales?.length > 0 && (
        <Card><CardHeader><CardTitle>Daily Sales</CardTitle></CardHeader><CardContent><div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={daily_sales}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" stroke="#94a3b8" fontSize={12} /><YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} /><Tooltip formatter={(v) => formatCurrency(v)} /><Bar dataKey="revenue" name="Revenue" fill="#0f766e" radius={[4, 4, 0, 0]} barSize={24} /></BarChart></ResponsiveContainer>
        </div></CardContent></Card>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {payment_breakdown && (
          <Card><CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader><CardContent><div className="space-y-3">
            {Object.entries(payment_breakdown).map(([method, amount], i) => (
              <div key={method} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} /><span className="text-sm font-medium capitalize">{method}</span></div>
                <div className="flex items-center gap-3"><span className="text-sm text-slate-500">{((amount / (summary.total_sales || 1)) * 100).toFixed(0)}%</span><span className="font-medium">{formatCurrency(amount)}</span></div>
              </div>
            ))}
          </div></CardContent></Card>
        )}
        {category_breakdown?.length > 0 && (
          <Card><CardHeader><CardTitle>Sales by Category</CardTitle></CardHeader><CardContent>
            <Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Orders</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
            <TableBody>{category_breakdown.map((c) => (<TableRow key={c.category}><TableCell className="font-medium">{c.category}</TableCell><TableCell>{c.orders}</TableCell><TableCell className="text-right">{formatCurrency(c.revenue)}</TableCell></TableRow>))}</TableBody></Table>
          </CardContent></Card>
        )}
      </div>
      {top_products?.length > 0 && (
        <Card><CardHeader><CardTitle>Top Products</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Product</TableHead><TableHead>Qty Sold</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
          <TableBody>{top_products.map((p, i) => (<TableRow key={p.product_name}><TableCell className="text-slate-400">{i + 1}</TableCell><TableCell className="font-medium">{p.product_name}</TableCell><TableCell>{p.total_qty}</TableCell><TableCell className="text-right font-medium">{formatCurrency(p.total_revenue)}</TableCell></TableRow>))}</TableBody></Table>
        </CardContent></Card>
      )}
    </div>
  );
}

function FinancialReportView({ data }) {
  const { revenue, cash_sales, card_sales, daily, refunds, net_revenue } = data;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Gross Revenue</p><p className="text-xl font-bold">{formatCurrency(revenue)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Refunds</p><p className="text-xl font-bold text-red-600">-{formatCurrency(refunds || 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Net Revenue</p><p className="text-xl font-bold text-green-600">{formatCurrency(net_revenue || revenue)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Cash Sales</p><p className="text-xl font-bold">{formatCurrency(cash_sales)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Card Sales</p><p className="text-xl font-bold">{formatCurrency(card_sales)}</p></CardContent></Card>
      </div>
      {daily?.length > 0 && (
        <Card><CardHeader><CardTitle>Daily Revenue</CardTitle></CardHeader><CardContent><div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={daily}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" stroke="#94a3b8" fontSize={12} /><YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} /><YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} /><Tooltip formatter={(v, name) => name === "revenue" ? formatCurrency(v) : v} /><Legend /><Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#0f766e" radius={[4, 4, 0, 0]} barSize={20} /><Bar yAxisId="right" dataKey="orders" name="Orders" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={20} /></BarChart></ResponsiveContainer>
        </div></CardContent></Card>
      )}
      {daily?.length > 0 && (
        <Card><CardHeader><CardTitle>Daily Breakdown</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Orders</TableHead><TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Avg Order</TableHead></TableRow></TableHeader>
          <TableBody>{daily.map((d) => (<TableRow key={d.date}><TableCell className="font-medium">{d.date}</TableCell><TableCell>{d.orders}</TableCell><TableCell className="text-right">{formatCurrency(d.revenue)}</TableCell><TableCell className="text-right text-slate-500">{d.orders > 0 ? formatCurrency(d.revenue / d.orders) : "—"}</TableCell></TableRow>))}</TableBody></Table>
        </CardContent></Card>
      )}
    </div>
  );
}

function InventoryReportView({ data }) {
  const { total_products, total_value, low_stock_count, out_of_stock_count, expiring_soon_count, category_breakdown, low_stock_products, expiring_products } = data;
  const categoryData = category_breakdown ? Object.entries(category_breakdown).map(([name, info]) => ({ name, count: info.count, value: info.value })) : [];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Total Products</p><p className="text-xl font-bold">{total_products}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Inventory Value</p><p className="text-xl font-bold">{formatCurrency(total_value)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Low Stock</p><p className="text-xl font-bold text-amber-600">{low_stock_count}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Out of Stock</p><p className="text-xl font-bold text-red-600">{out_of_stock_count}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Expiring Soon</p><p className="text-xl font-bold text-orange-600">{expiring_soon_count}</p></CardContent></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {categoryData.length > 0 && (
          <Card><CardHeader><CardTitle>Category Value</CardTitle></CardHeader><CardContent><div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={categoryData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} /><YAxis dataKey="name" type="category" width={120} stroke="#94a3b8" fontSize={11} /><Tooltip formatter={(v) => formatCurrency(v)} /><Bar dataKey="value" name="Value" fill="#0f766e" radius={[0, 4, 4, 0]} barSize={18} /></BarChart></ResponsiveContainer>
          </div></CardContent></Card>
        )}
        <Card><CardHeader><CardTitle>Category Details</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Products</TableHead><TableHead className="text-right">Value</TableHead></TableRow></TableHeader>
          <TableBody>{categoryData.map((c) => (<TableRow key={c.name}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.count}</TableCell><TableCell className="text-right">{formatCurrency(c.value)}</TableCell></TableRow>))}</TableBody></Table>
        </CardContent></Card>
      </div>
      {low_stock_products?.length > 0 && (
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Badge variant="warning">Low Stock</Badge> Products Needing Reorder</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Stock</TableHead><TableHead>Reorder Level</TableHead></TableRow></TableHeader>
          <TableBody>{low_stock_products.map((p) => (<TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-slate-500">{p.sku}</TableCell><TableCell className="text-amber-600 font-medium">{p.quantity}</TableCell><TableCell>{p.reorder_level}</TableCell></TableRow>))}</TableBody></Table>
        </CardContent></Card>
      )}
      {expiring_products?.length > 0 && (
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Badge variant="destructive">Expiring</Badge> Products Expiring Within 90 Days</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Stock</TableHead><TableHead>Expiry Date</TableHead></TableRow></TableHeader>
          <TableBody>{expiring_products.map((p) => (<TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-slate-500">{p.sku}</TableCell><TableCell>{p.quantity}</TableCell><TableCell className="text-red-600">{p.expiry_date}</TableCell></TableRow>))}</TableBody></Table>
        </CardContent></Card>
      )}
    </div>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [txPage, setTxPage] = useState(1);
  const [txData, setTxData] = useState(null);
  const [txLoading, setTxLoading] = useState(false);

  const [reportTab, setReportTab] = useState("sales");
  const [reportFrom, setReportFrom] = useState(new Date(new Date().setDate(1)).toISOString().split("T")[0]);
  const [reportTo, setReportTo] = useState(new Date().toISOString().split("T")[0]);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/analytics?period=${period}`);
        setData(response.data);
        setTxData(response.data.transactions);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    setTxPage(1);
  }, [period]);

  useEffect(() => {
    if (!data || txPage === 1) return;
    const fetchTx = async () => {
      setTxLoading(true);
      try {
        const response = await api.get(`/analytics?period=${period}&tx_page=${txPage}&tx_per_page=10`);
        setTxData(response.data.transactions);
      } catch (err) {
        console.error("Failed to load transactions", err);
      } finally {
        setTxLoading(false);
      }
    };
    fetchTx();
  }, [txPage, period, data]);

  const fetchReport = async () => {
    setReportLoading(true);
    try {
      const endpoint = reportTab === "sales" ? "/reports/sales" : reportTab === "financial" ? "/reports/financial" : "/reports/inventory";
      const params = reportTab !== "inventory" ? { from: reportFrom, to: reportTo } : {};
      const res = await api.get(endpoint, { params });
      setReportData(res.data);
    } catch { setReportData(null); } finally { setReportLoading(false); }
  };

  useEffect(() => { if (reportTab) fetchReport(); }, [reportTab]);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { summary, inventory, dailySales, topProducts, categoryPerformance, paymentBreakdown, hourlySales } = data;

  const topProductsArray = topProducts.map((p) => ({
    name: p.product_name,
    sold: Number(p.sold),
    revenue: Number(p.revenue),
    orders: Number(p.orders),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Analytics & Reports</h1>
          <p className="text-[13px] text-slate-500">Insights to help you make data-driven decisions.</p>
        </div>
        <div className="flex gap-2">
          {["week", "month", "year"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                period === p
                  ? "bg-primary text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={DollarSign} label="Total Revenue" value={formatCurrency(summary.totalRevenue)} change={summary.revenueChange} />
        <KpiCard icon={ShoppingCart} label="Total Orders" value={summary.totalOrders.toLocaleString()} change={summary.ordersChange} color="text-blue-600" />
        <KpiCard icon={Activity} label="Avg. Order Value" value={formatCurrency(summary.avgOrderValue)} change={summary.avgChange} color="text-violet-600" />
        <KpiCard icon={Package} label="Items Sold" value={summary.totalItemsSold.toLocaleString()} change={summary.itemsChange} color="text-amber-600" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow"><CardContent className="p-5"><p className="text-xs text-slate-500">Inventory Value</p><p className="mt-1.5 text-xl font-bold text-slate-800">{formatCurrency(inventory.totalValue)}</p><p className="text-[11px] text-slate-400 mt-1">{inventory.totalProducts} products</p></CardContent></Card>
        <Card className="hover:shadow-md transition-shadow"><CardContent className="p-5"><p className="text-xs text-slate-500">Total Stock</p><p className="mt-1.5 text-xl font-bold text-slate-800">{inventory.totalStock.toLocaleString()}</p><p className="text-[11px] text-slate-400 mt-1">units in inventory</p></CardContent></Card>
        <Card className="hover:shadow-md transition-shadow"><CardContent className="p-5"><p className="text-xs text-slate-500">Low Stock Items</p><p className="mt-1.5 text-xl font-bold text-amber-600">{inventory.lowStock}</p><p className="text-[11px] text-slate-400 mt-1">below reorder level</p></CardContent></Card>
        <Card className="hover:shadow-md transition-shadow"><CardContent className="p-5"><p className="text-xs text-slate-500">Out of Stock</p><p className="mt-1.5 text-xl font-bold text-red-500">{inventory.outOfStock}</p><p className="text-[11px] text-slate-400 mt-1">products unavailable</p></CardContent></Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Trends</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daily Revenue Trend</CardTitle>
              <ExportButtons type="daily-sales" params={{ from: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`, to: new Date().toISOString().slice(0, 10) }} />
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySales}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0f766e" strokeWidth={2} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hourly Sales Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" name="Revenue" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Top Selling Products</CardTitle>
                <ExportButtons type="top-products" params={{ from: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`, to: new Date().toISOString().slice(0, 10) }} />
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProductsArray} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                      <YAxis dataKey="name" type="category" width={150} stroke="#94a3b8" fontSize={11} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="sold" name="Units Sold" fill="#0f766e" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProductsArray}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-20} textAnchor="end" height={80} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
                      <Tooltip content={<CustomTooltip />} />
<Bar dataKey="revenue" name="Revenue" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Products Detail</CardTitle>
              <ExportButtons type="top-products" params={{ from: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`, to: new Date().toISOString().slice(0, 10) }} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Units Sold</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProductsArray.map((product) => (
                    <TableRow key={product.name}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sold}</TableCell>
                      <TableCell>{product.orders}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Revenue by Category</CardTitle>
                <ExportButtons type="categories" params={{ from: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`, to: new Date().toISOString().slice(0, 10) }} />
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryPerformance} cx="50%" cy="50%" innerRadius={70} outerRadius={130} dataKey="revenue" nameKey="name" paddingAngle={3}>
                        {categoryPerformance.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Units Sold by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="sold" name="Units Sold" fill="#0f766e" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Category Performance Detail</CardTitle>
              <ExportButtons type="categories" params={{ from: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`, to: new Date().toISOString().slice(0, 10) }} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Units Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryPerformance.map((cat) => (
                    <TableRow key={cat.name}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>{cat.sold}</TableCell>
                      <TableCell className="text-right">{formatCurrency(cat.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Split</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={70} outerRadius={130} dataKey="total" nameKey="method" paddingAngle={3}>
                        {paymentBreakdown.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Payment Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentBreakdown.map((p) => (
                    <div key={p.method} className="flex items-center justify-between rounded-lg border border-slate-100 p-4">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{p.method}</p>
                        <p className="text-[13px] text-slate-500">{p.count} transactions</p>
                      </div>
                      <p className="text-lg font-bold text-slate-800">{formatCurrency(p.total)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <ExportButtons type="transactions" params={{ from: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`, to: new Date().toISOString().slice(0, 10) }} />
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(txData?.data || []).map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">{sale.invoice}</TableCell>
                          <TableCell>{sale.customer}</TableCell>
                          <TableCell>{sale.created_at?.slice(0, 10)}</TableCell>
                          <TableCell>{sale.items}</TableCell>
                          <TableCell className="capitalize">{sale.payment_method}</TableCell>
                          <TableCell className="text-right">{formatCurrency(sale.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={sale.status === "Completed" ? "success" : "warning"}>
                              {sale.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination meta={txData?.meta} onPageChange={setTxPage} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex gap-2">
                  {["sales", "inventory", "financial"].map((t) => (
                    <button key={t} onClick={() => { setReportTab(t); setReportData(null); }}
                      className={cn("rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors",
                        reportTab === t ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}>{t}</button>
                  ))}
                </div>
                {reportTab !== "inventory" && (
                  <div className="flex items-end gap-3">
                    <div className="space-y-1"><label className="text-xs font-medium text-slate-500">From</label><input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                    <div className="space-y-1"><label className="text-xs font-medium text-slate-500">To</label><input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                    <button onClick={fetchReport} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">Generate</button>
                  </div>
                )}
                <div className="ml-auto">
                  <ExportButtons type={reportTab === "sales" ? "daily-sales" : reportTab === "financial" ? "financial" : "inventory"} params={reportTab !== "inventory" ? { from: reportFrom, to: reportTo } : {}} />
                </div>
              </div>
            </CardContent>
          </Card>

          {reportLoading ? (
            <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !reportData ? (
            <div className="flex h-64 items-center justify-center text-slate-400">No data available for this period.</div>
          ) : reportTab === "sales" ? (
            <SalesReportView data={reportData} />
          ) : reportTab === "financial" ? (
            <FinancialReportView data={reportData} />
          ) : (
            <InventoryReportView data={reportData} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
