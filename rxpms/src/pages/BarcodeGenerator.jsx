import { useState, useRef } from "react";
import { Printer, Download, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { useStore } from "../store/appStore";
import { cn } from "../lib/utils";

export default function BarcodeGenerator() {
  const products = useStore((s) => s.products);
  const [selected, setSelected] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [search, setSearch] = useState("");
  const printRef = useRef();

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const toggleProduct = (p) => {
    setSelected((prev) => prev.find((s) => s.id === p.id) ? prev.filter((s) => s.id !== p.id) : [...prev, p]);
  };

  const selectAll = () => {
    const matching = filtered.filter((p) => !selected.find((s) => s.id === p.id));
    setSelected((prev) => [...prev, ...matching]);
  };

  const clearSelection = () => setSelected([]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const labels = selected.map((p) => `
      <div style="display:inline-block;border:1px solid #ccc;padding:8px;margin:4px;width:200px;font-family:monospace;text-align:center;">
        <div style="font-size:10px;color:#666;">${p.sku}</div>
        <div style="font-size:13px;font-weight:bold;margin:4px 0;">${p.name}</div>
        <div style="font-size:20px;font-weight:bold;">||||| ${p.sku} |||||</div>
        <div style="font-size:9px;color:#888;margin-top:4px;">${p.category}</div>
      </div>
    `).join("");

    printWindow.document.write(`
      <html><head><title>Barcodes</title><style>@media print{body{margin:0;}}</style></head>
      <body>${labels}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-800">Barcode Generator</h1><p className="text-[13px] text-slate-500">Generate and print barcode labels for products.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} disabled={selected.length === 0}><Printer className="mr-2 h-4 w-4" /> Print ({selected.length})</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
                <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>Clear</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead className="w-10"></TableHead><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Category</TableHead></TableRow></TableHeader>
                <TableBody>{filtered.map((p) => (
                  <TableRow key={p.id} className={cn("cursor-pointer", selected.find((s) => s.id === p.id) && "bg-primary-50")} onClick={() => toggleProduct(p)}>
                    <TableCell><input type="checkbox" checked={!!selected.find((s) => s.id === p.id)} onChange={() => toggleProduct(p)} className="h-4 w-4 accent-primary" /></TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-slate-500">{p.sku}</TableCell>
                    <TableCell>{p.category}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="sticky top-24">
            <CardHeader><CardTitle className="text-sm">Preview ({selected.length} labels)</CardTitle></CardHeader>
            <CardContent>
              {selected.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">Select products to preview</div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {selected.slice(0, 10).map((p) => (
                    <div key={p.id} className="rounded-lg border border-slate-200 p-3 text-center font-mono">
                      <div className="text-[10px] text-slate-500">{p.sku}</div>
                      <div className="text-xs font-semibold my-1">{p.name}</div>
                      <div className="text-lg tracking-widest">||||| {p.sku} |||||</div>
                      <div className="text-[9px] text-slate-400 mt-1">{p.category}</div>
                    </div>
                  ))}
                  {selected.length > 10 && <p className="text-center text-xs text-slate-400">...and {selected.length - 10} more</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


