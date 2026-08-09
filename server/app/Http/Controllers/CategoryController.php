<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use LogsActivity;

    public function index() { return response()->json(Category::orderBy('sort_order')->get()); }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
        ]);
        $category = Category::create($validated);
        $this->logActivity('category_created', "Created category: {$category->name}", $category);
        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);
        $category->update($validated);
        $this->logActivity('category_updated', "Updated category: {$category->name}", $category);
        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        $name = $category->name;
        $category->delete();
        $this->logActivity('category_deleted', "Deleted category: {$name}");
        return response()->json(['message' => 'Category deleted']);
    }
}
