<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;

class SaleController extends Controller
{
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
        $validated = $request->validate([
            'customer' => 'nullable|string|max:255',
            'status' => 'required|in:Completed,Refunded,Cancelled',
            'payment_method' => 'required|in:cash,card,mobile_money,insurance',
        ]);

        $sale->update($validated);

        return response()->json($sale->load('saleItems'));
    }

    public function destroy(Sale $sale)
    {
        foreach ($sale->saleItems as $item) {
            if ($item->product_id) {
                Product::where('id', $item->product_id)->increment('quantity', $item->quantity);
            }
        }
        $sale->delete();

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

        $productIds = array_column($validated['items'], 'product_id');
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

        $totalAmount = 0;
        $totalItems = 0;
        $saleItems = [];

        foreach ($validated['items'] as $item) {
            $product = $products[$item['product_id']];

            if ($product->quantity < $item['quantity']) {
                return response()->json(['message' => "Not enough stock for {$product->name}"], 422);
            }

            $subtotal = $product->unit_price * $item['quantity'];
            $totalAmount += $subtotal;
            $totalItems += $item['quantity'];

            $saleItems[] = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => $item['quantity'],
                'unit_price' => $product->unit_price,
                'subtotal' => $subtotal,
            ];
        }

        $invoice = 'INV-' . strtoupper(substr(uniqid(), -8));

        $sale = Sale::create([
            'invoice' => $invoice,
            'customer' => $validated['customer'] ?? 'Walk-in Customer',
            'amount' => $totalAmount,
            'items' => $totalItems,
            'status' => 'Completed',
            'payment_method' => $validated['payment_method'],
            'user_id' => $request->user()?->id,
        ]);

        foreach ($saleItems as &$si) {
            $si['sale_id'] = $sale->id;
        }
        SaleItem::insert($saleItems);

        foreach ($validated['items'] as $item) {
            Product::where('id', $item['product_id'])->decrement('quantity', $item['quantity']);
        }

        $sale->load('saleItems');

        return response()->json($sale, 201);
    }
}
