import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, RefreshCw, AlertTriangle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import api from "../lib/api";
import { cn } from "../lib/utils";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    try { const res = await api.get("/notifications", { params: unreadOnly ? { unread_only: "true" } : {} }); setNotifications(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, [unreadOnly]);

  const markRead = async (id) => {
    try { await api.patch(`/notifications/${id}/read`); setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n)); } catch {}
  };

  const markAllRead = async () => {
    try { await api.post("/notifications/read-all"); setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true }))); } catch {}
  };

  const checkAlerts = async () => {
    try { const res = await api.post("/notifications/check-alerts"); await fetchNotifications(); } catch {}
  };

  const unread = notifications.filter((n) => !n.is_read).length;

  const getTypeIcon = (type) => {
    if (type === "low_stock") return <Package className="h-4 w-4 text-amber-600" />;
    if (type === "expiry") return <AlertTriangle className="h-4 w-4 text-red-600" />;
    return <Bell className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-800">Notifications</h1><p className="text-[13px] text-slate-500">{unread} unread notification{unread !== 1 ? "s" : ""}</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={checkAlerts}><Bell className="mr-2 h-4 w-4" /> Check Alerts</Button>
          <Button variant="outline" onClick={fetchNotifications}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
          {unread > 0 && <Button onClick={markAllRead}><CheckCheck className="mr-2 h-4 w-4" /> Mark All Read</Button>}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setUnreadOnly(false)} className={cn("rounded-full px-4 py-1.5 text-xs font-medium transition-colors", !unreadOnly ? "bg-primary text-white" : "bg-slate-100 text-slate-600")}>All ({notifications.length})</button>
        <button onClick={() => setUnreadOnly(true)} className={cn("rounded-full px-4 py-1.5 text-xs font-medium transition-colors", unreadOnly ? "bg-primary text-white" : "bg-slate-100 text-slate-600")}>Unread ({unread})</button>
      </div>

      {loading ? <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>
      : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={cn(!n.is_read && "border-primary/30 bg-primary-50/30")}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="mt-0.5">{getTypeIcon(n.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800">{n.title}</p>
                    {!n.is_read && <Badge variant="info" className="text-[10px]">New</Badge>}
                  </div>
                  <p className="text-sm text-slate-500">{n.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && (
                  <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}><Check className="h-4 w-4" /></Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <div className="flex h-64 items-center justify-center text-slate-400">No notifications.</div>}
    </div>
  );
}
