import { useState, useEffect } from "react";
import { BarChart3, Download, RefreshCw, TrendingUp, Package, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import api from "../lib/api";
import { formatCurrency, cn } from "../lib/utils";

const COLORS = ["#0f766e", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#ccfbf1"];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("sales");
  const [from, setFrom] = useState(new Date(new Date().setDate(1)).toISOString().split("T")[0]);
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "sales" ? "/reports/sales" : activeTab === "financial" ? "/reports/financial" : "/reports/inventory";
      const params = activeTab !== "inventory" ? { from, to } : {};
      const res = await api.get(endpoint, { params });
      setData(res.data);
    } catch { setData(null); } finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [activeTab]);

  const tabs = [["sales", "Sales", TrendingUp], ["inventory", "Inventory", Package], ["financial", "Financial", DollarSign]];

  const formatDateRange = () => {
    const f = new Date(from + "T00:00:00");
    const t = new Date(to + "T00:00:00");
    return `${f.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${t.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-xl font-bold text-slate-800">Reports</h1><p className="text-[13px] text-slate-500">Analyze sales, inventory, and financial data.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}><Download className="mr-2 h-4 w-4" /> Print</Button>
        </div>
      </div>

      <div className="flex gap-2">
        {tabs.map(([val, label, Icon]) => (
          <button key={val} onClick={() => setActiveTab(val)} className={cn("flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors", activeTab === val ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {activeTab !== "inventory" && (
        <Card><CardContent className="p-4"><div className="flex items-end gap-4">
          <div className="space-y-1"><Label className="text-xs">From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" /></div>
          <div className="space-y-1"><Label className="text-xs">To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" /></div>
          <Button onClick={fetchReport}>Generate</Button>
          <span className="ml-auto text-sm text-slate-500">{formatDateRange()}</span>
        </div></CardContent></Card>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !data ? (
        <div className="flex h-64 items-center justify-center text-slate-400">No data available for this period.</div>
      ) : activeTab === "sales" ? (
        <SalesReport data={data} />
      ) : activeTab === "financial" ? (
        <FinancialReport data={data} />
      ) : (
        <InventoryReport data={data} />
      )}
    </div>
  );
}

function SalesReport({ data }) {
  const { summary, top_products, daily_sales, payment_breakdown, category_breakdown } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Total Revenue</p><p className="text-xl font-bold text-slate-800">{formatCurrency(summary.total_sales)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Total Orders</p><p className="text-xl font-bold text-slate-800">{summary.total_orders}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Avg Order Value</p><p className="text-xl font-bold text-slate-800">{formatCurrency(summary.avg_order)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Total Items Sold</p><p className="text-xl font-bold text-slate-800">{summary.total_items}</p></CardContent></Card>
      </div>

      {daily_sales?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Daily Sales Trend</CardTitle></CardHeader>
          <CardContent><div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily_sales}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="date" stroke="#94a3b8" fontSize={12} /><YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} /><Tooltip formatter={(v) => formatCurrency(v)} /><Bar dataKey="revenue" name="Revenue" fill="#0f766e" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div></CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {payment_breakdown && (
          <Card>
            <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(payment_breakdown).map(([method, amount], i) => (
                  <div key={method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium capitalize">{method}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">{((amount / (summary.total_sales || 1)) * 100).toFixed(0)}%</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {category_breakdown?.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Sales by Category</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Orders</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                <TableBody>{category_breakdown.map((c) => (
                  <TableRow key={c.category}><TableCell className="font-medium">{c.category}</TableCell><TableCell>{c.orders}</TableCell><TableCell className="text-right">{formatCurrency(c.revenue)}</TableCell></TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {top_products?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Top Selling Products</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Product</TableHead><TableHead>Qty Sold</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
              <TableBody>{top_products.map((p, i) => (
                <TableRow key={p.product_name}>
                  <TableCell className="text-slate-400">{i + 1}</TableCell>
                  <TableCell className="font-medium">{p.product_name}</TableCell>
                  <TableCell>{p.total_qty}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(p.total_revenue)}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FinancialReport({ data }) {
  const { revenue, orders, cash_sales, card_sales, daily, refunds, net_revenue } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Gross Revenue</p><p className="text-xl font-bold">{formatCurrency(revenue)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Refunds</p><p className="text-xl font-bold text-red-600">-{formatCurrency(refunds || 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Net Revenue</p><p className="text-xl font-bold text-green-600">{formatCurrency(net_revenue || revenue)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Cash Sales</p><p className="text-xl font-bold">{formatCurrency(cash_sales)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Card Sales</p><p className="text-xl font-bold">{formatCurrency(card_sales)}</p></CardContent></Card>
      </div>

      {daily?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Daily Revenue</CardTitle></CardHeader>
          <CardContent><div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} />
                <Tooltip formatter={(v, name) => name === "revenue" ? formatCurrency(v) : v} />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div></CardContent>
        </Card>
      )}

      {daily?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Daily Breakdown</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Orders</TableHead><TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Avg Order</TableHead></TableRow></TableHeader>
              <TableBody>{daily.map((d) => (
                <TableRow key={d.date}>
                  <TableCell className="font-medium">{d.date}</TableCell>
                  <TableCell>{d.orders}</TableCell>
                  <TableCell className="text-right">{formatCurrency(d.revenue)}</TableCell>
                  <TableCell className="text-right text-slate-500">{d.orders > 0 ? formatCurrency(d.revenue / d.orders) : "—"}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InventoryReport({ data }) {
  const { total_products, total_value, low_stock_count, out_of_stock_count, expiring_soon_count, category_breakdown, low_stock_products, expiring_products } = data;

  const categoryData = category_breakdown ? Object.entries(category_breakdown).map(([name, info]) => ({ name, count: info.count, value: info.value })) : [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Total Products</p><p className="text-xl font-bold">{total_products}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Inventory Value</p><p className="text-xl font-bold">{formatCurrency(total_value)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Low Stock</p><p className="text-xl font-bold text-amber-600">{low_stock_count}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Out of Stock</p><p className="text-xl font-bold text-red-600">{out_of_stock_count}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Expiring Soon</p><p className="text-xl font-bold text-orange-600">{expiring_soon_count}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {categoryData.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Category Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <YAxis dataKey="name" type="category" width={120} stroke="#94a3b8" fontSize={11} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="value" name="Value" fill="#0f766e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Category Details</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Products</TableHead><TableHead className="text-right">Value</TableHead></TableRow></TableHeader>
              <TableBody>{categoryData.map((c) => (
                <TableRow key={c.name}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.count}</TableCell><TableCell className="text-right">{formatCurrency(c.value)}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {low_stock_products?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Badge variant="warning">Low Stock</Badge> Products Needing Reorder</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Stock</TableHead><TableHead>Reorder Level</TableHead></TableRow></TableHeader>
              <TableBody>{low_stock_products.map((p) => (
                <TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-slate-500">{p.sku}</TableCell><TableCell className="text-amber-600 font-medium">{p.quantity}</TableCell><TableCell>{p.reorder_level}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {expiring_products?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Badge variant="destructive">Expiring</Badge> Products Expiring Within 90 Days</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Stock</TableHead><TableHead>Expiry Date</TableHead></TableRow></TableHeader>
              <TableBody>{expiring_products.map((p) => (
                <TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-slate-500">{p.sku}</TableCell><TableCell>{p.quantity}</TableCell><TableCell className="text-red-600">{p.expiry_date}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
