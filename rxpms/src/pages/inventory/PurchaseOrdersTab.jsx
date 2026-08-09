import { useState, useEffect } from "react";
import { Plus, Eye, Trash2, RefreshCw, X, ShoppingCart, CheckCircle, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "../../store/appStore";
import api from "../../lib/api";
import { formatCurrency } from "../../lib/utils";

const STATUS_STYLES = {
  draft: { bg: "bg-slate-100", text: "text-slate-600" },
  ordered: { bg: "bg-amber-100", text: "text-amber-600" },
  received: { bg: "bg-green-100", text: "text-green-600" },
  cancelled: { bg: "bg-red-100", text: "text-red-600" },
};

export default function PurchaseOrdersTab() {
  const products = useStore((s) => s.products);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [notification, setNotification] = useState(null);
  const [form, setForm] = useState({ supplier_id: "", expected_date: "", notes: "", items: [{ product_id: "", quantity: 1, unit_cost: 0 }] });
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const fetchOrders = async (p = 1) => {
    try { const res = await api.get("/purchase-orders", { params: { page: p } }); setOrders(res.data.data); setPage(res.data.current_page); setLastPage(res.data.last_page); } catch {} finally { setLoading(false); }
  };

  const fetchSuppliers = async () => { try { const res = await api.get("/suppliers"); setSuppliers(res.data.filter((s) => s.is_active)); } catch {} };

  useEffect(() => { fetchOrders(); fetchSuppliers(); }, []);

  const showNotification = (msg, type = "success") => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 3000); };

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: "", quantity: 1, unit_cost: 0 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, value) => { const items = [...form.items]; items[i] = { ...items[i], [field]: value }; setForm({ ...form, items }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/purchase-orders", form);
      showNotification("Purchase order created");
      setIsDialogOpen(false);
      setForm({ supplier_id: "", expected_date: "", notes: "", items: [{ product_id: "", quantity: 1, unit_cost: 0 }] });
      await fetchOrders(1);
    } catch (err) { showNotification(err.response?.data?.message || "Failed", "error"); }
  };

  const handleStatusChange = async (po, status) => {
    try {
      await api.patch(`/purchase-orders/${po.id}/status`, { status });
      showNotification(`PO ${po.po_number} marked as ${status}`);
      await fetchOrders(page);
      if (status === "received") useStore.getState().fetchProducts();
      setViewOrder(null);
    } catch (err) { showNotification(err.response?.data?.message || "Failed", "error"); }
  };

  const handleDelete = async (po) => {
    try { await api.delete(`/purchase-orders/${po.id}`); showNotification("PO deleted"); await fetchOrders(page); } catch { showNotification("Cannot delete", "error"); }
    setViewOrder(null);
  };

  const formTotal = form.items.reduce((sum, item) => sum + (Number(item.unit_cost) * Number(item.quantity)), 0);

  return (
    <div className="space-y-5">
      {loading && (
        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading orders...
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Purchase Orders</h2>
            <p className="text-xs text-slate-400">{orders.length} orders</p>
          </div>
        </div>
        <button onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition-all active:scale-[0.98]">
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">PO Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => {
                const style = STATUS_STYLES[po.status] || STATUS_STYLES.draft;
                return (
                  <tr key={po.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                          <ShoppingCart className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-slate-800">{po.po_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{po.supplier?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{new Date(po.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                        {po.items?.length || 0} items
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(po.total)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${style.bg} ${style.text}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setViewOrder(po)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors ml-auto">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <ShoppingCart className="mb-3 h-12 w-12 text-slate-200" />
            <p className="font-medium">No purchase orders yet</p>
            <p className="text-xs text-slate-400 mt-1">Create your first purchase order</p>
          </div>
        )}
        {lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-400">Page {page} of {lastPage}</p>
            <div className="flex gap-1.5">
              <button onClick={() => fetchOrders(page - 1)} disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => fetchOrders(page + 1)} disabled={page >= lastPage}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create PO Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsDialogOpen(false)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-800">Create Purchase Order</h2>
              <button onClick={() => setIsDialogOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Supplier</label>
                  <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white">
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Expected Date</label>
                  <input type="date" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Notes</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">Items</label>
                  <button type="button" onClick={addItem}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Product</label>
                      <select value={item.product_id} onChange={(e) => updateItem(i, "product_id", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary bg-white">
                        <option value="">Select</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="w-20 space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Qty</label>
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary bg-white" />
                    </div>
                    <div className="w-24 space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Unit Cost</label>
                      <input type="number" step="0.01" min="0" value={item.unit_cost} onChange={(e) => updateItem(i, "unit_cost", parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary bg-white" />
                    </div>
                    <div className="w-24 space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Subtotal</label>
                      <div className="flex h-[38px] items-center text-sm font-bold text-slate-800">{formatCurrency(item.unit_cost * item.quantity)}</div>
                    </div>
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)}
                        className="flex h-[38px] w-[38px] items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex justify-end text-base font-bold text-slate-800 pt-1">
                  Total: <span className="ml-2 text-primary">{formatCurrency(formTotal)}</span>
                </div>
              </div>
            </form>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 sticky bottom-0 bg-white">
              <button onClick={() => setIsDialogOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition-all">
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View PO Dialog */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewOrder(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-800">{viewOrder.po_number}</h2>
              <button onClick={() => setViewOrder(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Supplier</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{viewOrder.supplier?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Status</p>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_STYLES[viewOrder.status]?.bg} ${STATUS_STYLES[viewOrder.status]?.text}`}>
                    {viewOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Date</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{new Date(viewOrder.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Total</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{formatCurrency(viewOrder.total)}</p>
                </div>
              </div>

              {viewOrder.items?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Items</p>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase">Product</th>
                          <th className="px-3 py-2 text-center text-[10px] font-semibold text-slate-500 uppercase">Qty</th>
                          <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-500 uppercase">Cost</th>
                          <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-500 uppercase">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewOrder.items.map((item) => (
                          <tr key={item.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-3 py-2 font-medium text-slate-800">{item.product_name}</td>
                            <td className="px-3 py-2 text-center text-slate-600">{item.quantity}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{formatCurrency(item.unit_cost)}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-800">{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {viewOrder.status === "draft" && (
                  <button onClick={() => handleStatusChange(viewOrder, "ordered")}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-all">
                    <Package className="h-4 w-4" /> Mark as Ordered
                  </button>
                )}
                {viewOrder.status === "ordered" && (
                  <button onClick={() => handleStatusChange(viewOrder, "received")}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-all">
                    <CheckCircle className="h-4 w-4" /> Mark as Received
                  </button>
                )}
                {viewOrder.status === "draft" && (
                  <button onClick={() => handleDelete(viewOrder)}
                    className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-all ml-auto">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                )}
              </div>
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
