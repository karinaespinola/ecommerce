<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'default_shipping_address',
        'default_billing_address',
    ];

    protected function casts(): array
    {
        return [
            'default_shipping_address' => 'array',
            'default_billing_address' => 'array',
        ];
    }

    public function shoppingCarts(): HasMany
    {
        return $this->hasMany(ShoppingCart::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
