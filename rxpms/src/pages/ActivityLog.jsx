import { useEffect, useState } from "react";
import { RefreshCw, Search, User, Package, ShoppingCart, Users, Truck, ArrowLeftRight, RotateCcw, LogIn, LogOut, Settings, ShoppingCart as PO, Tag } from "lucide-react";
import api from "../lib/api";
import { cn } from "../lib/utils";

const ACTION_CONFIG = {
  login: { label: "Login", icon: LogIn, color: "text-blue-600", bg: "bg-blue-100", category: "auth" },
  logout: { label: "Logout", icon: LogOut, color: "text-slate-500", bg: "bg-slate-100", category: "auth" },
  product_created: { label: "Product Created", icon: Package, color: "text-green-600", bg: "bg-green-100", category: "product" },
  product_updated: { label: "Product Updated", icon: Package, color: "text-amber-600", bg: "bg-amber-100", category: "product" },
  product_deleted: { label: "Product Deleted", icon: Package, color: "text-red-600", bg: "bg-red-100", category: "product" },
  sale_created: { label: "Sale Created", icon: ShoppingCart, color: "text-green-600", bg: "bg-green-100", category: "sale" },
  sale_updated: { label: "Sale Updated", icon: ShoppingCart, color: "text-amber-600", bg: "bg-amber-100", category: "sale" },
  sale_deleted: { label: "Sale Deleted", icon: ShoppingCart, color: "text-red-600", bg: "bg-red-100", category: "sale" },
  user_created: { label: "User Created", icon: Users, color: "text-green-600", bg: "bg-green-100", category: "user" },
  user_updated: { label: "User Updated", icon: Users, color: "text-amber-600", bg: "bg-amber-100", category: "user" },
  user_deleted: { label: "User Deleted", icon: Users, color: "text-red-600", bg: "bg-red-100", category: "user" },
  category_created: { label: "Category Created", icon: Tag, color: "text-green-600", bg: "bg-green-100", category: "category" },
  category_updated: { label: "Category Updated", icon: Tag, color: "text-amber-600", bg: "bg-amber-100", category: "category" },
  category_deleted: { label: "Category Deleted", icon: Tag, color: "text-red-600", bg: "bg-red-100", category: "category" },
  customer_created: { label: "Customer Created", icon: User, color: "text-green-600", bg: "bg-green-100", category: "customer" },
  customer_updated: { label: "Customer Updated", icon: User, color: "text-amber-600", bg: "bg-amber-100", category: "customer" },
  customer_deleted: { label: "Customer Deleted", icon: User, color: "text-red-600", bg: "bg-red-100", category: "customer" },
  supplier_created: { label: "Supplier Created", icon: Truck, color: "text-green-600", bg: "bg-green-100", category: "supplier" },
  supplier_updated: { label: "Supplier Updated", icon: Truck, color: "text-amber-600", bg: "bg-amber-100", category: "supplier" },
  supplier_deleted: { label: "Supplier Deleted", icon: Truck, color: "text-red-600", bg: "bg-red-100", category: "supplier" },
  po_created: { label: "PO Created", icon: PO, color: "text-green-600", bg: "bg-green-100", category: "purchase" },
  po_status_updated: { label: "PO Updated", icon: PO, color: "text-amber-600", bg: "bg-amber-100", category: "purchase" },
  po_deleted: { label: "PO Deleted", icon: PO, color: "text-red-600", bg: "bg-red-100", category: "purchase" },
  stock_adjusted: { label: "Stock Adjusted", icon: ArrowLeftRight, color: "text-blue-600", bg: "bg-blue-100", category: "stock" },
  return_created: { label: "Return Created", icon: RotateCcw, color: "text-orange-600", bg: "bg-orange-100", category: "return" },
};

const CATEGORY_FILTERS = [
  { id: "", label: "All", icon: Settings },
  { id: "auth", label: "Auth", icon: LogIn },
  { id: "product", label: "Products", icon: Package },
  { id: "sale", label: "Sales", icon: ShoppingCart },
  { id: "customer", label: "Customers", icon: User },
  { id: "supplier", label: "Suppliers", icon: Truck },
  { id: "purchase", label: "Orders", icon: PO },
  { id: "stock", label: "Stock", icon: ArrowLeftRight },
  { id: "return", label: "Returns", icon: RotateCcw },
  { id: "user", label: "Users", icon: Users },
];

export default function ActivityLog() {
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p };
      if (search) params.search = search;
      const response = await api.get("/activity-logs", { params });
      setLogs(response.data.data);
      setPage(response.data.current_page);
      setLastPage(response.data.last_page);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(1); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const getActionConfig = (action) => ACTION_CONFIG[action] || { label: action.replace(/_/g, " "), icon: Settings, color: "text-slate-500", bg: "bg-slate-100", category: "" };

  const filteredLogs = logs?.filter((log) => {
    if (!categoryFilter) return true;
    const config = getActionConfig(log.action);
    return config.category === categoryFilter;
  }) || [];

  const getChangesSummary = (log) => {
    if (!log.old_values && !log.new_values) return null;
    if (log.action.includes("deleted")) return null;
    const changes = [];
    if (log.new_values) {
      const keys = Object.keys(log.new_values).filter((k) => !["id", "created_at", "updated_at", "password"].includes(k));
      for (const key of keys.slice(0, 2)) {
        const val = log.new_values[key];
        if (val !== null && val !== undefined && val !== "") {
          changes.push(`${key}: ${val}`);
        }
      }
    }
    return changes.length > 0 ? changes.join(" · ") : null;
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Activity Log</h1>
        <p className="text-[13px] text-slate-500">Track all actions performed on the system.</p>
      </div>

      {/* Category Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORY_FILTERS.map((cat) => {
          const Icon = cat.icon;
          return (
            <button key={cat.id} onClick={() => setCategoryFilter(cat.id)}
              className={cn("flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                categoryFilter === cat.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
              )}>
              <Icon className="h-3.5 w-3.5" /> {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search activity logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <button type="submit"
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition-all">
          Search
        </button>
      </form>

      {/* Timeline */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const config = getActionConfig(log.action);
              const Icon = config.icon;
              const changes = getChangesSummary(log);
              return (
                <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                  {/* Icon */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{log.user?.name || "System"}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{log.description}</p>
                    {changes && (
                      <p className="text-xs text-slate-400 mt-1 font-mono">{changes}</p>
                    )}
                  </div>

                  {/* Time */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-slate-500">{formatTime(log.created_at)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(log.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Settings className="mb-3 h-12 w-12 text-slate-200" />
            <p className="font-medium">No activity logs found</p>
            <p className="text-xs text-slate-400 mt-1">Try a different filter or search</p>
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">Page {page} of {lastPage}</p>
            <div className="flex gap-1.5">
              <button onClick={() => fetchLogs(page - 1)} disabled={page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                Previous
              </button>
              <button onClick={() => fetchLogs(page + 1)} disabled={page >= lastPage}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
