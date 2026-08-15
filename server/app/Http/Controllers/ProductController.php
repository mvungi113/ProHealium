<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    use LogsActivity;

    public function index(Request $request)
    {
        $query = Product::query();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', '%' . $request->search . '%')
                  ->orWhere('sku', 'ilike', '%' . $request->search . '%');
            });
        }

        if ($request->filled('category') && $request->category !== 'All') {
            $query->where('category', $request->category);
        }

        $perPage = $request->get('per_page', 15);
        return response()->json($query->latest()->paginate($perPage));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'sku' => 'required|string|max:255|unique:products,sku',
            'quantity' => 'required|integer|min:0',
            'unit_price' => 'required|numeric|min:0',
            'expiry_date' => 'required|date',
            'supplier' => 'nullable|string|max:255',
            'reorder_level' => 'required|integer|min:0',
        ]);

        $product = Product::create($validated);

        $this->logActivity('product_created', "Created product: {$product->name} ({$product->sku})", $product, null, $validated);

        return response()->json($product, 201);
    }

    public function show(Product $product)
    {
        return response()->json($product);
    }

    public function update(Request $request, Product $product)
    {
        $oldValues = $product->toArray();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'sku' => 'required|string|max:255|unique:products,sku,' . $product->id,
            'quantity' => 'required|integer|min:0',
            'unit_price' => 'required|numeric|min:0',
            'expiry_date' => 'required|date',
            'supplier' => 'nullable|string|max:255',
            'reorder_level' => 'required|integer|min:0',
        ]);

        $product->update($validated);

        $this->logActivity('product_updated', "Updated product: {$product->name}", $product, $oldValues, $validated);

        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        $name = $product->name;
        $product->delete();

        $this->logActivity('product_deleted', "Deleted product: {$name}");

        return response()->json(['message' => 'Product deleted successfully']);
    }
}
