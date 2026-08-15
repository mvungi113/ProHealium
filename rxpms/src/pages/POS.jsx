import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote,
  X, RefreshCw, ScanBarcode, Check, Package, ArrowRight, Sparkles,
} from "lucide-react";
import Receipt from "../components/pos/Receipt";
import { useStore } from "../store/appStore";
import { formatCurrency } from "../lib/utils";
import api from "../lib/api";

const CATEGORY_COLORS = {
  "Pain Relief": { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", accent: "from-rose-500 to-rose-600" },
  "Antibiotics": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", accent: "from-blue-500 to-blue-600" },
  "Vitamins": { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", accent: "from-amber-500 to-amber-600" },
  "Antihistamines": { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200", accent: "from-violet-500 to-violet-600" },
  "Diabetes": { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", accent: "from-emerald-500 to-emerald-600" },
};

function getCategoryStyle(category) {
  return CATEGORY_COLORS[category] || { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", accent: "from-slate-500 to-slate-600" };
}

const PAYMENT_ICONS = {
  cash: Banknote,
  card: CreditCard,
  mobile_money: CreditCard,
  insurance: CreditCard,
};

const PAYMENT_LABELS = {
  cash: "Cash",
  card: "Card",
  mobile_money: "Mobile Money",
  insurance: "Insurance",
};

export default function POS() {
  const products = useStore((state) => state.products);
  const fetchProducts = useStore((state) => state.fetchProducts);
  const cart = useStore((state) => state.cart);
  const addToCart = useStore((state) => state.addToCart);
  const addMultipleToCart = useStore((state) => state.addMultipleToCart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const updateCartQuantity = useStore((state) => state.updateCartQuantity);
  const clearCart = useStore((state) => state.clearCart);
  const pendingSales = useStore((state) => state.pendingSales);
  const syncPendingSales = useStore((state) => state.syncPendingSales);
  const isOnline = useStore((state) => state.isOnline);
  const setOnline = useStore((state) => state.setOnline);
  const queueSale = useStore((state) => state.queueSale);
  const currentUser = useStore((state) => state.currentUser);
  const saveReceipt = useStore((state) => state.saveReceipt);
  const updateReceiptSyncStatus = useStore((state) => state.updateReceiptSyncStatus);

  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [addedProductId, setAddedProductId] = useState(null);
  const [settings, setSettings] = useState({ tax_rate: "10", currency: "USD ($)", payment_methods: "Cash,Card" });
  const barcodeRef = useRef(null);

  useEffect(() => {
    api.get("/settings").then((res) => setSettings((prev) => ({ ...prev, ...res.data }))).catch(() => {});
  }, []);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  useEffect(() => {
    if (isOnline && pendingSales.length > 0) handleSync();
  }, [isOnline]);

  useEffect(() => {
    const timer = setTimeout(() => barcodeRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleBarcodeScan = useCallback((e) => {
    if (e.key !== "Enter") return;
    const code = barcodeInput.trim();
    if (!code) return;
    const product = products.find((p) => p.sku.toLowerCase() === code.toLowerCase());
    if (product) {
      if (product.quantity > 0) {
        addToCart(product);
        flashProduct(product.id);
      } else {
        setError(`${product.name} is out of stock`);
        setTimeout(() => setError(""), 2000);
      }
    } else {
      setError(`Product not found: ${code}`);
      setTimeout(() => setError(""), 2000);
    }
    setBarcodeInput("");
    barcodeRef.current?.focus();
  }, [barcodeInput, products, addToCart]);

  const flashProduct = (id) => {
    setAddedProductId(id);
    setTimeout(() => setAddedProductId(null), 600);
  };

  const handleAddToCart = (product) => {
    if (product.quantity > 0) {
      addToCart(product);
      flashProduct(product.id);
    }
  };

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((product) => {
    const q = search.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const subtotal = cart.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
  const taxRate = parseFloat(settings.tax_rate) || 0;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const enabledPayments = (settings.payment_methods || "Cash,Card").split(",").filter(Boolean);

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncPendingSales();
    setLastSyncResult(result);
    setSyncing(false);
    setTimeout(() => setLastSyncResult(null), 3000);
  };

  const buildReceiptData = (invoice) => ({
    invoice,
    customer: customerName || "Walk-in Customer",
    paymentMethod,
    items: cart.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.unitPrice) * item.quantity,
    })),
    subtotal, tax, total,
    date: new Date().toISOString(),
    cashier: currentUser?.name || "Cashier",
    synced: isOnline,
  });

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setError("");
    const invoice = `INV-${String(Date.now()).slice(-6)}`;
    const receiptData = buildReceiptData(invoice);
    saveReceipt(receiptData);

    const saleData = {
      customer: receiptData.customer,
      payment_method: paymentMethod,
      items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
    };

    const updatedProducts = products.map((p) => {
      const cartItem = cart.find((c) => c.id === p.id);
      if (cartItem) return { ...p, quantity: Math.max(0, p.quantity - cartItem.quantity) };
      return p;
    });
    useStore.setState({ products: updatedProducts });
    clearCart();
    setCustomerName("");
    setActiveReceipt(receiptData);

    if (isOnline) {
      api.post("/sales", { customer: saleData.customer, payment_method: saleData.payment_method, items: saleData.items })
        .then(async (res) => {
          updateReceiptSyncStatus(invoice, true, res.data.id);
          await fetchProducts();
        })
        .catch(() => {
          updateReceiptSyncStatus(invoice, false);
          queueSale(saleData);
        });
    } else {
      queueSale(saleData);
      updateReceiptSyncStatus(invoice, false);
    }
  };

  const handleNewSale = () => {
    setActiveReceipt(null);
    barcodeRef.current?.focus();
  };

  const quickAmounts = [1, 2, 3, 5];

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col gap-3 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Point of Sale</h1>
          <p className="text-[13px] text-slate-500">{products.length} products available</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingSales.length > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              {pendingSales.length} pending
            </span>
          )}
          {pendingSales.length > 0 && isOnline && (
            <button onClick={handleSync} disabled={syncing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} /> Sync
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {lastSyncResult && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700 flex items-center gap-2">
          <Check className="h-4 w-4" /> Synced {lastSyncResult.synced} sale(s), {lastSyncResult.failed} failed.
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600 flex items-center gap-2">
          <X className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Barcode Scanner */}
      <div className="relative rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 px-4 py-3 transition-colors focus-within:border-primary/60 focus-within:bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shrink-0">
            <ScanBarcode className="h-4.5 w-4.5" />
          </div>
          <input
            ref={barcodeRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={handleBarcodeScan}
            placeholder="Scan barcode or type SKU, press Enter..."
            className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
            autoFocus
          />
          {barcodeInput && (
            <button onClick={() => { setBarcodeInput(""); barcodeRef.current?.focus(); }}
              className="rounded-md p-1 text-slate-400 hover:bg-white/60 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Products */}
        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
          {/* Search + Categories */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {categories.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button key={category} onClick={() => setSelectedCategory(category)}
                    className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}>
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredProducts.map((product) => {
                const cat = getCategoryStyle(product.category);
                const isAdded = addedProductId === product.id;
                const lowStock = product.quantity <= product.reorderLevel;
                return (
                  <button key={product.id} onClick={() => handleAddToCart(product)}
                    disabled={product.quantity <= 0}
                    className={`group relative flex flex-col rounded-2xl border text-left transition-all duration-200 ${
                      product.quantity <= 0
                        ? "border-slate-100 bg-slate-50/50 opacity-50 cursor-not-allowed"
                        : `border-slate-200 bg-white hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.97] ${isAdded ? "ring-2 ring-primary ring-offset-2 scale-[0.97]" : ""}`
                    }`}>
                    <div className="flex flex-1 flex-col p-3.5">
                      {/* Category badge */}
                      <span className={`inline-flex self-start rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cat.bg} ${cat.text} mb-2`}>
                        {product.category}
                      </span>

                      {/* Product name */}
                      <h3 className="text-sm font-bold text-slate-800 leading-snug mb-0.5 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-400 mb-3">{product.sku}</p>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Price + Stock */}
                      <div className="flex items-end justify-between mb-3">
                        <span className="text-lg font-extrabold text-slate-800">
                          {formatCurrency(product.unitPrice)}
                        </span>
                        <span className={`text-[11px] font-medium ${lowStock ? "text-red-500" : "text-slate-400"}`}>
                          {lowStock ? <span className="inline-flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />{product.quantity}</span> : product.quantity} in stock
                        </span>
                      </div>

                      {/* Quick add buttons */}
                      {product.quantity > 0 && (
                        <div className="flex gap-1.5">
                          {quickAmounts.filter((q) => q <= product.quantity).map((qty) => (
                            <span key={qty}
                              onClick={(e) => { e.stopPropagation(); addMultipleToCart(product, qty); flashProduct(product.id); }}
                              className="flex h-7 flex-1 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600 transition-all hover:bg-primary hover:text-white active:scale-95">
                              +{qty}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Added flash overlay */}
                    {isAdded && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-[1px] pointer-events-none">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white animate-bounce">
                          <Check className="h-5 w-5" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {filteredProducts.length === 0 && (
              <div className="flex h-48 flex-col items-center justify-center text-slate-400">
                <Package className="mb-3 h-12 w-12 text-slate-200" />
                <p className="text-sm font-medium">No products found</p>
                <p className="text-xs text-slate-400 mt-1">Try a different search or category</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="flex w-[340px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          {/* Cart Header */}
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShoppingCart className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800">Current Order</span>
                  <p className="text-[11px] text-slate-400">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
                </div>
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <ShoppingCart className="h-7 w-7 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">Cart is empty</p>
                <p className="mt-1 text-xs text-slate-400">Scan or tap a product</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => {
                  const cat = getCategoryStyle(item.category);
                  return (
                    <div key={item.id} className="group flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition-all hover:bg-slate-100/80">
                      {/* Product icon */}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cat.bg}`}>
                        <Package className={`h-4 w-4 ${cat.text}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                        <p className="text-[11px] text-slate-400">{formatCurrency(item.unitPrice)} each</p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors">
                            <Plus className="h-3 w-3" />
                          </button>
                          <button onClick={() => removeFromCart(item.id)}
                            className="ml-1 flex h-6 w-6 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {formatCurrency(Number(item.unitPrice) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-4 space-y-4">
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Tax ({taxRate}%)</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-slate-800">Total</span>
                  <span className="text-lg font-extrabold text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-2 gap-2">
                {enabledPayments.map((method) => {
                  const key = method.toLowerCase().replace(/\s+/g, "_");
                  const Icon = PAYMENT_ICONS[key] || CreditCard;
                  const label = PAYMENT_LABELS[key] || method;
                  return (
                    <button key={key} onClick={() => setPaymentMethod(key)}
                      className={`flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-xs font-bold transition-all ${
                        paymentMethod === key
                          ? "border-primary bg-primary text-white shadow-md shadow-primary/25"
                          : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      }`}>
                      <Icon className="h-4 w-4" /> {label}
                    </button>
                  );
                })}
              </div>

              {/* Customer */}
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name (optional)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />

              {/* Pay Button */}
              <button onClick={handleCheckout}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary/90 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.98]">
                <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
                Pay {formatCurrency(total)}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              {!isOnline && (
                <p className="text-center text-[10px] font-medium text-amber-600">
                  Offline — will sync when connected
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {activeReceipt && (
        <Receipt receipt={activeReceipt} onClose={() => setActiveReceipt(null)} onNewSale={handleNewSale} />
      )}
    </div>
  );
}
