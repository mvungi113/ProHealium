import { Printer, X, CheckCircle } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import "./Receipts.css";

function buildReceiptHTML(receipt) {
  const date = new Date(receipt.date);
  const items = receipt.items
    .map(
      (item) => `
    <div class="receipt-item">
      <div class="receipt-item-name">${item.name}</div>
      <div class="receipt-item-detail">${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.subtotal)}</div>
    </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${receipt.invoice}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: #fff; }
    .receipt-container {
      width: 80mm;
      font-family: "Courier New", Courier, monospace;
      font-size: 10pt;
      line-height: 1.3;
      color: #000;
      padding: 2mm;
      margin: 0 auto;
    }
    .receipt-header { text-align: center; margin-bottom: 2mm; }
    .receipt-pharmacy-name { font-size: 13pt; font-weight: 700; letter-spacing: 0.5px; }
    .receipt-subtext { font-size: 8pt; color: #444; }
    .receipt-divider { text-align: center; margin: 2mm 0; white-space: pre; overflow: hidden; font-size: 8pt; }
    .receipt-row { display: flex; justify-content: space-between; }
    .receipt-items-header { display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 2mm; }
    .receipt-item { margin-bottom: 2mm; }
    .receipt-item-name { font-weight: 600; }
    .receipt-item-detail { text-align: right; font-size: 8pt; }
    .receipt-totals { margin-top: 2mm; }
    .receipt-total { font-size: 11pt; font-weight: 700; padding: 2mm 0; }
    .receipt-footer { text-align: center; margin-top: 4mm; font-size: 8pt; }
    .receipt-offline-badge { margin-top: 4mm; padding: 2mm 4mm; border: 1px dashed #000; text-align: center; font-weight: 700; font-size: 7pt; }
    @media print {
      @page { size: 80mm auto; margin: 2mm; }
      .receipt-container { width: 100%; max-width: 80mm; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="receipt-header">
      <div class="receipt-pharmacy-name">ProHealium Pharmacy</div>
      <div class="receipt-subtext">Your Health, Our Priority</div>
      <div class="receipt-subtext">Kampala, Uganda</div>
      <div class="receipt-subtext">Tel: +256 700 123456</div>
    </div>
    <div class="receipt-divider">================================</div>
    <div class="receipt-info">
      <div class="receipt-row"><span>Invoice:</span><span>${receipt.invoice}</span></div>
      <div class="receipt-row"><span>Date:</span><span>${date.toLocaleDateString()}</span></div>
      <div class="receipt-row"><span>Time:</span><span>${date.toLocaleTimeString()}</span></div>
      <div class="receipt-row"><span>Cashier:</span><span>${receipt.cashier}</span></div>
      <div class="receipt-row"><span>Customer:</span><span>${receipt.customer}</span></div>
    </div>
    <div class="receipt-divider">--------------------------------</div>
    <div class="receipt-items">
      <div class="receipt-items-header"><span>Item</span><span>Qty  Price   Total</span></div>
      ${items}
    </div>
    <div class="receipt-divider">--------------------------------</div>
    <div class="receipt-totals">
      <div class="receipt-row"><span>Subtotal:</span><span>${formatCurrency(receipt.subtotal)}</span></div>
      <div class="receipt-row"><span>Tax (10%):</span><span>${formatCurrency(receipt.tax)}</span></div>
      <div class="receipt-divider">================================</div>
      <div class="receipt-row receipt-total"><span>TOTAL:</span><span>${formatCurrency(receipt.total)}</span></div>
      <div class="receipt-divider">================================</div>
      <div class="receipt-row"><span>Payment:</span><span>${receipt.paymentMethod === "cash" ? "CASH" : "CARD"}</span></div>
    </div>
    <div class="receipt-divider">--------------------------------</div>
    <div class="receipt-footer">
      <div>Thank you for your purchase!</div>
      <div>Please keep this receipt.</div>
      ${receipt.synced === false ? '<div class="receipt-offline-badge">OFFLINE - PENDING SYNC</div>' : ""}
    </div>
  </div>
</body>
</html>`;
}

export default function Receipt({ receipt, onClose, onNewSale }) {
  if (!receipt) return null;

  const handlePrint = () => {
    const html = buildReceiptHTML(receipt);
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white shadow-2xl rounded-xl max-h-[90vh] overflow-hidden flex flex-col w-[340px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-semibold text-sm text-slate-800">Sale Completed</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Receipt preview */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="receipt-container mx-auto">
            <div className="receipt-header">
              <div className="receipt-pharmacy-name">ProHealium Pharmacy</div>
              <div className="receipt-subtext">Your Health, Our Priority</div>
              <div className="receipt-subtext">Kampala, Uganda</div>
              <div className="receipt-subtext">Tel: +256 700 123456</div>
            </div>

            <div className="receipt-divider">================================</div>

            <div className="receipt-info">
              <div className="receipt-row">
                <span>Invoice:</span>
                <span>{receipt.invoice}</span>
              </div>
              <div className="receipt-row">
                <span>Date:</span>
                <span>{new Date(receipt.date).toLocaleDateString()}</span>
              </div>
              <div className="receipt-row">
                <span>Time:</span>
                <span>{new Date(receipt.date).toLocaleTimeString()}</span>
              </div>
              <div className="receipt-row">
                <span>Cashier:</span>
                <span>{receipt.cashier}</span>
              </div>
              <div className="receipt-row">
                <span>Customer:</span>
                <span>{receipt.customer}</span>
              </div>
            </div>

            <div className="receipt-divider">--------------------------------</div>

            <div className="receipt-items">
              <div className="receipt-items-header">
                <span>Item</span>
                <span>Qty  Price   Total</span>
              </div>
              {receipt.items.map((item, i) => (
                <div key={i} className="receipt-item">
                  <div className="receipt-item-name">{item.name}</div>
                  <div className="receipt-item-detail">
                    {item.quantity} x {formatCurrency(item.unitPrice)} = {formatCurrency(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>

            <div className="receipt-divider">--------------------------------</div>

            <div className="receipt-totals">
              <div className="receipt-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(receipt.subtotal)}</span>
              </div>
              <div className="receipt-row">
                <span>Tax (10%):</span>
                <span>{formatCurrency(receipt.tax)}</span>
              </div>
              <div className="receipt-divider">================================</div>
              <div className="receipt-row receipt-total">
                <span>TOTAL:</span>
                <span>{formatCurrency(receipt.total)}</span>
              </div>
              <div className="receipt-divider">================================</div>
              <div className="receipt-row">
                <span>Payment:</span>
                <span>{receipt.paymentMethod === "cash" ? "CASH" : "CARD"}</span>
              </div>
            </div>

            <div className="receipt-divider">--------------------------------</div>

            <div className="receipt-footer">
              <div>Thank you for your purchase!</div>
              <div>Please keep this receipt.</div>
              {receipt.synced === false && (
                <div className="receipt-offline-badge">OFFLINE - PENDING SYNC</div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-slate-200 px-4 py-3">
          <button
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
          >
            <Printer className="h-4 w-4" /> Print / Save PDF
          </button>
          <button
            onClick={onNewSale}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
