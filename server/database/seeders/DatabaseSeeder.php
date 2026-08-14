<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Setting;
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

        $defaultSettings = [
            'pharmacy_name' => 'ProHealium Pharmacy',
            'license_number' => 'PH-2025-001234',
            'pharmacy_email' => 'info@prohealium.com',
            'pharmacy_phone' => '+233 20 123 4567',
            'pharmacy_address' => '123 Health Avenue, Accra, Ghana',
            'pharmacy_about' => 'ProHealium Pharmacy provides quality healthcare products and professional pharmaceutical services.',
            'low_stock_alerts' => 'true',
            'expiry_alerts' => 'true',
            'daily_sales_summary' => 'false',
            'new_user_registration' => 'true',
            'tax_rate' => '10',
            'currency' => 'USD ($)',
            'payment_methods' => 'Cash,Card',
        ];

        foreach ($defaultSettings as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        if (Sale::count() === 0) {
            $products = Product::all();

            $saleDefinitions = [
                ['invoice' => 'INV-001', 'customer' => 'John Doe', 'status' => 'Completed', 'payment_method' => 'cash', 'day_offset' => -6, 'items' => [
                    ['sku' => 'PCM-500-001', 'qty' => 3],
                    ['sku' => 'VIT-C-003', 'qty' => 2],
                    ['sku' => 'ASP-100-007', 'qty' => 1],
                ]],
                ['invoice' => 'INV-002', 'customer' => 'Jane Smith', 'status' => 'Completed', 'payment_method' => 'card', 'day_offset' => -5, 'items' => [
                    ['sku' => 'AMX-250-002', 'qty' => 2],
                    ['sku' => 'MTF-500-006', 'qty' => 1],
                    ['sku' => 'PCM-500-001', 'qty' => 3],
                ]],
                ['invoice' => 'INV-003', 'customer' => 'Mike Johnson', 'status' => 'Completed', 'payment_method' => 'cash', 'day_offset' => -4, 'items' => [
                    ['sku' => 'IBU-400-004', 'qty' => 2],
                    ['sku' => 'CTZ-10-005', 'qty' => 1],
                ]],
                ['invoice' => 'INV-004', 'customer' => 'Sarah Lee', 'status' => 'Completed', 'payment_method' => 'card', 'day_offset' => -3, 'items' => [
                    ['sku' => 'AMX-250-002', 'qty' => 4],
                    ['sku' => 'MTF-500-006', 'qty' => 2],
                    ['sku' => 'PCM-500-001', 'qty' => 2],
                ]],
                ['invoice' => 'INV-005', 'customer' => 'David Brown', 'status' => 'Completed', 'payment_method' => 'cash', 'day_offset' => -2, 'items' => [
                    ['sku' => 'VIT-C-003', 'qty' => 4],
                    ['sku' => 'LOR-10-008', 'qty' => 2],
                ]],
                ['invoice' => 'INV-006', 'customer' => 'Walk-in Customer', 'status' => 'Completed', 'payment_method' => 'card', 'day_offset' => -1, 'items' => [
                    ['sku' => 'ASP-100-007', 'qty' => 6],
                    ['sku' => 'IBU-400-004', 'qty' => 3],
                    ['sku' => 'PCM-500-001', 'qty' => 3],
                ]],
                ['invoice' => 'INV-007', 'customer' => 'Emily Davis', 'status' => 'Completed', 'payment_method' => 'cash', 'day_offset' => 0, 'items' => [
                    ['sku' => 'CTZ-10-005', 'qty' => 2],
                    ['sku' => 'VIT-C-003', 'qty' => 2],
                ]],
                ['invoice' => 'INV-008', 'customer' => 'Chris Wilson', 'status' => 'Completed', 'payment_method' => 'card', 'day_offset' => 0, 'items' => [
                    ['sku' => 'AMX-250-002', 'qty' => 5],
                    ['sku' => 'MTF-500-006', 'qty' => 3],
                    ['sku' => 'PCM-500-001', 'qty' => 1],
                ]],
            ];

            foreach ($saleDefinitions as $def) {
                $totalAmount = 0;
                $totalItems = 0;
                $saleItems = [];

                foreach ($def['items'] as $item) {
                    $product = $products->firstWhere('sku', $item['sku']);
                    if ($product) {
                        $subtotal = $product->unit_price * $item['qty'];
                        $totalAmount += $subtotal;
                        $totalItems += $item['qty'];
                        $saleItems[] = [
                            'product_id' => $product->id,
                            'product_name' => $product->name,
                            'quantity' => $item['qty'],
                            'unit_price' => $product->unit_price,
                            'subtotal' => $subtotal,
                        ];
                    }
                }

                $createdAt = now()->startOfWeek()->addDays($def['day_offset'] + 7)->addHours(rand(8, 18))->addMinutes(rand(0, 59));

                $sale = Sale::create([
                    'invoice' => $def['invoice'],
                    'customer' => $def['customer'],
                    'amount' => $totalAmount,
                    'items' => $totalItems,
                    'status' => $def['status'],
                    'payment_method' => $def['payment_method'],
                    'user_id' => 1,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);

                foreach ($saleItems as $si) {
                    SaleItem::create(array_merge($si, [
                        'sale_id' => $sale->id,
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ]));
                }
            }
        }
    }
}
