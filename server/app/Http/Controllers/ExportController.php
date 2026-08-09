<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\SaleReturn;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ExportController extends Controller
{
    public function export(Request $request, string $type)
    {
        $format = $request->get('format', 'excel');
        $from = $request->get('from', now()->startOfMonth()->toDateString());
        $to = $request->get('to', now()->toDateString());

        $method = match ($type) {
            'transactions' => 'exportTransactions',
            'top-products' => 'exportTopProducts',
            'daily-sales' => 'exportDailySales',
            'categories' => 'exportCategories',
            'inventory' => 'exportInventory',
            'financial' => 'exportFinancial',
            default => null,
        };

        if (!$method) {
            return response()->json(['message' => 'Invalid export type'], 400);
        }

        return $this->$method($format, $from, $to);
    }

    private function exportTransactions(string $format, string $from, string $to)
    {
        $data = Sale::with('saleItems')
            ->where('created_at', '>=', $from)
            ->where('created_at', '<=', $to . ' 23:59:59')
            ->latest()
            ->get()
            ->map(fn($sale) => [
                'Invoice' => $sale->invoice,
                'Customer' => $sale->customer,
                'Date' => $sale->created_at->format('Y-m-d H:i'),
                'Items' => $sale->items,
                'Amount' => number_format($sale->amount, 2),
                'Payment' => ucfirst($sale->payment_method),
                'Status' => $sale->status,
            ]);

        $filename = "transactions_{$from}_{$to}";

        if ($format === 'pdf') {
            return $this->pdfDownload($data->toArray(), $filename, 'Transactions Report', ['Invoice', 'Customer', 'Date', 'Items', 'Amount', 'Payment', 'Status']);
        }
        return $this->excelDownload($data->toArray(), $filename, 'Transactions', ['Invoice', 'Customer', 'Date', 'Items', 'Amount', 'Payment', 'Status']);
    }

    private function exportTopProducts(string $format, string $from, string $to)
    {
        $data = SaleItem::selectRaw('product_name, SUM(quantity) as sold, SUM(subtotal) as revenue, COUNT(DISTINCT sale_id) as orders')
            ->whereHas('sale', fn($q) => $q->where('created_at', '>=', $from)->where('created_at', '<=', $to . ' 23:59:59')->where('status', 'Completed'))
            ->groupBy('product_name')
            ->orderByDesc('sold')
            ->take(50)
            ->get()
            ->map(fn($p, $i) => [
                '#' => $i + 1,
                'Product' => $p->product_name,
                'Units Sold' => $p->sold,
                'Orders' => $p->orders,
                'Revenue' => number_format($p->revenue, 2),
            ]);

        $filename = "top_products_{$from}_{$to}";

        if ($format === 'pdf') {
            return $this->pdfDownload($data->toArray(), $filename, 'Top Selling Products', ['#', 'Product', 'Units Sold', 'Orders', 'Revenue']);
        }
        return $this->excelDownload($data->toArray(), $filename, 'Top Products', ['#', 'Product', 'Units Sold', 'Orders', 'Revenue']);
    }

    private function exportDailySales(string $format, string $from, string $to)
    {
        $sales = Sale::where('status', 'Completed')
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->get();

        $data = $sales->groupBy(fn($s) => $s->created_at->format('Y-m-d'))
            ->map(fn($group) => [
                'Date' => $group->first()->created_at->format('M d, Y'),
                'Orders' => $group->count(),
                'Revenue' => number_format($group->sum('amount'), 2),
                'Avg Order' => number_format($group->sum('amount') / $group->count(), 2),
            ])
            ->values();

        $filename = "daily_sales_{$from}_{$to}";

        if ($format === 'pdf') {
            return $this->pdfDownload($data->toArray(), $filename, 'Daily Sales Report', ['Date', 'Orders', 'Revenue', 'Avg Order']);
        }
        return $this->excelDownload($data->toArray(), $filename, 'Daily Sales', ['Date', 'Orders', 'Revenue', 'Avg Order']);
    }

    private function exportCategories(string $format, string $from, string $to)
    {
        $data = SaleItem::selectRaw('products.category as category, SUM(sale_items.quantity) as sold, SUM(sale_items.subtotal) as revenue')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereHas('sale', fn($q) => $q->where('created_at', '>=', $from)->where('created_at', '<=', $to . ' 23:59:59')->where('status', 'Completed'))
            ->groupBy('products.category')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn($c) => [
                'Category' => $c->category,
                'Units Sold' => $c->sold,
                'Revenue' => number_format($c->revenue, 2),
            ]);

        $filename = "category_performance_{$from}_{$to}";

        if ($format === 'pdf') {
            return $this->pdfDownload($data->toArray(), $filename, 'Category Performance', ['Category', 'Units Sold', 'Revenue']);
        }
        return $this->excelDownload($data->toArray(), $filename, 'Categories', ['Category', 'Units Sold', 'Revenue']);
    }

    private function exportInventory(string $format)
    {
        $products = Product::all()->map(fn($p) => [
            'Name' => $p->name,
            'SKU' => $p->sku,
            'Category' => $p->category,
            'Quantity' => $p->quantity,
            'Unit Price' => number_format($p->unit_price, 2),
            'Stock Value' => number_format($p->quantity * $p->unit_price, 2),
            'Reorder Level' => $p->reorder_level,
            'Expiry Date' => $p->expiry_date,
            'Supplier' => $p->supplier ?? '—',
            'Status' => $p->quantity <= 0 ? 'Out of Stock' : ($p->quantity <= $p->reorder_level ? 'Low Stock' : 'In Stock'),
        ]);

        $filename = "inventory_" . now()->format('Y-m-d');

        if ($format === 'pdf') {
            return $this->pdfDownload($products->toArray(), $filename, 'Inventory Report', ['Name', 'SKU', 'Category', 'Quantity', 'Unit Price', 'Stock Value', 'Reorder Level', 'Expiry Date', 'Supplier', 'Status']);
        }
        return $this->excelDownload($products->toArray(), $filename, 'Inventory', ['Name', 'SKU', 'Category', 'Quantity', 'Unit Price', 'Stock Value', 'Reorder Level', 'Expiry Date', 'Supplier', 'Status']);
    }

    private function exportFinancial(string $format, string $from, string $to)
    {
        $sales = Sale::where('status', 'Completed')
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->get();

        $refunds = SaleReturn::where('status', 'completed')
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->sum('refund_amount');

        $grossRevenue = (float) $sales->sum('amount');

        $daily = $sales->groupBy(fn($s) => $s->created_at->format('Y-m-d'))
            ->map(fn($group) => [
                'Date' => $group->first()->created_at->format('M d, Y'),
                'Orders' => $group->count(),
                'Revenue' => number_format($group->sum('amount'), 2),
                'Avg Order' => number_format($group->sum('amount') / $group->count(), 2),
            ])
            ->values();

        $summary = [
            ['Metric', 'Value'],
            ['Period', "{$from} to {$to}"],
            ['Gross Revenue', number_format($grossRevenue, 2)],
            ['Refunds', number_format($refunds, 2)],
            ['Net Revenue', number_format($grossRevenue - $refunds, 2)],
            ['Cash Sales', number_format($sales->where('payment_method', 'cash')->sum('amount'), 2)],
            ['Card Sales', number_format($sales->where('payment_method', 'card')->sum('amount'), 2)],
            ['Total Orders', $sales->count()],
        ];

        $filename = "financial_{$from}_{$to}";

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('exports.financial', ['summary' => $summary, 'daily' => $daily->toArray()]);
            return $pdf->download("{$filename}.pdf");
        }

        return Excel::download(new class($summary, $daily) implements FromCollection, WithHeadings, WithMapping, WithStyles {
            private $summary;
            private $daily;
            private $row = 0;

            public function __construct($summary, $daily) { $this->summary = $summary; $this->daily = $daily; }
            public function collection() { return collect($this->daily); }
            public function headings(): array { return ['Date', 'Orders', 'Revenue', 'Avg Order']; }
            public function map($row): array { return [$row['Date'], $row['Orders'], $row['Revenue'], $row['Avg Order']]; }
            public function styles(Worksheet $sheet): array { return [1 => ['font' => ['bold' => true]]]; }
        }, "{$filename}.xlsx");
    }

    private function excelDownload(array $data, string $filename, string $sheetName, array $headings)
    {
        return Excel::download(new class($data, $headings) implements FromCollection, WithHeadings, WithMapping, WithStyles {
            private $data;
            private $headings;

            public function __construct($data, $headings) { $this->data = $data; $this->headings = $headings; }
            public function collection() { return collect($this->data); }
            public function headings(): array { return $this->headings; }
            public function map($row): array { return array_values($row); }
            public function styles(Worksheet $sheet): array { return [1 => ['font' => ['bold' => true]]]; }
        }, "{$filename}.xlsx");
    }

    private function pdfDownload(array $data, string $filename, string $title, array $headings)
    {
        $pdf = Pdf::loadView('exports.table', [
            'title' => $title,
            'headings' => $headings,
            'data' => $data,
        ]);
        $pdf->setPaper('a4', 'landscape');
        return $pdf->download("{$filename}.pdf");
    }
}
