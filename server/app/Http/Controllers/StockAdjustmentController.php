<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockAdjustment;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockAdjustmentController extends Controller
{
    use LogsActivity;

    public function index(Request $request)
    {
        $query = StockAdjustment::with(['product', 'user'])->latest();

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return response()->json($query->paginate(50));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'type' => 'required|in:received,damaged,expired,correction,return',
            'quantity' => 'required|integer',
            'reason' => 'nullable|string|max:500',
            'reference' => 'nullable|string|max:255',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        $quantity = $validated['type'] === 'received' || $validated['type'] === 'return'
            ? abs($validated['quantity'])
            : -abs($validated['quantity']);

        $oldQuantity = $product->quantity;

        $product->increment('quantity', $quantity);

        $adjustment = StockAdjustment::create([
            'product_id' => $validated['product_id'],
            'user_id' => $request->user()?->id,
            'type' => $validated['type'],
            'quantity' => $quantity,
            'reason' => $validated['reason'],
            'reference' => $validated['reference'],
        ]);

        $this->logActivity('stock_adjusted', "Adjusted stock for {$product->name}: {$quantity} ({$validated['type']})", $product, ['quantity' => $oldQuantity], ['quantity' => $product->quantity]);

        return response()->json($adjustment->load(['product', 'user']), 201);
    }
}
