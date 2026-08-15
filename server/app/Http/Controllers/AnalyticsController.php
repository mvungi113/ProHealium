<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->get('period', 'month');
        $txPage = $request->get('tx_page', 1);
        $txPerPage = $request->get('tx_per_page', 10);

        $salesQuery = Sale::where('status', 'Completed');
        $previousSalesQuery = Sale::where('status', 'Completed');

        $start = $this->getPeriodStart($period);
        $prevStart = $this->getPreviousPeriodStart($period);

        $salesQuery->where('created_at', '>=', $start);
        $previousSalesQuery->where('created_at', '>=', $prevStart)->where('created_at', '<', $start);

        $sales = $salesQuery->get();
        $previousSales = $previousSalesQuery->get();

        $totalRevenue = $sales->sum('amount');
        $prevRevenue = $previousSales->sum('amount');
        $revenueChange = $prevRevenue > 0 ? round((($totalRevenue - $prevRevenue) / $prevRevenue) * 100, 1) : 0;

        $totalOrders = $sales->count();
        $prevOrders = $previousSales->count();
        $ordersChange = $prevOrders > 0 ? round((($totalOrders - $prevOrders) / $prevOrders) * 100, 1) : 0;

        $avgOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;
        $prevAvg = $prevOrders > 0 ? $prevRevenue / $prevOrders : 0;
        $avgChange = $prevAvg > 0 ? round((($avgOrderValue - $prevAvg) / $prevAvg) * 100, 1) : 0;

        $totalItemsSold = $sales->sum('items');
        $prevItemsSold = $previousSales->sum('items');
        $itemsChange = $prevItemsSold > 0 ? round((($totalItemsSold - $prevItemsSold) / $prevItemsSold) * 100, 1) : 0;

        $products = Product::all();
        $totalInventoryValue = $products->sum(fn ($p) => $p->unit_price * $p->quantity);
        $totalStockCount = $products->sum('quantity');
        $lowStockCount = $products->filter(fn ($p) => $p->quantity <= $p->reorder_level && $p->quantity > 0)->count();
        $outOfStockCount = $products->where('quantity', '<=', 0)->count();

        $monthly = $this->getMonthlyData($period);
        $dailySales = $this->getDailySales($period);
        $topProducts = $this->getTopProducts($period);
        $transactions = $this->getTransactions($period, $txPage, $txPerPage);
        $categoryPerformance = $this->getCategoryPerformance($period);
        $paymentBreakdown = $this->getPaymentBreakdown($period);
        $hourlySales = $this->getHourlySales($period);

        return response()->json([
            'summary' => [
                'totalRevenue' => (float) $totalRevenue,
                'revenueChange' => $revenueChange,
                'totalOrders' => $totalOrders,
                'ordersChange' => $ordersChange,
                'avgOrderValue' => (float) $avgOrderValue,
                'avgChange' => $avgChange,
                'totalItemsSold' => $totalItemsSold,
                'itemsChange' => $itemsChange,
            ],
            'inventory' => [
                'totalValue' => (float) $totalInventoryValue,
                'totalStock' => $totalStockCount,
                'lowStock' => $lowStockCount,
                'outOfStock' => $outOfStockCount,
                'totalProducts' => $products->count(),
            ],
            'monthly' => $monthly,
            'dailySales' => $dailySales,
            'topProducts' => $topProducts,
            'transactions' => $transactions,
            'categoryPerformance' => $categoryPerformance,
            'paymentBreakdown' => $paymentBreakdown,
            'hourlySales' => $hourlySales,
        ]);
    }

    private function getPeriodStart(string $period)
    {
        return match ($period) {
            'week' => now()->startOfWeek(),
            'year' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };
    }

    private function getPreviousPeriodStart(string $period)
    {
        return match ($period) {
            'week' => now()->subWeek()->startOfWeek(),
            'year' => now()->subYear()->startOfYear(),
            default => now()->subMonth()->startOfMonth(),
        };
    }

    private function getMonthlyData(string $period)
    {
        $start = match ($period) {
            'week' => now()->subWeek(),
            'year' => now()->subYear(),
            default => now()->subMonth(),
        };

        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        return Sale::selectRaw('EXTRACT(MONTH FROM created_at)::int as month, SUM(amount) as revenue, COUNT(*) as orders, SUM(items) as items_sold')
            ->where('status', 'Completed')
            ->where('created_at', '>=', $start)
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function ($item) use ($months) {
                return [
                    'name' => $months[(int) $item->month - 1],
                    'revenue' => (float) $item->revenue,
                    'orders' => (int) $item->orders,
                    'items_sold' => (int) $item->items_sold,
                ];
            });
    }

    private function getDailySales(string $period)
    {
        $start = match ($period) {
            'year' => now()->subYear(),
            default => now()->startOfMonth(),
        };

        return Sale::selectRaw('date(created_at) as date, SUM(amount) as revenue, COUNT(*) as orders')
            ->where('status', 'Completed')
            ->where('created_at', '>=', $start)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'label' => \Carbon\Carbon::parse($item->date)->format('M d'),
                    'revenue' => (float) $item->revenue,
                    'orders' => (int) $item->orders,
                ];
            });
    }

    private function getTopProducts(string $period)
    {
        $start = $this->getPeriodStart($period);

        return SaleItem::selectRaw('product_name, SUM(quantity) as sold, SUM(subtotal) as revenue, COUNT(DISTINCT sale_id) as orders')
            ->whereHas('sale', function ($q) use ($start) {
                $q->where('created_at', '>=', $start)->where('status', 'Completed');
            })
            ->groupBy('product_name')
            ->orderByDesc('sold')
            ->take(10)
            ->get();
    }

    private function getTransactions(string $period, int $page = 1, int $perPage = 10)
    {
        $start = $this->getPeriodStart($period);

        return Sale::with('saleItems')
            ->where('created_at', '>=', $start)
            ->latest()
            ->paginate($perPage, ['*'], 'page', $page);
    }

    private function getCategoryPerformance(string $period)
    {
        $start = $this->getPeriodStart($period);

        return SaleItem::selectRaw('products.category as category, SUM(sale_items.quantity) as sold, SUM(sale_items.subtotal) as revenue')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereHas('sale', function ($q) use ($start) {
                $q->where('created_at', '>=', $start)->where('status', 'Completed');
            })
            ->groupBy('products.category')
            ->orderByDesc('revenue')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->category,
                    'sold' => (int) $item->sold,
                    'revenue' => (float) $item->revenue,
                ];
            });
    }

    private function getPaymentBreakdown(string $period)
    {
        $start = $this->getPeriodStart($period);

        return Sale::selectRaw('payment_method, COUNT(*) as count, SUM(amount) as total')
            ->where('status', 'Completed')
            ->where('created_at', '>=', $start)
            ->groupBy('payment_method')
            ->get()
            ->map(function ($item) {
                return [
                    'method' => ucfirst($item->payment_method),
                    'count' => (int) $item->count,
                    'total' => (float) $item->total,
                ];
            });
    }

    private function getHourlySales(string $period)
    {
        $start = $this->getPeriodStart($period);

        return Sale::selectRaw('EXTRACT(HOUR FROM created_at)::int as hour, SUM(amount) as revenue, COUNT(*) as orders')
            ->where('status', 'Completed')
            ->where('created_at', '>=', $start)
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->map(function ($item) {
                $h = (int) $item->hour;
                return [
                    'hour' => str_pad($h, 2, '0') . ':00',
                    'revenue' => (float) $item->revenue,
                    'orders' => (int) $item->orders,
                ];
            });
    }
}
