<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SaleReturnController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/seed-default-user', [AuthController::class, 'seedDefaultUser']);

Route::get('/debug/test-sale', function () {
    try {
        $conn = DB::connection();
        $tables = $conn->select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
        return response()->json([
            'driver' => $conn->getConfig('driver'),
            'database' => $conn->getConfig('database'),
            'tables' => array_map(fn($t) => $t->table_name, $tables),
            'user_count' => \App\Models\User::count(),
            'product_count' => \App\Models\Product::count(),
            'sale_count' => \App\Models\Sale::count(),
        ]);
    } catch (\Throwable $e) {
        return response()->json(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
    }
});

Route::post('/debug/test-sale', function (\Illuminate\Http\Request $request) {
    try {
        $user = $request->user();
        $product = \App\Models\Product::firstOrFail();
        $invoice = 'TEST-' . time();

        $sale = \App\Models\Sale::create([
            'invoice' => $invoice,
            'customer' => 'Debug Customer',
            'amount' => 10.00,
            'items' => 1,
            'status' => 'Completed',
            'payment_method' => 'cash',
            'user_id' => $user?->id,
        ]);

        return response()->json(['success' => true, 'sale_id' => $sale->id, 'invoice' => $invoice]);
    } catch (\Throwable $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ], 500);
    }
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/analytics', [AnalyticsController::class, 'index']);

    Route::apiResource('products', ProductController::class);
    Route::apiResource('sales', SaleController::class);
    Route::apiResource('users', UserController::class);

    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings', [SettingsController::class, 'update']);

    Route::get('/activity-logs', [ActivityLogController::class, 'index']);

    Route::apiResource('suppliers', SupplierController::class);
    Route::apiResource('stock-adjustments', StockAdjustmentController::class)->only(['index', 'store']);
    Route::apiResource('purchase-orders', PurchaseOrderController::class);
    Route::patch('/purchase-orders/{purchaseOrder}/status', [PurchaseOrderController::class, 'updateStatus']);

    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('categories', CategoryController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('sale-returns', SaleReturnController::class)->only(['index', 'show', 'store']);

    Route::get('/reports/sales', [ReportController::class, 'sales']);
    Route::get('/reports/inventory', [ReportController::class, 'inventory']);
    Route::get('/reports/financial', [ReportController::class, 'financial']);

    Route::get('/export/{type}', [\App\Http\Controllers\ExportController::class, 'export']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/check-alerts', [NotificationController::class, 'checkAlerts']);

    Route::post('/debug/stock-adjustment', function (\Illuminate\Http\Request $request) {
        try {
            $validated = $request->validate([
                'product_id' => 'required|exists:products,id',
                'type' => 'required|in:received,damaged,expired,correction,return',
                'quantity' => 'required|integer',
                'reason' => 'nullable|string|max:500',
                'reference' => 'nullable|string|max:255',
            ]);
            $product = \App\Models\Product::findOrFail($validated['product_id']);
            $quantity = $validated['type'] === 'received' ? abs($validated['quantity']) : -abs($validated['quantity']);
            $product->update(['quantity' => $product->quantity + $quantity]);
            $adjustment = \App\Models\StockAdjustment::create([
                'product_id' => $validated['product_id'],
                'user_id' => $request->user()?->id,
                'type' => $validated['type'],
                'quantity' => $quantity,
                'reason' => $validated['reason'] ?? null,
                'reference' => $validated['reference'] ?? null,
            ]);
            return response()->json(['success' => true, 'id' => $adjustment->id]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()], 500);
        }
    });

    Route::post('/debug/test-controller-stock', function (\Illuminate\Http\Request $request) {
        try {
            $controller = new \App\Http\Controllers\StockAdjustmentController();
            return $controller->store($request);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine(), 'trace' => $e->getTraceAsString()], 500);
        }
    });

    Route::post('/debug/test-controller-po', function (\Illuminate\Http\Request $request) {
        try {
            $controller = new \App\Http\Controllers\PurchaseOrderController();
            return $controller->store($request);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine(), 'trace' => $e->getTraceAsString()], 500);
        }
    });

    Route::post('/debug/purchase-order', function (\Illuminate\Http\Request $request) {
        try {
            $validated = $request->validate([
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_cost' => 'required|numeric|min:0',
            ]);
            $po = \App\Models\PurchaseOrder::create([
                'po_number' => 'PO-DEBUG-' . time(),
                'status' => 'draft',
                'total' => 0,
                'user_id' => $request->user()?->id,
            ]);
            return response()->json(['success' => true, 'id' => $po->id]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()], 500);
        }
    });
});
