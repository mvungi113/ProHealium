<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->index('status');
            $table->index('created_at');
            $table->index('payment_method');
            $table->index('user_id');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index('category');
            $table->index('quantity');
            $table->index('expiry_date');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->index('sale_id');
            $table->index('product_id');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index('type');
            $table->index('is_read');
            $table->index('user_id');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index('action');
            $table->index('user_id');
            $table->index('created_at');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->index('name');
        });

        Schema::table('stock_adjustments', function (Blueprint $table) {
            $table->index('type');
            $table->index('created_at');
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at', 'payment_method', 'user_id']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['category', 'quantity', 'expiry_date']);
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropIndex(['sale_id', 'product_id']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['type', 'is_read', 'user_id']);
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex(['action', 'user_id', 'created_at']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['name']);
        });

        Schema::table('stock_adjustments', function (Blueprint $table) {
            $table->dropIndex(['type', 'created_at']);
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });
    }
};
