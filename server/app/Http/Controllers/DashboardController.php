<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $products = Product::all();
        $sales = Sale::latest()->take(5)->get();

        $totalSales = Sale::where('status', 'Completed')->sum('amount');
        $totalOrders = Sale::count();
        $productsInStock = $products->sum('quantity');
        $lowStockItems = $products->where('quantity', '<=', 'reorder_level')->where('quantity', '>', 0)->count();
        $outOfStock = $products->where('quantity', '<=', 0)->count();
        $expiringItems = $products->filter(function ($p) {
            return now()->diffInDays($p->expiry_date, false) <= 90;
        })->count();

        $weeklySales = Sale::selectRaw('strftime("%w", created_at) as day, SUM(amount) as total')
            ->where('status', 'Completed')
            ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->groupBy('day')
            ->get()
            ->map(function ($item) {
                return ['day' => $item->day, 'total' => (float) $item->total];
            });

        $categoryData = $products->groupBy('category')
            ->map(function ($group, $key) {
                return ['name' => $key, 'value' => $group->sum('quantity')];
            })->values();

        $lowStockProducts = $products->where('quantity', '<=', 'reorder_level')->take(3)->values();
        $expiringProducts = $products->filter(function ($p) {
            return now()->diffInDays($p->expiry_date, false) <= 90;
        })->take(2)->values();

        return response()->json([
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
            'recentSales' => $sales,
            'lowStockProducts' => $lowStockProducts,
            'expiringProducts' => $expiringProducts,
        ]);
    }
}
