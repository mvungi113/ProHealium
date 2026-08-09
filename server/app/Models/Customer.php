<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'phone', 'email', 'date_of_birth', 'address',
        'medical_notes', 'loyalty_points', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];
}
