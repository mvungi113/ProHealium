import { create } from "zustand";
import api from "../lib/api";

const PRODUCTS_CACHE_KEY = "pos_products_cache";
const CART_KEY = "pos_cart";
const PENDING_SALES_KEY = "pos_pending_sales";
const RECEIPTS_KEY = "pos_receipts";

function loadCart() {
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function loadProductsCache() {
  try {
    const data = localStorage.getItem(PRODUCTS_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveProductsCache(products) {
  localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
}

function loadPendingSales() {
  try {
    const data = localStorage.getItem(PENDING_SALES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function savePendingSales(sales) {
  localStorage.setItem(PENDING_SALES_KEY, JSON.stringify(sales));
}

function loadReceipts() {
  try {
    const data = localStorage.getItem(RECEIPTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveReceipts(receipts) {
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
}

export const useStore = create((set, get) => ({
  products: loadProductsCache(),
  sales: [],
  users: [],
  cart: loadCart(),
  currentUser: null,
  isAuthenticated: false,
  authLoading: true,
  token: null,
  pendingSales: loadPendingSales(),
  isOnline: navigator.onLine,
  receipts: loadReceipts(),

  setOnline: (online) => set({ isOnline: online }),

  login: (user, token) => {
    localStorage.setItem("rxpm_token", token);
    set({ currentUser: user, isAuthenticated: true, authLoading: false, token });
  },

  logout: async () => {
    try {
      await api.post("/logout");
    } catch {}
    localStorage.removeItem("rxpm_token");
    set({ currentUser: null, isAuthenticated: false, authLoading: false, cart: [], token: null });
  },

  normalizeProduct: (p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    sku: p.sku,
    quantity: p.quantity,
    unitPrice: Number(p.unit_price),
    expiryDate: p.expiry_date,
    supplier: p.supplier,
    reorderLevel: p.reorder_level,
  }),

  fetchProducts: async () => {
    try {
      const response = await api.get("/products");
      const items = response.data.data || response.data;
      const normalized = items.map((p) => get().normalizeProduct(p));
      set({ products: normalized });
      saveProductsCache(normalized);
    } catch {
      // Offline - keep cached data
    }
  },

  addProduct: async (product) => {
    const response = await api.post("/products", product);
    const normalized = get().normalizeProduct(response.data);
    set((state) => {
      const updated = [...state.products, normalized];
      saveProductsCache(updated);
      return { products: updated };
    });
    return response.data;
  },

  updateProduct: async (id, updatedProduct) => {
    const response = await api.put(`/products/${id}`, updatedProduct);
    set((state) => {
      const updated = state.products.map((p) =>
        p.id === id ? get().normalizeProduct(response.data) : p
      );
      saveProductsCache(updated);
      return { products: updated };
    });
    return response.data;
  },

  deleteProduct: async (id) => {
    await api.delete(`/products/${id}`);
    set((state) => {
      const updated = state.products.filter((p) => p.id !== id);
      saveProductsCache(updated);
      return { products: updated };
    });
  },

  addToCart: (product) => {
    const cart = get().cart;
    const existing = cart.find((item) => item.id === product.id);
    let updated;
    if (existing) {
      updated = cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updated = [...cart, { ...product, quantity: 1 }];
    }
    set({ cart: updated });
    saveCart(updated);
  },

  addMultipleToCart: (product, qty) => {
    const cart = get().cart;
    const existing = cart.find((item) => item.id === product.id);
    let updated;
    if (existing) {
      updated = cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + qty }
          : item
      );
    } else {
      updated = [...cart, { ...product, quantity: qty }];
    }
    set({ cart: updated });
    saveCart(updated);
  },

  removeFromCart: (id) => {
    const updated = get().cart.filter((item) => item.id !== id);
    set({ cart: updated });
    saveCart(updated);
  },

  updateCartQuantity: (id, quantity) => {
    if (quantity <= 0) {
      const updated = get().cart.filter((item) => item.id !== id);
      set({ cart: updated });
      saveCart(updated);
      return;
    }
    const updated = get().cart.map((item) =>
      item.id === id ? { ...item, quantity } : item
    );
    set({ cart: updated });
    saveCart(updated);
  },

  clearCart: () => {
    set({ cart: [] });
    saveCart([]);
  },

  queueSale: (saleData) => {
    const pending = [...get().pendingSales, { ...saleData, queuedAt: Date.now() }];
    set({ pendingSales: pending });
    savePendingSales(pending);
  },

  syncPendingSales: async () => {
    const pending = get().pendingSales;
    if (pending.length === 0) return;

    const synced = [];
    const failed = [];

    for (const sale of pending) {
      try {
        await api.post("/sales", {
          customer: sale.customer,
          payment_method: sale.payment_method,
          items: sale.items,
        });
        synced.push(sale);
      } catch {
        failed.push(sale);
      }
    }

    if (synced.length > 0) {
      await get().fetchProducts();
    }

    set({ pendingSales: failed });
    savePendingSales(failed);

    return { synced: synced.length, failed: failed.length };
  },

  addSale: (sale) =>
    set((state) => ({
      sales: [sale, ...state.sales],
    })),

  saveReceipt: (receipt) => {
    const updated = [receipt, ...get().receipts].slice(0, 200);
    set({ receipts: updated });
    saveReceipts(updated);
  },

  updateReceiptSyncStatus: (invoice, synced, serverId) => {
    const updated = get().receipts.map((r) =>
      r.invoice === invoice ? { ...r, synced, serverId } : r
    );
    set({ receipts: updated });
    saveReceipts(updated);
  },

  loadReceipts: () => loadReceipts(),
}));
