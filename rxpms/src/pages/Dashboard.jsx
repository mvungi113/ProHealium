import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { COLORS } from "../data/mockData";
import { formatCurrency, getDaysUntilExpiry } from "../lib/utils";
import api from "../lib/api";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function StatCard({ title, value, change, icon: Icon, trend }) {
  const isPositive = trend === "up";
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">{title}</p>
            <h3 className="mt-1.5 text-xl font-bold text-slate-800">{value}</h3>
            <div className="mt-1 flex items-center gap-1 text-xs">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              )}
              <span className={isPositive ? "text-success" : "text-destructive"}>
                {change}%
              </span>
              <span className="text-slate-400">vs last week</span>
            </div>
          </div>
          <div className="rounded-lg bg-primary-50 p-2.5 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const response = await api.get("/dashboard");
      setData(response.data);
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { stats, weeklySales, categoryData, recentSales, lowStockProducts, expiringProducts } = data;

  const chartData = DAY_NAMES.map((name, index) => ({
    name,
    sales: weeklySales.find((w) => Number(w.day) === index)?.total || 0,
  }));

  const totalCategoryQty = categoryData.reduce((sum, c) => sum + c.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-[13px] text-slate-500">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Sales" value={formatCurrency(stats.totalSales)} change={12.5} icon={DollarSign} trend="up" />
        <StatCard title="Total Orders" value={stats.totalOrders} change={8.2} icon={ShoppingBag} trend="up" />
        <StatCard title="Products in Stock" value={stats.productsInStock} change={-3.1} icon={Package} trend="down" />
        <StatCard title="Low Stock Items" value={stats.lowStockItems} change={2.4} icon={AlertTriangle} trend="down" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="sales" stroke="#0f766e" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {categoryData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-800">
                    {totalCategoryQty ? Math.round((item.value / totalCategoryQty) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Sales</CardTitle>
            <Badge variant="outline">View All</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.invoice}</TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>{formatCurrency(sale.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={sale.status === "Completed" ? "success" : "warning"}>
                        {sale.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Inventory Alerts</CardTitle>
            <Badge variant="destructive">{lowStockProducts.length + expiringProducts.length} Alerts</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{product.name}</p>
                      <p className="text-xs text-slate-500">Only {product.quantity} units left</p>
                    </div>
                  </div>
                  <Badge variant="destructive">Low Stock</Badge>
                </div>
              ))}
              {expiringProducts.map((product) => (
                <div key={`exp-${product.id}`} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 p-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-warning" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{product.name}</p>
                      <p className="text-xs text-slate-500">Expires in {getDaysUntilExpiry(product.expiry_date)} days</p>
                    </div>
                  </div>
                  <Badge variant="warning">Expiring</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
