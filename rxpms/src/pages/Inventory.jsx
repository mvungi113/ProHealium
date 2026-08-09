import { useState } from "react";
import { Package, Truck, ArrowLeftRight, ShoppingCart } from "lucide-react";
import ProductsTab from "./inventory/ProductsTab";
import SuppliersTab from "./inventory/SuppliersTab";
import StockAdjustmentsTab from "./inventory/StockAdjustmentsTab";
import PurchaseOrdersTab from "./inventory/PurchaseOrdersTab";

const tabs = [
  { id: "products", label: "Products", icon: Package },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "adjustments", label: "Adjustments", icon: ArrowLeftRight },
  { id: "purchase-orders", label: "Orders", icon: ShoppingCart },
];

export default function Inventory() {
  const [activeTab, setActiveTab] = useState("products");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Inventory Management</h1>
        <p className="text-[13px] text-slate-500">Manage products, suppliers, stock adjustments, and purchase orders.</p>
      </div>

      {/* Custom Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "suppliers" && <SuppliersTab />}
        {activeTab === "adjustments" && <StockAdjustmentsTab />}
        {activeTab === "purchase-orders" && <PurchaseOrdersTab />}
      </div>
    </div>
  );
}
