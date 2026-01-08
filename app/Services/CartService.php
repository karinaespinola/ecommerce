<?php

namespace App\Services;

use App\Models\ShoppingCart;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Collection;

class CartService
{
    /**
     * Get cart items for a customer.
     */
    public function getCartItems(int $customerId): Collection
    {
        return ShoppingCart::query()
            ->where('customer_id', $customerId)
            ->with([
                'product.images',
                'product.categories',
                'productVariant.images',
                'productVariant.attributes'
            ])
            ->get();
    }

    /**
     * Get cart item count for a customer.
     */
    public function getCartItemCount(int $customerId): int
    {
        return ShoppingCart::query()
            ->where('customer_id', $customerId)
            ->sum('quantity');
    }

    /**
     * Add item to cart.
     */
    public function addToCart(int $customerId, int $productId, ?int $productVariantId = null, int $quantity = 1): ShoppingCart
    {
        // Validate product exists and is active
        $product = Product::where('id', $productId)
            ->where('is_active', true)
            ->firstOrFail();

        // If variant is provided, validate it
        if ($productVariantId) {
            $variant = ProductVariant::where('id', $productVariantId)
                ->where('product_id', $productId)
                ->where('is_active', true)
                ->firstOrFail();

            // Check stock if variant has stock management
            if ($variant->stock !== null && $variant->stock < $quantity) {
                throw new \Exception('Insufficient stock available.');
            }
        }

        // Check if item already exists in cart
        $existingCart = ShoppingCart::query()
            ->where('customer_id', $customerId)
            ->where('product_id', $productId)
            ->where('product_variant_id', $productVariantId)
            ->first();

        if ($existingCart) {
            // Update quantity
            $newQuantity = $existingCart->quantity + $quantity;
            
            // Check stock if variant exists
            if ($productVariantId && $variant->stock !== null && $variant->stock < $newQuantity) {
                throw new \Exception('Insufficient stock available.');
            }

            $existingCart->update(['quantity' => $newQuantity]);
            return $existingCart->fresh(['product.images', 'productVariant.images']);
        }

        // Create new cart item
        return ShoppingCart::create([
            'customer_id' => $customerId,
            'product_id' => $productId,
            'product_variant_id' => $productVariantId,
            'quantity' => $quantity,
        ])->load(['product.images', 'productVariant.images']);
    }

    /**
     * Update cart item quantity.
     */
    public function updateCartItem(int $customerId, int $cartId, int $quantity): ShoppingCart
    {
        $cart = ShoppingCart::with(['product', 'productVariant'])
            ->where('id', $cartId)
            ->where('customer_id', $customerId)
            ->firstOrFail();

        if ($quantity <= 0) {
            $cart->delete();
            throw new \Exception('Item removed from cart.');
        }

        // Check stock if variant exists
        if ($cart->product_variant_id && $cart->productVariant) {
            if ($cart->productVariant->stock !== null && $cart->productVariant->stock < $quantity) {
                throw new \Exception('Insufficient stock available.');
            }
        }

        $cart->update(['quantity' => $quantity]);
        return $cart->fresh(['product.images', 'productVariant.images']);
    }

    /**
     * Remove item from cart.
     */
    public function removeFromCart(int $customerId, int $cartId): bool
    {
        $cart = ShoppingCart::query()
            ->where('id', $cartId)
            ->where('customer_id', $customerId)
            ->firstOrFail();

        return $cart->delete();
    }

    /**
     * Clear entire cart for a customer.
     */
    public function clearCart(int $customerId): int
    {
        return ShoppingCart::query()
            ->where('customer_id', $customerId)
            ->delete();
    }
}
