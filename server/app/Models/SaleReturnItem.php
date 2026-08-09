<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_return_id', 'product_id', 'product_name', 'quantity',
        'unit_price', 'subtotal',
    ];

    protected $casts = ['unit_price' => 'decimal:2', 'subtotal' => 'decimal:2'];

    public function saleReturn(): BelongsTo { return $this->belongsTo(SaleReturn::class); }
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
}
