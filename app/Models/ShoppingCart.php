<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ShoppingCart extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'cart_product')
            ->withPivot('product_variant_id', 'quantity')
            ->withTimestamps();
    }

    public function productVariants(): BelongsToMany
    {
        return $this->belongsToMany(ProductVariant::class, 'cart_product', 'cart_id', 'product_variant_id')
            ->withPivot('product_id', 'quantity')
            ->withTimestamps();
    }

    /**
     * Get all cart items with products and their variants
     */
    public function items()
    {
        return $this->products()->get()->map(function ($product) {
            $pivot = $product->pivot;
            return [
                'product' => $product,
                'variant' => $pivot->product_variant_id ? ProductVariant::find($pivot->product_variant_id) : null,
                'quantity' => $pivot->quantity,
            ];
        });
    }
}
