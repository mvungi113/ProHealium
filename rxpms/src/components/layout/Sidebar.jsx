import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3, Users, Settings,
  LogOut, Pill, Activity, UserCircle, AlertTriangle, RotateCcw,
  ReceiptText, Printer,
} from "lucide-react";
import { useStore } from "../../store/appStore";
import { cn } from "../../lib/utils";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/pos", label: "Point of Sale", icon: ShoppingCart },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/customers", label: "Customers", icon: UserCircle },
  { path: "/expiry-alerts", label: "Expiry Alerts", icon: AlertTriangle },
  { path: "/returns", label: "Returns", icon: RotateCcw },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/receipts", label: "Receipts", icon: ReceiptText },
  { path: "/users", label: "Users & Roles", icon: Users },
  { path: "/activity-log", label: "Activity Log", icon: Activity },
  { path: "/barcodes", label: "Barcodes", icon: Printer },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const logout = useStore((state) => state.logout);
  const location = useLocation();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 transform bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white"><Pill className="h-4 w-4" /></div>
            <div className="flex flex-col"><span className="text-base font-bold leading-tight text-slate-800">ProHealium</span><span className="text-[10px] uppercase tracking-wide text-slate-500">RxPMS</span></div>
          </div>
          <nav className="flex-1 overflow-y-auto p-3">
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <NavLink to={item.path} onClick={() => setMobileOpen(false)} className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                      isActive ? "bg-primary-50 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}>
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="border-t border-slate-200 p-3">
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-destructive">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
