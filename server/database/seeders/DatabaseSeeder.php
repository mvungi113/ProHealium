<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@prohealium.com'],
            [
                'name' => 'Dr. Emmanuel Amexo',
                'password' => bcrypt('password'),
                'role' => 'Admin',
                'status' => 'Active',
            ]
        );

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $products = [
            ['name' => 'Paracetamol 500mg', 'category' => 'Pain Relief', 'sku' => 'PCM-500-001', 'quantity' => 120, 'unit_price' => 5.99, 'expiry_date' => '2026-12-31', 'supplier' => 'MediPlus Ltd', 'reorder_level' => 30],
            ['name' => 'Amoxicillin 250mg', 'category' => 'Antibiotics', 'sku' => 'AMX-250-002', 'quantity' => 45, 'unit_price' => 12.50, 'expiry_date' => '2025-09-15', 'supplier' => 'PharmaCo Inc', 'reorder_level' => 25],
            ['name' => 'Vitamin C 1000mg', 'category' => 'Vitamins', 'sku' => 'VIT-C-003', 'quantity' => 8, 'unit_price' => 8.75, 'expiry_date' => '2027-03-20', 'supplier' => 'HealthFirst', 'reorder_level' => 20],
            ['name' => 'Ibuprofen 400mg', 'category' => 'Pain Relief', 'sku' => 'IBU-400-004', 'quantity' => 200, 'unit_price' => 7.25, 'expiry_date' => '2026-08-10', 'supplier' => 'MediPlus Ltd', 'reorder_level' => 40],
            ['name' => 'Cetirizine 10mg', 'category' => 'Antihistamines', 'sku' => 'CTZ-10-005', 'quantity' => 15, 'unit_price' => 6.99, 'expiry_date' => '2025-11-30', 'supplier' => 'AllergyCare', 'reorder_level' => 20],
            ['name' => 'Metformin 500mg', 'category' => 'Diabetes', 'sku' => 'MTF-500-006', 'quantity' => 90, 'unit_price' => 15.00, 'expiry_date' => '2026-04-22', 'supplier' => 'DiabeCare', 'reorder_level' => 30],
            ['name' => 'Aspirin 100mg', 'category' => 'Pain Relief', 'sku' => 'ASP-100-007', 'quantity' => 300, 'unit_price' => 4.50, 'expiry_date' => '2026-10-05', 'supplier' => 'MediPlus Ltd', 'reorder_level' => 50],
            ['name' => 'Loratadine 10mg', 'category' => 'Antihistamines', 'sku' => 'LOR-10-008', 'quantity' => 5, 'unit_price' => 9.25, 'expiry_date' => '2025-08-18', 'supplier' => 'AllergyCare', 'reorder_level' => 15],
        ];

        foreach ($products as $product) {
            Product::firstOrCreate(['sku' => $product['sku']], $product);
        }

        if (Sale::count() === 0) {
            $sales = [
                ['invoice' => 'INV-001', 'customer' => 'John Doe', 'amount' => 45.50, 'items' => 3, 'status' => 'Completed', 'payment_method' => 'cash'],
                ['invoice' => 'INV-002', 'customer' => 'Jane Smith', 'amount' => 78.25, 'items' => 5, 'status' => 'Completed', 'payment_method' => 'card'],
                ['invoice' => 'INV-003', 'customer' => 'Mike Johnson', 'amount' => 23.99, 'items' => 2, 'status' => 'Completed', 'payment_method' => 'cash'],
                ['invoice' => 'INV-004', 'customer' => 'Sarah Lee', 'amount' => 112.00, 'items' => 8, 'status' => 'Pending', 'payment_method' => 'card'],
                ['invoice' => 'INV-005', 'customer' => 'David Brown', 'amount' => 56.75, 'items' => 4, 'status' => 'Completed', 'payment_method' => 'cash'],
                ['invoice' => 'INV-006', 'customer' => 'Walk-in Customer', 'amount' => 89.40, 'items' => 6, 'status' => 'Completed', 'payment_method' => 'card'],
                ['invoice' => 'INV-007', 'customer' => 'Emily Davis', 'amount' => 34.20, 'items' => 2, 'status' => 'Completed', 'payment_method' => 'cash'],
                ['invoice' => 'INV-008', 'customer' => 'Chris Wilson', 'amount' => 156.80, 'items' => 9, 'status' => 'Completed', 'payment_method' => 'card'],
            ];

            foreach ($sales as $sale) {
                Sale::create(array_merge($sale, ['user_id' => 1]));
            }
        }
    }
}
