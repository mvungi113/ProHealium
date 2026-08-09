import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, Bell, User, LogOut, Settings, ChevronDown,
  AlertTriangle, Package, Clock, Check, CheckCheck, X,
} from "lucide-react";
import { useStore } from "../../store/appStore";
import api from "../../lib/api";
import { cn } from "../../lib/utils";

const NOTIF_CONFIG = {
  low_stock: { icon: Package, color: "text-orange-600", bg: "bg-orange-100", label: "Low Stock" },
  expiry: { icon: Clock, color: "text-red-600", bg: "bg-red-100", label: "Expiry" },
  info: { icon: AlertTriangle, color: "text-blue-600", bg: "bg-blue-100", label: "Info" },
};

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

function NotificationDropdown({ onClose, onCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  useClickOutside(ref, onClose);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setNotifications(data);
      onCountChange?.(data.filter((n) => !n.is_read).length);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => {
        const updated = prev.map((n) => n.id === id ? { ...n, is_read: true } : n);
        onCountChange?.(updated.filter((n) => !n.is_read).length);
        return updated;
      });
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => {
        const updated = prev.map((n) => ({ ...n, is_read: true }));
        onCountChange?.(0);
        return updated;
      });
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotifConfig = (type) => NOTIF_CONFIG[type] || NOTIF_CONFIG.info;

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-96 rounded-xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Bell className="mb-2 h-10 w-10 text-slate-200" />
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-[11px] text-slate-400 mt-0.5">You're all caught up</p>
          </div>
        ) : (
          notifications.map((n) => {
            const config = getNotifConfig(n.type);
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 transition-colors",
                  !n.is_read ? "bg-primary/[0.03]" : "hover:bg-slate-50/50"
                )}
              >
                {/* Icon */}
                <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", config.bg)}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {n.title && <p className="text-xs font-bold text-slate-700">{n.title}</p>}
                    {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className={cn("text-[13px] leading-snug mt-0.5", !n.is_read ? "font-medium text-slate-800" : "text-slate-600")}>
                    {n.message || "Notification"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">{formatTime(n.created_at)}</p>
                </div>

                {/* Mark read */}
                {!n.is_read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="mt-1 rounded-md p-1 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {!loading && notifications.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-2.5 text-center">
          <button
            onClick={() => { onClose(); window.location.href = "/expiry-alerts"; }}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            View all alerts
          </button>
        </div>
      )}
    </div>
  );
}

function UserDropdown({ onClose }) {
  const ref = useRef(null);
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const navigate = useNavigate();

  useClickOutside(ref, onClose);

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-2xl border border-slate-200 z-50 py-1">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-medium text-slate-800">{currentUser?.name}</p>
        <p className="text-xs text-slate-500">{currentUser?.email}</p>
        <span className="mt-1 inline-block rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary">{currentUser?.role || "Admin"}</span>
      </div>
      <button onClick={() => { navigate("/settings"); onClose(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
        <Settings className="h-4 w-4" /> Settings
      </button>
      <button onClick={() => { logout(); onClose(); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </div>
  );
}

export default function Topbar({ setMobileOpen }) {
  const currentUser = useStore((state) => state.currentUser);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check alerts on mount and every 5 minutes
  useEffect(() => {
    const checkAlerts = async () => {
      try {
        await api.post("/notifications/check-alerts");
        const res = await api.get("/notifications");
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      } catch {}
    };
    checkAlerts();
    const interval = setInterval(checkAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
            className={cn(
              "relative rounded-lg p-2 transition-colors",
              notifOpen ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} onCountChange={setUnreadCount} />}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
            className={cn(
              "flex items-center gap-2 rounded-lg pl-2 pr-1 py-1 transition-colors",
              userOpen ? "bg-slate-100" : "hover:bg-slate-100"
            )}
          >
            <div className="hidden flex-col items-end md:flex">
              <span className="text-sm font-medium leading-tight text-slate-800">{currentUser?.name || "Pharmacist"}</span>
              <span className="text-[11px] text-slate-500">{currentUser?.role || "Admin"}</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary">
              <User className="h-4 w-4" />
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
          </button>
          {userOpen && <UserDropdown onClose={() => setUserOpen(false)} />}
        </div>
      </div>
    </header>
  );
}
