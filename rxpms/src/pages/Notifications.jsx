import { useState, useEffect } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  RefreshCw,
  AlertTriangle,
  Package,
  ShieldCheck,
  Clock,
  Trash2,
  Filter,
  Inbox,
  Settings,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { cn } from "../lib/utils";
import api from "../lib/api";

function NotificationIcon({ type }) {
  const config = {
    low_stock: { icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
    expiry: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    system: { icon: Settings, color: "text-blue-600", bg: "bg-blue-50" },
  };
  const c = config[type] || { icon: Bell, color: "text-slate-600", bg: "bg-slate-50" };
  const Icon = c.icon;
  return (
    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", c.bg)}>
      <Icon className={cn("h-5 w-5", c.color)} />
    </div>
  );
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [checking, setChecking] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications", {
        params: unreadOnly ? { unread_only: "true" } : {},
      });
      setNotifications(res.data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [unreadOnly]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const checkAlerts = async () => {
    setChecking(true);
    try {
      await api.post("/notifications/check-alerts");
      await fetchNotifications();
    } catch {
    } finally {
      setChecking(false);
    }
  };

  const unread = notifications.filter((n) => !n.is_read).length;
  const lowStockCount = notifications.filter((n) => n.type === "low_stock").length;
  const expiryCount = notifications.filter((n) => n.type === "expiry").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Notifications</h1>
          <p className="text-[13px] text-slate-500">
            Stay updated on stock alerts and expiry warnings
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={checkAlerts}
            disabled={checking}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {checking ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            Check Alerts
          </button>
          <button
            onClick={fetchNotifications}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              <CheckCheck className="h-4 w-4" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {unread} unread
              </span>
            </div>
            <p className="mt-3 text-xl font-bold text-slate-800">
              {notifications.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Notifications</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <Badge variant="secondary" className="text-[10px]">
                Stock
              </Badge>
            </div>
            <p className="mt-3 text-xl font-bold text-amber-600">
              {lowStockCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">Low Stock Alerts</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <Badge variant="secondary" className="text-[10px]">
                Expiry
              </Badge>
            </div>
            <p className="mt-3 text-xl font-bold text-red-600">{expiryCount}</p>
            <p className="text-xs text-slate-500 mt-1">Expiry Alerts</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setUnreadOnly(false)}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
            !unreadOnly
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
            unreadOnly
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          Unread ({unread})
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "rounded-xl border bg-white transition-all hover:shadow-sm",
                !n.is_read
                  ? "border-primary/20 shadow-sm"
                  : "border-slate-200"
              )}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <NotificationIcon type={n.type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "text-sm",
                        !n.is_read
                          ? "font-semibold text-slate-800"
                          : "font-medium text-slate-700"
                      )}
                    >
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        NEW
                      </span>
                    )}
                    <Badge
                      variant={
                        n.type === "low_stock"
                          ? "warning"
                          : n.type === "expiry"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[10px] capitalize"
                    >
                      {n.type?.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock className="h-3 w-3 text-slate-300" />
                    <span className="text-[11px] text-slate-400">
                      {timeAgo(n.created_at)}
                    </span>
                    <span className="text-[11px] text-slate-300">·</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="mt-1 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
                  >
                    <Check className="h-3.5 w-3.5" /> Mark read
                  </button>
                )}
              </CardContent>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-4">
            <Inbox className="h-7 w-7 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">
            {unreadOnly ? "No unread notifications" : "No notifications yet"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {unreadOnly
              ? "All caught up! Check back later."
              : "Click 'Check Alerts' to scan for low stock and expiry warnings."}
          </p>
        </div>
      )}
    </div>
  );
}
