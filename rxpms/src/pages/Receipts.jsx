import { useState } from "react";
import { Eye, Search, CheckCircle, AlertTriangle, Printer, Trash2 } from "lucide-react";
import { useStore } from "../store/appStore";
import { formatCurrency } from "../lib/utils";
import Receipt from "../components/pos/Receipt";

export default function Receipts() {
  const receipts = useStore((state) => state.receipts);
  const [search, setSearch] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const filtered = receipts.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.invoice?.toLowerCase().includes(q) ||
      r.customer?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Receipts</h1>
        <p className="text-[13px] text-slate-500">{receipts.length} receipts stored</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Search by invoice or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Cashier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Payment</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-sm text-slate-400">
                    No receipts found
                  </td>
                </tr>
              )}
              {filtered.map((receipt, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">{receipt.invoice}</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(receipt.date).toLocaleDateString()} {new Date(receipt.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-4 py-3 text-slate-600">{receipt.customer}</td>
                  <td className="px-4 py-3 text-slate-600">{receipt.cashier}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 capitalize">
                      {receipt.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(receipt.total)}</td>
                  <td className="px-4 py-3 text-center">
                    {receipt.synced ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                        <CheckCircle className="h-3 w-3" /> Synced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                        <AlertTriangle className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedReceipt(receipt)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReceipt && (
        <Receipt
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onNewSale={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
