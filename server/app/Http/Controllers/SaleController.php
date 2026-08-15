<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    use LogsActivity;

    public function index()
    {
        return response()->json(
            Sale::with('saleItems')->latest()->paginate(20)
        );
    }

    public function show(Sale $sale)
    {
        return response()->json($sale->load('saleItems'));
    }

    public function update(Request $request, Sale $sale)
    {
        $oldValues = $sale->toArray();

        $validated = $request->validate([
            'customer' => 'nullable|string|max:255',
            'status' => 'required|in:Completed,Refunded,Cancelled',
            'payment_method' => 'required|in:cash,card,mobile_money,insurance',
        ]);

        $sale->update($validated);

        $this->logActivity('sale_updated', "Updated sale: {$sale->invoice}", $sale, $oldValues, $validated);

        return response()->json($sale->load('saleItems'));
    }

    public function destroy(Sale $sale)
    {
        $invoice = $sale->invoice;

        foreach ($sale->saleItems as $item) {
            if ($item->product_id) {
                Product::where('id', $item->product_id)->increment('quantity', $item->quantity);
            }
        }
        $sale->delete();

        $this->logActivity('sale_deleted', "Deleted sale: {$invoice}");

        return response()->json(['message' => 'Sale deleted successfully']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer' => 'nullable|string|max:255',
            'payment_method' => 'required|in:cash,card,mobile_money,insurance',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $invoice = 'INV-' . strtoupper(substr(uniqid(), -8));
        $totalAmount = 0;
        $totalItems = 0;

        $sale = Sale::create([
            'invoice' => $invoice,
            'customer' => $validated['customer'] ?? 'Walk-in Customer',
            'amount' => 0,
            'items' => 0,
            'status' => 'Completed',
            'payment_method' => $validated['payment_method'],
            'user_id' => $request->user()?->id,
        ]);

        foreach ($validated['items'] as $item) {
            $product = Product::findOrFail($item['product_id']);

            if ($product->quantity < $item['quantity']) {
                return response()->json(['message' => "Not enough stock for {$product->name}"], 422);
            }

            $subtotal = $product->unit_price * $item['quantity'];
            $totalAmount += $subtotal;
            $totalItems += $item['quantity'];

            SaleItem::create([
                'sale_id' => $sale->id,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => $item['quantity'],
                'unit_price' => $product->unit_price,
                'subtotal' => $subtotal,
            ]);

            $product->decrement('quantity', $item['quantity']);
        }

        $sale->update([
            'amount' => $totalAmount,
            'items' => $totalItems,
        ]);

        $this->logActivity('sale_created', "Created sale: {$invoice}", $sale, null, [
            'invoice' => $invoice,
            'customer' => $validated['customer'] ?? 'Walk-in Customer',
            'amount' => $totalAmount,
            'items' => $totalItems,
            'payment_method' => $validated['payment_method'],
        ]);

        return response()->json($sale->load('saleItems'), 201);
    }
}
