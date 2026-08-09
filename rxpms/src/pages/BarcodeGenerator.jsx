import { useState, useRef, useEffect } from "react";
import { Printer, Search, Check, Package, Tag } from "lucide-react";
import { useStore } from "../store/appStore";
import { cn } from "../lib/utils";
import JsBarcode from "jsbarcode";

function BarcodeLabel({ product }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, product.sku, {
        format: "CODE128",
        width: 1.5,
        height: 40,
        displayValue: true,
        fontSize: 11,
        font: "monospace",
        textMargin: 4,
        margin: 0,
      });
    }
  }, [product.sku]);

  return (
    <div className="inline-flex flex-col items-center border border-slate-200 rounded-lg p-3 bg-white">
      <svg ref={svgRef} />
      <div className="mt-1 text-center">
        <p className="text-xs font-semibold text-slate-700 max-w-[180px] truncate">{product.name}</p>
        {product.category && <p className="text-[10px] text-slate-400">{product.category}</p>}
      </div>
    </div>
  );
}

export default function BarcodeGenerator() {
  const products = useStore((s) => s.products);
  const [selected, setSelected] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const toggleProduct = (p) => {
    setSelected((prev) =>
      prev.find((s) => s.id === p.id)
        ? prev.filter((s) => s.id !== p.id)
        : [...prev, p]
    );
  };

  const selectAll = () => {
    const matching = filtered.filter((p) => !selected.find((s) => s.id === p.id));
    setSelected((prev) => [...prev, ...matching]);
  };

  const clearSelection = () => setSelected([]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const labels = selected.flatMap((p) =>
      Array.from({ length: quantity }, () => p)
    );

    const skuList = JSON.stringify(labels.map((p) => p.sku));

    const labelHtml = labels.map((p, i) => {
      const catHtml = p.category
        ? '<div class="label-category">' + p.category + "</div>"
        : "";
      return (
        '<div class="label">' +
        '<svg id="barcode-' + i + '"></svg>' +
        '<div class="label-text">' +
        '<div class="label-name">' + p.name + "</div>" +
        catHtml +
        "</div></div>"
      );
    }).join("");

    printWindow.document.write(
      "<html><head><title>Barcode Labels</title>" +
      '<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>' +
      "<style>" +
      "@page { size: A4; margin: 10mm; }" +
      "body { font-family: monospace; margin: 0; padding: 10mm; }" +
      ".label { display: inline-block; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; margin: 4px; text-align: center; vertical-align: top; }" +
      ".label-name { font-size: 11px; font-weight: 600; color: #334155; margin-top: 4px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }" +
      ".label-category { font-size: 9px; color: #94a3b8; }" +
      "@media print { body { padding: 5mm; } .label { break-inside: avoid; } }" +
      "</style></head><body>" +
      labelHtml +
      "<script>" +
      "var skuMap = " + skuList + ";" +
      "document.querySelectorAll('svg').forEach(function(svg, i) {" +
      "  if (skuMap[i]) JsBarcode(svg, skuMap[i], { format: 'CODE128', width: 1.5, height: 40, displayValue: true, fontSize: 11, font: 'monospace', textMargin: 4, margin: 0 });" +
      "});" +
      "<\/script></body></html>"
    );
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 800);
  };

  const totalLabels = selected.length * quantity;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Barcode Generator</h1>
          <p className="text-[13px] text-slate-500">Generate and print barcode labels for products.</p>
        </div>
        <button
          onClick={handlePrint}
          disabled={selected.length === 0}
          className={cn(
            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition-all",
            selected.length > 0
              ? "bg-primary text-white shadow-primary/25 hover:bg-primary/90"
              : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
          )}
        >
          <Printer className="h-4 w-4" />
          Print {totalLabels > 0 && `(${totalLabels})`}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Products</p>
              <p className="text-lg font-bold text-slate-800">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Check className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Selected</p>
              <p className="text-lg font-bold text-slate-800">{selected.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Tag className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Qty per Label</p>
              <p className="text-lg font-bold text-slate-800">{quantity}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Printer className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Labels</p>
              <p className="text-lg font-bold text-slate-800">{totalLabels}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Product List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="flex gap-1.5">
              <button onClick={selectAll}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Select All
              </button>
              <button onClick={clearSelection}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Clear
              </button>
            </div>
          </div>

          {/* Product Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Package className="mb-3 h-12 w-12 text-slate-200" />
                  <p className="font-medium">No products found</p>
                </div>
              ) : (
                filtered.map((p) => {
                  const isSelected = selected.find((s) => s.id === p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProduct(p)}
                      className={cn(
                        "flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors",
                        isSelected ? "bg-primary/5" : "hover:bg-slate-50/50"
                      )}
                    >
                      <div className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border-2 transition-all",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-slate-300"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.sku}</p>
                      </div>
                      {p.category && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {p.category}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          {/* Quantity */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Labels per Product</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 5, 10].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuantity(q)}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-xs font-bold transition-all",
                    quantity === q
                      ? "bg-primary text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {q}x
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-700">Preview</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{selected.length} products selected</p>
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {selected.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Tag className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm font-medium">Select products to preview</p>
                  <p className="text-[10px] text-slate-400 mt-1">Click products on the left to add them</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selected.slice(0, 8).map((p) => (
                    <BarcodeLabel key={p.id} product={p} />
                  ))}
                  {selected.length > 8 && (
                    <p className="text-center text-xs text-slate-400 py-2">
                      + {selected.length - 8} more products
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
