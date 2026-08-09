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
import { RefreshCw, TrendingUp, TrendingDown, ShoppingCart, Package, DollarSign, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";
import { Badge } from "../components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import Pagination from "../components/ui/Pagination";
import { formatCurrency } from "../lib/utils";
import api from "../lib/api";

const PIE_COLORS = ["#0f766e", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#ccfbf1"];

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

export default function Analytics() {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [txPage, setTxPage] = useState(1);
  const [txData, setTxData] = useState(null);
  const [txLoading, setTxLoading] = useState(false);

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
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Inventory Value</p>
            <p className="mt-1.5 text-xl font-bold text-slate-800">{formatCurrency(inventory.totalValue)}</p>
            <p className="text-[11px] text-slate-400 mt-1">{inventory.totalProducts} products</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Total Stock</p>
            <p className="mt-1.5 text-xl font-bold text-slate-800">{inventory.totalStock.toLocaleString()}</p>
            <p className="text-[11px] text-slate-400 mt-1">units in inventory</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Low Stock Items</p>
            <p className="mt-1.5 text-xl font-bold text-amber-600">{inventory.lowStock}</p>
            <p className="text-[11px] text-slate-400 mt-1">below reorder level</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Out of Stock</p>
            <p className="mt-1.5 text-xl font-bold text-red-500">{inventory.outOfStock}</p>
            <p className="text-[11px] text-slate-400 mt-1">products unavailable</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Trends</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue Trend</CardTitle>
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
                    <Bar dataKey="revenue" name="Revenue" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProductsArray} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                      <YAxis dataKey="name" type="category" width={150} stroke="#94a3b8" fontSize={11} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="sold" name="Units Sold" fill="#0f766e" radius={[0, 4, 4, 0]} />
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
                      <Bar dataKey="revenue" name="Revenue" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Products Detail</CardTitle>
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
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPerformance}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={130}
                        dataKey="revenue"
                        nameKey="name"
                        paddingAngle={3}
                      >
                        {categoryPerformance.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
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
                      <Bar dataKey="sold" name="Units Sold" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Performance Detail</CardTitle>
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
                      <Pie
                        data={paymentBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={130}
                        dataKey="total"
                        nameKey="method"
                        paddingAngle={3}
                      >
                        {paymentBreakdown.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
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
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
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
      </Tabs>
    </div>
  );
}
