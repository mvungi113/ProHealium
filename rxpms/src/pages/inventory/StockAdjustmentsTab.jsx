import { useState, useEffect } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle, RefreshCw, X, ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "../../store/appStore";
import api from "../../lib/api";

const ADJUSTMENT_TYPES = [
  { value: "received", label: "Received", icon: ArrowDownCircle, color: "text-green-600", bg: "bg-green-100" },
  { value: "damaged", label: "Damaged", icon: ArrowUpCircle, color: "text-red-600", bg: "bg-red-100" },
  { value: "expired", label: "Expired", icon: ArrowUpCircle, color: "text-orange-600", bg: "bg-orange-100" },
  { value: "correction", label: "Correction", icon: ArrowLeftRight, color: "text-blue-600", bg: "bg-blue-100" },
  { value: "return", label: "Customer Return", icon: ArrowDownCircle, color: "text-purple-600", bg: "bg-purple-100" },
];

export default function StockAdjustmentsTab() {
  const products = useStore((s) => s.products);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [form, setForm] = useState({ product_id: "", type: "received", quantity: 1, reason: "", reference: "" });
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const fetchAdjustments = async (p = 1) => {
    try { const res = await api.get("/stock-adjustments", { params: { page: p } }); setAdjustments(res.data.data); setPage(res.data.current_page); setLastPage(res.data.last_page); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAdjustments(); }, []);

  const showNotification = (msg, type = "success") => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/stock-adjustments", { ...form, quantity: Number(form.quantity) });
      showNotification("Stock adjustment recorded");
      setIsDialogOpen(false);
      setForm({ product_id: "", type: "received", quantity: 1, reason: "", reference: "" });
      await fetchAdjustments(1);
      useStore.getState().fetchProducts();
    } catch (err) { showNotification(err.response?.data?.message || "Failed", "error"); }
  };

  const getTypeInfo = (type) => ADJUSTMENT_TYPES.find((t) => t.value === type) || ADJUSTMENT_TYPES[0];

  return (
    <div className="space-y-5">
      {loading && (
        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading adjustments...
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Stock Adjustments</h2>
            <p className="text-xs text-slate-400">Track inventory changes</p>
          </div>
        </div>
        <button onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition-all active:scale-[0.98]">
          <Plus className="h-4 w-4" /> New Adjustment
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((a) => {
                const info = getTypeInfo(a.type);
                const isPositive = a.quantity > 0;
                const Icon = info.icon;
                return (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{a.product?.name || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${info.bg} ${info.color}`}>
                        <Icon className="h-3 w-3" /> {info.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                      {isPositive ? "+" : ""}{a.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{a.reason || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{a.reference || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{a.user?.name || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {adjustments.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <ArrowLeftRight className="mb-3 h-12 w-12 text-slate-200" />
            <p className="font-medium">No adjustments yet</p>
            <p className="text-xs text-slate-400 mt-1">Record your first stock adjustment</p>
          </div>
        )}
        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-400">Page {page} of {lastPage}</p>
            <div className="flex gap-1.5">
              <button onClick={() => fetchAdjustments(page - 1)} disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => fetchAdjustments(page + 1)} disabled={page >= lastPage}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsDialogOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-800">New Stock Adjustment</h2>
              <button onClick={() => setIsDialogOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 px-6 py-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Product *</label>
                <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white">
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Type *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white">
                  {ADJUSTMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Quantity *</label>
                <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Reason</label>
                <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Physical count, damaged in transit"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Reference</label>
                <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. PO number, invoice"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
            </form>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button onClick={() => setIsDialogOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition-all">
                Record Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-white shadow-xl ${notification.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          <span className="font-medium text-sm">{notification.msg}</span>
          <button onClick={() => setNotification(null)}><X className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}
