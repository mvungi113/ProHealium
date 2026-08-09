import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Pencil, Trash2, AlertTriangle, Calendar, Package, X, RefreshCw, Eye, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, TrendingUp, TrendingDown } from "lucide-react";
import { useStore } from "../../store/appStore";
import { formatCurrency, formatDate, getDaysUntilExpiry, cn } from "../../lib/utils";
import api from "../../lib/api";
import Pagination from "../../components/ui/Pagination";

const CATEGORIES = ["Pain Relief", "Antibiotics", "Vitamins", "Antihistamines", "Diabetes", "Cardiac", "Skin Care", "Digestive"];
const emptyProduct = { name: "", category: "", sku: "", quantity: 0, unitPrice: 0, expiryDate: "", supplier: "", reorderLevel: 0 };
const toSnakeCase = (form) => ({
  name: form.name, category: form.category, sku: form.sku,
  quantity: Number(form.quantity), unit_price: Number(form.unitPrice),
  expiry_date: form.expiryDate, supplier: form.supplier, reorder_level: Number(form.reorderLevel),
});

const ADJUSTMENT_ICONS = {
  received: { icon: ArrowDownCircle, color: "text-green-600", bg: "bg-green-100" },
  damaged: { icon: ArrowUpCircle, color: "text-red-600", bg: "bg-red-100" },
  expired: { icon: ArrowUpCircle, color: "text-orange-600", bg: "bg-orange-100" },
  correction: { icon: ArrowLeftRight, color: "text-blue-600", bg: "bg-blue-100" },
  return: { icon: ArrowDownCircle, color: "text-purple-600", bg: "bg-purple-100" },
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

function ProductDetails({ product, onClose }) {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("details");

  useEffect(() => {
    const fetchAdjustments = async () => {
      try {
        const res = await api.get("/stock-adjustments", { params: { product_id: product.id, page: 1 } });
        setAdjustments(res.data.data || []);
      } catch {}
      setLoading(false);
    };
    fetchAdjustments();
  }, [product.id]);

  const days = getDaysUntilExpiry(product.expiryDate);
  const isLow = product.quantity > 0 && product.quantity <= product.reorderLevel;
  const isOut = product.quantity <= 0;
  const isExpired = days < 0;
  const isExpiringSoon = days >= 0 && days <= 30;

  const totalReceived = adjustments.filter((a) => a.quantity > 0).reduce((sum, a) => sum + Math.abs(a.quantity), 0);
  const totalRemoved = adjustments.filter((a) => a.quantity < 0).reduce((sum, a) => sum + Math.abs(a.quantity), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{product.name}</h2>
              <p className="text-xs text-slate-400">{product.sku}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-100 px-6 shrink-0">
          {["details", "adjustments", "stats"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-4 py-3 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px",
                tab === t ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
              )}>
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "details" && (
            <div className="space-y-5">
              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                <span className={cn("inline-flex rounded-full px-3 py-1 text-[11px] font-bold",
                  isOut ? "bg-red-100 text-red-600" : isLow ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
                )}>
                  {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                </span>
                <span className={cn("inline-flex rounded-full px-3 py-1 text-[11px] font-bold",
                  isExpired ? "bg-red-100 text-red-600" : isExpiringSoon ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
                )}>
                  {isExpired ? "Expired" : isExpiringSoon ? `Expires in ${days} days` : "Valid"}
                </span>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {product.category}
                </span>
              </div>

              {/* Info grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4 space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Product Info</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Name</span><span className="text-sm font-semibold text-slate-800">{product.name}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-500">SKU</span><span className="text-sm font-mono font-semibold text-slate-800">{product.sku}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Category</span><span className="text-sm font-semibold text-slate-800">{product.category}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Supplier</span><span className="text-sm font-semibold text-slate-800">{product.supplier || "—"}</span></div>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock & Pricing</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Price</span><span className="text-sm font-bold text-primary">{formatCurrency(product.unitPrice)}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Quantity</span><span className={cn("text-sm font-bold", isOut && "text-red-500", isLow && "text-amber-600")}>{product.quantity}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Reorder Level</span><span className="text-sm font-semibold text-slate-800">{product.reorderLevel}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-500">Expiry Date</span><span className="text-sm font-semibold text-slate-800">{formatDate(product.expiryDate)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "adjustments" && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8"><RefreshCw className="h-5 w-5 animate-spin text-slate-400" /></div>
              ) : adjustments.length > 0 ? (
                adjustments.map((a) => {
                  const style = ADJUSTMENT_ICONS[a.type] || ADJUSTMENT_ICONS.correction;
                  const Icon = style.icon;
                  const isPositive = a.quantity > 0;
                  return (
                    <div key={a.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${style.bg} shrink-0`}>
                        <Icon className={`h-4 w-4 ${style.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800 capitalize">{a.type}</span>
                          <span className={cn("text-sm font-bold", isPositive ? "text-green-600" : "text-red-600")}>
                            {isPositive ? "+" : ""}{a.quantity}
                          </span>
                        </div>
                        {a.reason && <p className="text-xs text-slate-400 mt-0.5">{a.reason}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString()}</p>
                        <p className="text-[11px] text-slate-500">{a.user?.name || ""}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <ArrowLeftRight className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                  <p className="text-sm">No adjustments recorded</p>
                </div>
              )}
            </div>
          )}

          {tab === "stats" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-green-50 border border-green-100 p-4 text-center">
                  <TrendingUp className="mx-auto mb-1 h-5 w-5 text-green-500" />
                  <p className="text-2xl font-bold text-green-600">{totalReceived}</p>
                  <p className="text-[11px] font-semibold text-green-500 uppercase">Total Received</p>
                </div>
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-center">
                  <TrendingDown className="mx-auto mb-1 h-5 w-5 text-red-500" />
                  <p className="text-2xl font-bold text-red-600">{totalRemoved}</p>
                  <p className="text-[11px] font-semibold text-red-500 uppercase">Total Removed</p>
                </div>
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
                  <Package className="mx-auto mb-1 h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold text-primary">{product.quantity}</p>
                  <p className="text-[11px] font-semibold text-primary uppercase">Current Stock</p>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Summary</h4>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Total Adjustments</span><span className="font-bold text-slate-800">{adjustments.length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Reorder Level</span><span className="font-bold text-slate-800">{product.reorderLevel}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Stock Value</span><span className="font-bold text-primary">{formatCurrency(product.unitPrice * product.quantity)}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsTab() {
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const deleteProduct = useStore((s) => s.deleteProduct);

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewProduct, setViewProduct] = useState(null);

  const fetchPage = useCallback(async (p = 1, q = "", cat = "All") => {
    setLoading(true);
    try {
      const params = { page: p, per_page: 12 };
      if (q) params.search = q;
      if (cat && cat !== "All") params.category = cat;
      const res = await api.get("/products", { params });
      const items = (res.data.data || res.data).map((p) => ({
        id: p.id, name: p.name, category: p.category, sku: p.sku,
        quantity: p.quantity, unitPrice: Number(p.unit_price),
        expiryDate: p.expiry_date, supplier: p.supplier, reorderLevel: p.reorder_level,
      }));
      setProducts(items);
      setPagination(res.data.meta || null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchPage(1, search, selectedCategory); setPage(1); }, [fetchPage, search, selectedCategory]);

  const categories = ["All", "Pain Relief", "Antibiotics", "Vitamins", "Antihistamines", "Diabetes", "Cardiac", "Skin Care", "Digestive"];

  const showNotification = (msg, type = "success") => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 3000); };
  const openAdd = () => { setEditingProduct(null); setForm(emptyProduct); setIsDialogOpen(true); };
  const openEdit = (p) => { setEditingProduct(p); setForm({ ...p }); setIsDialogOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) { await updateProduct(editingProduct.id, toSnakeCase(form)); showNotification("Product updated successfully"); }
      else { await addProduct(toSnakeCase(form)); showNotification("Product added successfully"); }
      fetchPage(page, search, selectedCategory);
    } catch (err) { showNotification(err.response?.data?.message || "Failed to save product", "error"); }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      try { await deleteProduct(deleteConfirm.id); showNotification("Product deleted"); fetchPage(page, search, selectedCategory); }
      catch { showNotification("Failed to delete", "error"); }
      setDeleteConfirm(null);
    }
  };

  const handlePageChange = (newPage) => { setPage(newPage); fetchPage(newPage, search, selectedCategory); };

  const lowStock = products.filter((p) => p.quantity <= p.reorderLevel && p.quantity > 0).length;
  const outOfStock = products.filter((p) => p.quantity <= 0).length;
  const expiringSoon = products.filter((p) => { const d = getDaysUntilExpiry(p.expiryDate); return d >= 0 && d <= 90; }).length;

  return (
    <div className="space-y-5">
      {loading && (
        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading products...
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Total Products" value={products.length} bgColor="bg-primary/10" color="text-primary" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={lowStock} bgColor="bg-amber-50" color="text-amber-600" />
        <StatCard icon={X} label="Out of Stock" value={outOfStock} bgColor="bg-red-50" color="text-red-600" />
        <StatCard icon={Calendar} label="Expiring Soon" value={expiringSoon} bgColor="bg-orange-50" color="text-orange-600" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {categories.map((c) => (
              <button key={c} onClick={() => setSelectedCategory(c)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  selectedCategory === c
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition-all active:scale-[0.98]">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const days = getDaysUntilExpiry(product.expiryDate);
                const isLow = product.quantity > 0 && product.quantity <= product.reorderLevel;
                const isOut = product.quantity <= 0;
                const isExpired = days < 0;
                const isExpiringSoon = days >= 0 && days <= 30;

                return (
                  <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                          <Package className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-slate-800">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{product.sku}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(product.unitPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-bold", isOut && "text-red-500", isLow && "text-amber-600", !isOut && !isLow && "text-slate-800")}>
                        {product.quantity}
                      </span>
                      {isLow && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />}
                      {isOut && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-red-500" />}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm text-slate-600">{formatDate(product.expiryDate)}</span>
                        <span className={cn("ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold",
                          isExpired ? "bg-red-100 text-red-600" : isExpiringSoon ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
                        )}>
                          {isExpired ? "Expired" : isExpiringSoon ? `${days}d left` : "Good"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                        isOut ? "bg-red-100 text-red-600" : isLow ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
                      )}>
                        {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setViewProduct(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Package className="mb-3 h-12 w-12 text-slate-200" />
            <p className="font-medium">No products found</p>
            <p className="text-xs text-slate-400 mt-1">Try a different search or add a new product</p>
          </div>
        )}
        <div className="px-4">
          <Pagination meta={pagination} onPageChange={handlePageChange} />
        </div>
      </div>

      {/* Product Details Modal */}
      {viewProduct && <ProductDetails product={viewProduct} onClose={() => setViewProduct(null)} />}

      {/* Add/Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsDialogOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-800">{editingProduct ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setIsDialogOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white">
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">SKU *</label>
                <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Quantity *</label>
                <input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Unit Price *</label>
                <input type="number" step="0.01" min="0" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })} required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Reorder Level *</label>
                <input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: parseInt(e.target.value) || 0 })} required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Expiry Date *</label>
                <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Supplier</label>
                <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
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
                {editingProduct ? "Update" : "Add"} Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-center text-lg font-bold text-slate-800">Delete Product</h3>
            <p className="mt-2 text-center text-sm text-slate-500">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">
                Delete
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
