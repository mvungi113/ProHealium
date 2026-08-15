import { useState, useEffect } from "react";
import { AlertTriangle, Package, Clock, Shield, XCircle, Search } from "lucide-react";
import { useStore } from "../store/appStore";
import { formatCurrency, formatDate, getDaysUntilExpiry, cn } from "../lib/utils";

function StatCard({ icon: Icon, label, value, color, bgColor, borderColor }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl bg-white border p-4 ${borderColor}`}>
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

function UrgencyBar({ days }) {
  if (days < 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-red-100 overflow-hidden">
          <div className="h-full w-full rounded-full bg-red-500" />
        </div>
        <span className="text-[11px] font-bold text-red-600 whitespace-nowrap">Expired</span>
      </div>
    );
  }
  const pct = Math.min(100, Math.max(5, (days / 90) * 100));
  const color = days <= 30 ? "bg-red-500" : days <= 60 ? "bg-amber-500" : "bg-green-500";
  const bgColor = days <= 30 ? "bg-red-100" : days <= 60 ? "bg-amber-100" : "bg-green-100";
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 flex-1 rounded-full ${bgColor} overflow-hidden`}>
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-[11px] font-bold whitespace-nowrap",
        days <= 30 ? "text-red-600" : days <= 60 ? "text-amber-600" : "text-green-600"
      )}>
        {days}d
      </span>
    </div>
  );
}

export default function ExpiryAlerts() {
  const products = useStore((s) => s.products);
  const fetchProducts = useStore((s) => s.fetchProducts);
  const [filter, setFilter] = useState("expiring");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const getExpiryProducts = () => {
    return products
      .map((p) => ({ ...p, daysLeft: getDaysUntilExpiry(p.expiryDate) }))
      .filter((p) => {
        const matchesFilter =
          filter === "expired" ? p.daysLeft < 0 :
          filter === "expiring" ? p.daysLeft >= 0 && p.daysLeft <= 90 :
          filter === "safe" ? p.daysLeft > 90 :
          true;
        const q = search.toLowerCase();
        const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  };

  const filtered = getExpiryProducts();
  const expired = products.filter((p) => getDaysUntilExpiry(p.expiryDate) < 0).length;
  const expiring = products.filter((p) => { const d = getDaysUntilExpiry(p.expiryDate); return d >= 0 && d <= 90; }).length;
  const critical = products.filter((p) => { const d = getDaysUntilExpiry(p.expiryDate); return d >= 0 && d <= 30; }).length;
  const safe = products.filter((p) => getDaysUntilExpiry(p.expiryDate) > 90).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Expiry Alerts</h1>
        <p className="text-[13px] text-slate-500">Track products approaching or past their expiry date.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={XCircle} label="Expired" value={expired} bgColor="bg-red-50" color="text-red-600" borderColor="border-red-100" />
        <StatCard icon={AlertTriangle} label="Critical (≤30d)" value={critical} bgColor="bg-orange-50" color="text-orange-600" borderColor="border-orange-100" />
        <StatCard icon={Clock} label="Expiring (≤90d)" value={expiring} bgColor="bg-amber-50" color="text-amber-600" borderColor="border-amber-100" />
        <StatCard icon={Shield} label="Safe (>90d)" value={safe} bgColor="bg-green-50" color="text-green-600" borderColor="border-green-100" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5">
          {[
            { id: "expiring", label: "Expiring Soon", count: expiring },
            { id: "expired", label: "Expired", count: expired },
            { id: "safe", label: "Safe", count: safe },
            { id: "all", label: "All Products", count: products.length },
          ].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={cn("flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                filter === f.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
              )}>
              {f.label}
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                filter === f.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[160px]">Urgency</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isExpired = p.daysLeft < 0;
                const isCritical = p.daysLeft >= 0 && p.daysLeft <= 30;
                return (
                  <tr key={p.id}
                    className={cn("border-b border-slate-50 transition-colors",
                      isExpired && "bg-red-50/50 hover:bg-red-50",
                      isCritical && "bg-orange-50/30 hover:bg-orange-50/50",
                      !isExpired && !isCritical && "hover:bg-slate-50/50"
                    )}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                          isExpired ? "bg-red-100 text-red-500" : isCritical ? "bg-orange-100 text-orange-500" : "bg-primary/10 text-primary"
                        )}>
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">{p.name}</span>
                          <p className="text-[11px] text-slate-400">{p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{p.quantity}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{formatDate(p.expiryDate)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <UrgencyBar days={p.daysLeft} />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {formatCurrency(p.unitPrice * p.quantity)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Shield className="mb-3 h-12 w-12 text-green-200" />
            <p className="font-medium text-green-600">All clear!</p>
            <p className="text-xs text-slate-400 mt-1">No products match this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
