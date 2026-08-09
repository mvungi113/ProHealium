<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\SaleReturn;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function sales(Request $request)
    {
        $from = $request->get('from', now()->startOfMonth()->toDateString());
        $to = $request->get('to', now()->toDateString());

        $sales = Sale::where('status', 'Completed')
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->get();

        $topProducts = SaleItem::selectRaw('product_name, SUM(quantity) as total_qty, SUM(subtotal) as total_revenue')
            ->whereHas('sale', fn($q) => $q->where('status', 'Completed')->whereDate('created_at', '>=', $from)->whereDate('created_at', '<=', $to))
            ->groupBy('product_name')
            ->orderByDesc('total_revenue')
            ->take(10)
            ->get();

        $dailySales = $sales->groupBy(fn($s) => $s->created_at->format('Y-m-d'))
            ->map(fn($group) => [
                'date' => $group->first()->created_at->format('M d'),
                'revenue' => $group->sum('amount'),
                'orders' => $group->count(),
            ])
            ->values();

        $paymentBreakdown = $sales->groupBy('payment_method')
            ->map(fn($group) => $group->sum('amount'))
            ->toArray();

        $categoryBreakdown = SaleItem::selectRaw('product_name, SUM(quantity) as orders, SUM(subtotal) as revenue')
            ->whereHas('sale', fn($q) => $q->where('status', 'Completed')->whereDate('created_at', '>=', $from)->whereDate('created_at', '<=', $to))
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->selectRaw('products.category as category, SUM(sale_items.quantity) as orders, SUM(sale_items.subtotal) as revenue')
            ->groupBy('products.category')
            ->get();

        return response()->json([
            'summary' => [
                'total_sales' => (float) $sales->sum('amount'),
                'total_orders' => $sales->count(),
                'avg_order' => $sales->count() > 0 ? (float) ($sales->sum('amount') / $sales->count()) : 0,
                'total_items' => (int) $sales->sum('items'),
            ],
            'top_products' => $topProducts,
            'daily_sales' => $dailySales,
            'payment_breakdown' => $paymentBreakdown,
            'category_breakdown' => $categoryBreakdown,
            'period' => ['from' => $from, 'to' => $to],
        ]);
    }

    public function inventory()
    {
        $products = Product::all();
        $totalValue = (float) $products->sum(fn($p) => $p->quantity * $p->unit_price);
        $lowStock = $products->filter(fn($p) => $p->quantity <= $p->reorderLevel && $p->quantity > 0);
        $outOfStock = $products->filter(fn($p) => $p->quantity <= 0);
        $expiringSoon = $products->filter(fn($p) => $p->expiry_date && Carbon::parse($p->expiry_date)->diffInDays(now()) <= 90);

        $categoryBreakdown = $products->groupBy('category')->map(fn($items) => [
            'count' => $items->count(),
            'value' => (float) $items->sum(fn($p) => $p->quantity * $p->unit_price),
        ]);

        return response()->json([
            'total_products' => $products->count(),
            'total_value' => $totalValue,
            'low_stock_count' => $lowStock->count(),
            'out_of_stock_count' => $outOfStock->count(),
            'expiring_soon_count' => $expiringSoon->count(),
            'category_breakdown' => $categoryBreakdown,
            'low_stock_products' => $lowStock->values(),
            'expiring_products' => $expiringSoon->values(),
        ]);
    }

    public function financial(Request $request)
    {
        $from = $request->get('from', now()->startOfMonth()->toDateString());
        $to = $request->get('to', now()->toDateString());

        $sales = Sale::where('status', 'Completed')
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->get();

        $refunds = SaleReturn::where('status', 'completed')
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->sum('refund_amount');

        $daily = $sales->groupBy(fn($s) => $s->created_at->format('Y-m-d'))
            ->map(fn($group) => [
                'date' => $group->first()->created_at->format('M d'),
                'revenue' => (float) $group->sum('amount'),
                'orders' => $group->count(),
            ])
            ->values();

        $grossRevenue = (float) $sales->sum('amount');

        return response()->json([
            'revenue' => $grossRevenue,
            'orders' => $sales->count(),
            'cash_sales' => (float) $sales->where('payment_method', 'cash')->sum('amount'),
            'card_sales' => (float) $sales->where('payment_method', 'card')->sum('amount'),
            'refunds' => (float) $refunds,
            'net_revenue' => $grossRevenue - (float) $refunds,
            'daily' => $daily,
            'period' => ['from' => $from, 'to' => $to],
        ]);
    }
}
