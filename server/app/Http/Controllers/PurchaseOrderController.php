<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\StockAdjustment;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class PurchaseOrderController extends Controller
{
    use LogsActivity;

    public function index(Request $request)
    {
        $query = PurchaseOrder::with(['supplier', 'items.product'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(20));
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        return response()->json($purchaseOrder->load(['supplier', 'items.product', 'user']));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'nullable|exists:suppliers,id',
            'expected_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        $poNumber = 'PO-' . str_pad(PurchaseOrder::max('id') + 1, 5, '0', STR_PAD_LEFT);
        $total = 0;

        $po = PurchaseOrder::create([
            'po_number' => $poNumber,
            'supplier_id' => $validated['supplier_id'] ?? null,
            'user_id' => $request->user()?->id,
            'status' => 'draft',
            'total' => 0,
            'expected_date' => $validated['expected_date'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        foreach ($validated['items'] as $item) {
            $product = Product::findOrFail($item['product_id']);
            $subtotal = $item['unit_cost'] * $item['quantity'];
            $total += $subtotal;

            PurchaseOrderItem::create([
                'purchase_order_id' => $po->id,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => $item['quantity'],
                'unit_cost' => $item['unit_cost'],
                'subtotal' => $subtotal,
            ]);
        }

        $po->update(['total' => $total]);

        return response()->json($po->load(['supplier', 'items.product']), 201);
    }

    public function updateStatus(Request $request, PurchaseOrder $purchaseOrder)
    {
        $validated = $request->validate([
            'status' => 'required|in:ordered,received,cancelled',
        ]);

        $oldStatus = $purchaseOrder->status;
        $purchaseOrder->update($validated);

        if ($validated['status'] === 'received') {
            $purchaseOrder->update(['received_date' => now()]);

            foreach ($purchaseOrder->items as $item) {
                if ($item->product_id) {
                    $product = Product::find($item->product_id);
                    if ($product) {
                        $oldQuantity = $product->quantity;
                        $product->update(['quantity' => $product->quantity + $item->quantity]);
                        $item->update(['received_quantity' => $item->quantity]);

                        StockAdjustment::create([
                            'product_id' => $item->product_id,
                            'user_id' => $request->user()->id,
                            'type' => 'received',
                            'quantity' => $item->quantity,
                            'reason' => "PO {$purchaseOrder->po_number} received",
                            'reference' => $purchaseOrder->po_number,
                        ]);
                    }
                }
            }
        }

        $this->logActivity('po_status_updated', "Updated PO {$purchaseOrder->po_number}: {$oldStatus} → {$validated['status']}", $purchaseOrder);

        return response()->json($purchaseOrder->load(['supplier', 'items.product']));
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'draft') {
            return response()->json(['message' => 'Only draft orders can be deleted'], 422);
        }

        $poNumber = $purchaseOrder->po_number;
        $purchaseOrder->delete();

        $this->logActivity('po_deleted', "Deleted purchase order: {$poNumber}");

        return response()->json(['message' => 'Purchase order deleted']);
    }
}
