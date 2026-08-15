<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\SaleReturnItem;
use App\Models\SaleItem;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleReturnController extends Controller
{
    use LogsActivity;

    public function index(Request $request)
    {
        $query = SaleReturn::with(['sale', 'user', 'items.product']);
        if ($request->filled('status')) $query->where('status', $request->status);
        return response()->json($query->latest()->paginate(20));
    }

    public function show(SaleReturn $saleReturn)
    {
        return response()->json($saleReturn->load(['sale', 'user', 'items.product']));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'reason' => 'required|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.sale_item_id' => 'required|exists:sale_items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $sale = Sale::findOrFail($validated['sale_id']);
        $returnNumber = 'RET-' . str_pad(SaleReturn::max('id') + 1, 5, '0', STR_PAD_LEFT);
        $refundAmount = 0;

        $return = SaleReturn::create([
            'return_number' => $returnNumber,
            'sale_id' => $sale->id,
            'user_id' => $request->user()?->id,
            'refund_amount' => 0,
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        foreach ($validated['items'] as $item) {
            $saleItem = SaleItem::findOrFail($item['sale_item_id']);
            $qty = min($item['quantity'], $saleItem->quantity);
            $subtotal = $saleItem->unit_price * $qty;
            $refundAmount += $subtotal;

            SaleReturnItem::create([
                'sale_return_id' => $return->id,
                'product_id' => $saleItem->product_id,
                'product_name' => $saleItem->product_name,
                'quantity' => $qty,
                'unit_price' => $saleItem->unit_price,
                'subtotal' => $subtotal,
            ]);

            if ($saleItem->product_id) {
                Product::where('id', $saleItem->product_id)->increment('quantity', $qty);
            }
        }

        $return->update(['refund_amount' => $refundAmount, 'status' => 'completed']);
        $this->logActivity('return_created', "Created return: {$returnNumber} for {$sale->invoice}", $return);
        return response()->json($return->load(['sale', 'user', 'items.product']), 201);
    }
}
