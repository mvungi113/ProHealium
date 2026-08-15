import { useState, useEffect } from "react";
import { RotateCcw, RefreshCw, X, Search, DollarSign, Clock, CheckCircle, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import api from "../lib/api";
import { formatCurrency, cn } from "../lib/utils";

const STATUS_STYLES = {
  pending: { bg: "bg-amber-100", text: "text-amber-600", icon: Clock },
  completed: { bg: "bg-green-100", text: "text-green-600", icon: CheckCircle },
  rejected: { bg: "bg-red-100", text: "text-red-600", icon: AlertCircle },
};

function StatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgColor}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [reason, setReason] = useState("");
  const [returnItems, setReturnItems] = useState([]);
  const [notification, setNotification] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [viewReturn, setViewReturn] = useState(null);
  const [saleSearch, setSaleSearch] = useState("");

  const fetchReturns = async (p = 1) => {
    try { const res = await api.get("/sale-returns", { params: { page: p } }); setReturns(res.data.data || []); setPage(res.data.meta?.current_page || 1); setLastPage(res.data.meta?.last_page || 1); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchReturns(); }, []);

  const showNotification = (msg, type = "success") => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 3000); };

  const openNewReturn = async () => {
    try {
      const res = await api.get("/sales", { params: { per_page: 100 } });
      setSales(res.data.data || []);
    } catch {}
    setSelectedSale(null);
    setReason("");
    setReturnItems([]);
    setSaleSearch("");
    setIsDialogOpen(true);
  };

  const handleSaleSelect = (saleId) => {
    const sale = sales.find((s) => String(s.id) === String(saleId));
    setSelectedSale(sale);
    setReturnItems(sale ? sale.sale_items.map((item) => ({ ...item, return_qty: 0 })) : []);
  };

  const handleSubmit = async () => {
    if (!selectedSale || !reason || returnItems.filter((i) => i.return_qty > 0).length === 0) {
      showNotification("Please select a sale, items, and reason", "error");
      return;
    }
    try {
      await api.post("/sale-returns", {
        sale_id: selectedSale.id,
        reason,
        items: returnItems.filter((i) => i.return_qty > 0).map((i) => ({ sale_item_id: i.id, quantity: i.return_qty })),
      });
      showNotification("Return processed successfully");
      setIsDialogOpen(false);
      await fetchReturns(1);
    } catch (err) { showNotification(err.response?.data?.message || "Failed", "error"); }
  };

  const filteredSales = sales.filter((s) => {
    if (!saleSearch) return true;
    const q = saleSearch.toLowerCase();
    return s.invoice?.toLowerCase().includes(q) || s.customer?.toLowerCase().includes(q);
  });

  const totalRefund = returns.reduce((sum, r) => sum + Number(r.refund_amount), 0);
  const pendingCount = returns.filter((r) => r.status === "pending").length;
  const completedCount = returns.filter((r) => r.status === "completed").length;

  return (
    <div className="space-y-5">
      {loading && (
        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading returns...
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Returns & Refunds</h1>
        <p className="text-[13px] text-slate-500">Process product returns and issue refunds.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={RotateCcw} label="Total Returns" value={returns.length} bgColor="bg-primary/10" color="text-primary" />
        <StatCard icon={DollarSign} label="Total Refunded" value={formatCurrency(totalRefund)} bgColor="bg-red-50" color="text-red-600" />
        <StatCard icon={Clock} label="Pending" value={pendingCount} bgColor="bg-amber-50" color="text-amber-600" />
        <StatCard icon={CheckCircle} label="Completed" value={completedCount} bgColor="bg-green-50" color="text-green-600" />
      </div>

      {/* Toolbar */}
      <div className="flex justify-end">
        <button onClick={openNewReturn}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition-all active:scale-[0.98]">
          <RotateCcw className="h-4 w-4" /> New Return
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Return #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Sale</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Refund</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => {
                const style = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
                const StatusIcon = style.icon;
                return (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                          <RotateCcw className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-slate-800">{r.return_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.sale?.invoice || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(r.refund_amount)}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">{r.reason}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${style.bg} ${style.text}`}>
                        <StatusIcon className="h-3 w-3" /> {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setViewReturn(r)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {returns.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <RotateCcw className="mb-3 h-12 w-12 text-slate-200" />
            <p className="font-medium">No returns yet</p>
            <p className="text-xs text-slate-400 mt-1">Process your first return</p>
          </div>
        )}
        {lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-400">Page {page} of {lastPage}</p>
            <div className="flex gap-1.5">
              <button onClick={() => fetchReturns(page - 1)} disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => fetchReturns(page + 1)} disabled={page >= lastPage}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Return Modal */}
      {viewReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewReturn(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{viewReturn.return_number}</h2>
                  <p className="text-xs text-slate-400">{new Date(viewReturn.created_at).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => setViewReturn(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Sale Invoice</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{viewReturn.sale?.invoice || "—"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Refund Amount</p>
                  <p className="text-sm font-bold text-red-600 mt-0.5">{formatCurrency(viewReturn.refund_amount)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Status</p>
                  {(() => { const s = STATUS_STYLES[viewReturn.status] || STATUS_STYLES.pending; const I = s.icon; return (
                    <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${s.bg} ${s.text}`}><I className="h-3 w-3" /> {viewReturn.status}</span>
                  ); })()}
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Processed By</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{viewReturn.user?.name || "—"}</p>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Reason</p>
                <p className="text-sm text-slate-700 mt-1">{viewReturn.reason}</p>
              </div>
              {viewReturn.items?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Returned Items</p>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase">Product</th>
                          <th className="px-3 py-2 text-center text-[10px] font-semibold text-slate-500 uppercase">Qty</th>
                          <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-500 uppercase">Refund</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewReturn.items.map((item) => (
                          <tr key={item.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-3 py-2 font-medium text-slate-800">{item.product_name}</td>
                            <td className="px-3 py-2 text-center text-slate-600">{item.quantity}</td>
                            <td className="px-3 py-2 text-right font-bold text-red-600">{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Return Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsDialogOpen(false)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-800">New Return</h2>
              <button onClick={() => setIsDialogOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 px-6 py-5">
              {/* Sale Search */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Select Sale *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    placeholder="Search by invoice or customer..."
                    value={selectedSale ? `${selectedSale.invoice} - ${selectedSale.customer}` : saleSearch}
                    onChange={(e) => { setSaleSearch(e.target.value); setSelectedSale(null); setReturnItems([]); }}
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                {saleSearch && !selectedSale && filteredSales.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {filteredSales.map((s) => (
                      <button key={s.id} onClick={() => { handleSaleSelect(s.id); setSaleSearch(""); }}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                        <div>
                          <span className="font-semibold text-slate-800">{s.invoice}</span>
                          <span className="ml-2 text-slate-400">{s.customer}</span>
                        </div>
                        <span className="font-bold text-slate-600">{formatCurrency(s.amount)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Reason *</label>
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this being returned?"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>

              {selectedSale && returnItems.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">Select items to return</label>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase">Product</th>
                          <th className="px-3 py-2 text-center text-[10px] font-semibold text-slate-500 uppercase">Sold</th>
                          <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-500 uppercase">Price</th>
                          <th className="px-3 py-2 text-center text-[10px] font-semibold text-slate-500 uppercase">Return Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnItems.map((item, i) => (
                          <tr key={item.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-3 py-2 font-medium text-slate-800">{item.product_name}</td>
                            <td className="px-3 py-2 text-center text-slate-600">{item.quantity}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                            <td className="px-3 py-2 text-center">
                              <input type="number" min="0" max={item.quantity} value={item.return_qty}
                                onChange={(e) => { const updated = [...returnItems]; updated[i].return_qty = parseInt(e.target.value) || 0; setReturnItems(updated); }}
                                className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm outline-none focus:border-primary" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end text-sm font-bold text-slate-800">
                    Refund: <span className="ml-2 text-red-600">{formatCurrency(returnItems.reduce((sum, i) => sum + (i.return_qty * Number(i.unit_price)), 0))}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 sticky bottom-0 bg-white">
              <button onClick={() => setIsDialogOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition-all">
                Process Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={cn("fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-white shadow-xl",
          notification.type === "success" ? "bg-emerald-600" : "bg-red-600"
        )}>
          <span className="font-medium text-sm">{notification.msg}</span>
          <button onClick={() => setNotification(null)}><X className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}
