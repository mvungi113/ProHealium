<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    use LogsActivity;

    public function index(Request $request)
    {
        $query = Customer::query();
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($qr) use ($q) {
                $qr->where('name', 'ilike', "%{$q}%")->orWhere('phone', 'ilike', "%{$q}%")->orWhere('email', 'ilike', "%{$q}%");
            });
        }
        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string',
            'medical_notes' => 'nullable|string',
        ]);
        $customer = Customer::create($validated);
        $this->logActivity('customer_created', "Created customer: {$customer->name}", $customer);
        return response()->json($customer, 201);
    }

    public function show(Customer $customer) { return response()->json($customer); }

    public function update(Request $request, Customer $customer)
    {
        $old = $customer->toArray();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string',
            'medical_notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
        $customer->update($validated);
        $this->logActivity('customer_updated', "Updated customer: {$customer->name}", $customer, $old);
        return response()->json($customer);
    }

    public function destroy(Customer $customer)
    {
        $name = $customer->name;
        $customer->delete();
        $this->logActivity('customer_deleted', "Deleted customer: {$name}");
        return response()->json(['message' => 'Customer deleted']);
    }
}
