import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, Bell, User, LogOut, Settings, ChevronDown,
  AlertTriangle, Check, X
} from "lucide-react";
import { useStore } from "../../store/appStore";
import api from "../../lib/api";

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

function NotificationDropdown({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  useClickOutside(ref, onClose);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.data || res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-white shadow-xl border border-slate-200 z-50">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary hover:text-primary/80">Mark all read</button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading && <p className="py-6 text-center text-sm text-slate-400">Loading...</p>}
        {!loading && notifications.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">No notifications</p>
        )}
        {!loading && notifications.map((n) => (
          <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 ${!n.read_at ? "bg-primary-50/50" : ""}`}>
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              n.type?.includes("warning") ? "bg-amber-100 text-amber-600" :
              n.type?.includes("error") || n.type?.includes("danger") ? "bg-red-100 text-red-600" :
              "bg-primary-100 text-primary"
            }`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!n.read_at ? "font-medium" : ""} text-slate-800 line-clamp-2`}>{n.data?.message || n.message || "Notification"}</p>
              <p className="text-xs text-slate-400 mt-1">{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</p>
            </div>
            {!n.read_at && (
              <button onClick={() => markRead(n.id)} className="mt-1 rounded p-0.5 text-slate-400 hover:text-primary">
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
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
    <div ref={ref} className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 z-50 py-1">
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

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <div className="relative">
          <button onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }} className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100">
            <Bell className="h-5 w-5" />
          </button>
          {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
        </div>

        <div className="relative">
          <button onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }} className="flex items-center gap-2 rounded-lg pl-2 pr-1 py-1 hover:bg-slate-100">
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
