import { useState, useEffect } from "react";
import { Eye, Search, CheckCircle, AlertTriangle, Printer, X, FileText, Filter, RefreshCw, DollarSign, ShoppingCart, Clock } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent } from "../components/ui/Card";
import Pagination from "../components/ui/Pagination";
import api from "../lib/api";

function ReceiptDetailModal({ receipt, onClose, taxRate = 10 }) {
  if (!receipt) return null;
  const taxMultiplier = taxRate / 100;

  const handlePrint = () => {
    const items = (receipt.sale_items || receipt.saleItems || receipt.items || [])
      .map(
        (item) => `
      <div class="receipt-item">
        <div class="receipt-item-name">${item.product_name || item.name}</div>
        <div class="receipt-item-detail">${item.quantity} x $${Number(item.unit_price || item.unitPrice).toFixed(2)} = $${Number(item.subtotal).toFixed(2)}</div>
      </div>`
      )
      .join("");

    const subtotal = Number(receipt.amount || receipt.total || 0) / (1 + taxMultiplier);
    const tax = Number(receipt.amount || receipt.total || 0) - subtotal;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${receipt.invoice}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .receipt { width: 80mm; font-family: "Courier New", monospace; font-size: 10pt; line-height: 1.3; padding: 2mm; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 2mm; }
  .name { font-size: 13pt; font-weight: 700; }
  .sub { font-size: 8pt; color: #444; }
  .divider { text-align: center; margin: 2mm 0; white-space: pre; font-size: 8pt; }
  .row { display: flex; justify-content: space-between; }
  .item-name { font-weight: 600; }
  .item-detail { text-align: right; font-size: 8pt; }
  .total { font-size: 11pt; font-weight: 700; padding: 2mm 0; }
  .footer { text-align: center; margin-top: 4mm; font-size: 8pt; }
  @media print { @page { size: 80mm auto; margin: 2mm; } .receipt { width: 100%; max-width: 80mm; } }
</style></head><body>
<div class="receipt">
  <div class="header"><div class="name">ProHealium Pharmacy</div><div class="sub">Your Health, Our Priority</div></div>
  <div class="divider">================================</div>
  <div class="row"><span>Invoice:</span><span>${receipt.invoice}</span></div>
  <div class="row"><span>Date:</span><span>${new Date(receipt.created_at || receipt.date).toLocaleDateString()}</span></div>
  <div class="row"><span>Time:</span><span>${new Date(receipt.created_at || receipt.date).toLocaleTimeString()}</span></div>
  <div class="row"><span>Cashier:</span><span>${receipt.user?.name || "Admin"}</span></div>
  <div class="row"><span>Customer:</span><span>${receipt.customer}</span></div>
  <div class="divider">--------------------------------</div>
  <div style="display:flex;justify-content:space-between;font-weight:700;margin-bottom:2mm"><span>Item</span><span>Qty  Price   Total</span></div>
  ${items}
  <div class="divider">--------------------------------</div>
  <div class="row"><span>Subtotal:</span><span>$${subtotal.toFixed(2)}</span></div>
  <div class="row"><span>Tax (${taxRate}%):</span><span>$${tax.toFixed(2)}</span></div>
  <div class="divider">================================</div>
  <div class="row total"><span>TOTAL:</span><span>$${Number(receipt.amount || receipt.total).toFixed(2)}</span></div>
  <div class="divider">================================</div>
  <div class="row"><span>Payment:</span><span>${(receipt.payment_method || receipt.paymentMethod || "cash").toUpperCase()}</span></div>
  <div class="divider">--------------------------------</div>
  <div class="footer"><div>Thank you for your purchase!</div><div>Please keep this receipt.</div></div>
</div>
</body></html>`;

    const w = window.open("", "_blank", "width=400,height=600");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 300);
    }
  };

  const saleItems = receipt.sale_items || receipt.saleItems || receipt.items || [];
  const subtotal = Number(receipt.amount || receipt.total || 0) / (1 + taxMultiplier);
  const tax = Number(receipt.amount || receipt.total || 0) - subtotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white shadow-2xl rounded-xl max-h-[90vh] overflow-hidden flex flex-col w-[400px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <span className="font-semibold text-sm text-slate-800">Receipt Preview</span>
              <p className="text-[11px] text-slate-400">{receipt.invoice}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mx-auto max-w-[286px] space-y-3 font-mono text-[13px]">
            <div className="text-center">
              <p className="text-sm font-bold">ProHealium Pharmacy</p>
              <p className="text-[10px] text-slate-500">Your Health, Our Priority</p>
            </div>
            <div className="text-center text-[10px] text-slate-400">================================</div>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Invoice:</span><span className="font-medium">{receipt.invoice}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date:</span><span>{new Date(receipt.created_at || receipt.date).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Time:</span><span>{new Date(receipt.created_at || receipt.date).toLocaleTimeString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Cashier:</span><span>{receipt.user?.name || "Admin"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Customer:</span><span>{receipt.customer}</span></div>
            </div>
            <div className="text-center text-[10px] text-slate-400">--------------------------------</div>
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span>Item</span><span>Qty x Price = Total</span>
            </div>
            {saleItems.map((item, i) => (
              <div key={i} className="space-y-0.5">
                <div className="font-semibold">{item.product_name || item.name}</div>
                <div className="text-right text-[10px] text-slate-500">
                  {item.quantity} x {formatCurrency(item.unit_price || item.unitPrice)} = {formatCurrency(item.subtotal)}
                </div>
              </div>
            ))}
            <div className="text-center text-[10px] text-slate-400">--------------------------------</div>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tax ({taxRate}%):</span><span>{formatCurrency(tax)}</span></div>
              <div className="text-center text-[10px] text-slate-400">================================</div>
              <div className="flex justify-between text-[15px] font-bold"><span>TOTAL:</span><span>{formatCurrency(receipt.amount || receipt.total)}</span></div>
              <div className="text-center text-[10px] text-slate-400">================================</div>
              <div className="flex justify-between"><span className="text-slate-500">Payment:</span><span className="font-medium">{(receipt.payment_method || receipt.paymentMethod || "cash").toUpperCase()}</span></div>
            </div>
            <div className="text-center text-[10px] text-slate-400">--------------------------------</div>
            <div className="text-center text-[10px] text-slate-500">
              <p>Thank you for your purchase!</p>
              <p>Please keep this receipt.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-200 px-5 py-3.5">
          <button
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Receipts() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [taxRate, setTaxRate] = useState(10);

  const fetchSales = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/sales?page=${pageNum}`);
      setSales(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch {
      setSales([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(page);
    api.get("/settings").then((res) => {
      if (res.data.tax_rate) setTaxRate(parseFloat(res.data.tax_rate));
    }).catch(() => {});
  }, [page]);

  const filtered = sales.filter((sale) => {
    const q = search.toLowerCase();
    const matchSearch = !q || sale.invoice?.toLowerCase().includes(q) || sale.customer?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || sale.status === statusFilter;
    const matchPayment = paymentFilter === "all" || sale.payment_method === paymentFilter;
    return matchSearch && matchStatus && matchPayment;
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.amount), 0);
  const completedCount = filtered.filter((s) => s.status === "Completed").length;
  const refundedCount = filtered.filter((s) => s.status === "Refunded").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Receipts</h1>
          <p className="text-[13px] text-slate-500">View and manage all sales receipts</p>
        </div>
        <button
          onClick={() => fetchSales(page)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="mt-3 text-xl font-bold text-slate-800">{filtered.length}</p>
            <p className="text-xs text-slate-500 mt-1">Total Receipts</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                <DollarSign className="h-5 w-5 text-teal-600" />
              </div>
            </div>
            <p className="mt-3 text-xl font-bold text-slate-800">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-slate-500 mt-1">Total Revenue</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="mt-3 text-xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-slate-500 mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="mt-3 text-xl font-bold text-amber-600">{refundedCount}</p>
            <p className="text-xs text-slate-500 mt-1">Refunded</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search by invoice or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="all">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Refunded">Refunded</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="all">All Payment</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-4">
                <FileText className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">No receipts found</p>
              <p className="text-xs text-slate-400 mt-1">
                {search || statusFilter !== "all" || paymentFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Sales receipts will appear here after completing a sale"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Invoice</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Payment</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sale) => (
                    <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{sale.invoice}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-[13px]">
                            {new Date(sale.created_at).toLocaleDateString()}{" "}
                            <span className="text-slate-400">
                              {new Date(sale.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{sale.customer}</td>
                      <td className="px-4 py-3 text-slate-600">{sale.items}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="capitalize">
                          {sale.payment_method}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        {formatCurrency(sale.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={sale.status === "Completed" ? "success" : sale.status === "Refunded" ? "warning" : "destructive"}>
                          {sale.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedReceipt(sale)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {meta && meta.last_page > 1 && (
        <Pagination meta={meta} onPageChange={setPage} />
      )}

      {selectedReceipt && (
        <ReceiptDetailModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} taxRate={taxRate} />
      )}
    </div>
  );
}
