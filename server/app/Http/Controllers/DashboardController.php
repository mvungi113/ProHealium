<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $data = Cache::remember('dashboard_data', 60, function () {
            $totalSales = Sale::where('status', 'Completed')->sum('amount');
            $totalOrders = Sale::count();
            $productsInStock = Product::sum('quantity');
            $lowStockItems = Product::whereColumn('quantity', '<=', 'reorder_level')
                ->where('quantity', '>', 0)->count();
            $outOfStock = Product::where('quantity', '<=', 0)->count();
            $expiringItems = Product::whereNotNull('expiry_date')
                ->where('expiry_date', '>', now())
                ->where('expiry_date', '<=', now()->addDays(90))->count();

            $weeklySales = Sale::selectRaw('EXTRACT(DOW FROM created_at)::int as day, SUM(amount) as total')
                ->where('status', 'Completed')
                ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
                ->groupBy('day')
                ->get()
                ->map(fn($item) => ['day' => $item->day, 'total' => (float) $item->total]);

            $categoryData = Product::selectRaw('category, SUM(quantity) as value')
                ->groupBy('category')
                ->get()
                ->map(fn($item) => ['name' => $item->category, 'value' => (int) $item->value]);

            $recentSales = Sale::latest()->take(5)->get();
            $lowStockProducts = Product::whereColumn('quantity', '<=', 'reorder_level')
                ->where('quantity', '>', 0)->take(3)->get();
            $expiringProducts = Product::whereNotNull('expiry_date')
                ->where('expiry_date', '>', now())
                ->where('expiry_date', '<=', now()->addDays(90))->take(2)->get();

            return [
                'stats' => [
                    'totalSales' => (float) $totalSales,
                    'totalOrders' => $totalOrders,
                    'productsInStock' => $productsInStock,
                    'lowStockItems' => $lowStockItems,
                    'outOfStock' => $outOfStock,
                    'expiringItems' => $expiringItems,
                ],
                'weeklySales' => $weeklySales,
                'categoryData' => $categoryData,
                'recentSales' => $recentSales,
                'lowStockProducts' => $lowStockProducts,
                'expiringProducts' => $expiringProducts,
            ];
        });

        return response()->json($data);
    }
}
