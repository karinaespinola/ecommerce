<?php

namespace App\Services;

use App\Models\ShoppingCart;
use App\Models\CartProduct;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class CartService
{
    /**
     * Get or create a shopping cart for a customer.
     */
    protected function getOrCreateCart(int $customerId): ShoppingCart
    {
        return ShoppingCart::firstOrCreate(['customer_id' => $customerId]);
    }

    /**
     * Get cart items for a customer.
     */
    public function getCartItems(int $customerId): SupportCollection
    {
        $cart = ShoppingCart::where('customer_id', $customerId)->first();
        
        if (!$cart) {
            return collect([]);
        }

        // Get items from pivot table with relationships
        $items = CartProduct::where('cart_id', $cart->id)
            ->with(['product.images', 'product.categories', 'productVariant.images', 'productVariant.attributes'])
            ->get()
            ->map(function ($cartProduct) {
                return [
                    'id' => $cartProduct->id,
                    'product_id' => $cartProduct->product_id,
                    'product_variant_id' => $cartProduct->product_variant_id,
                    'quantity' => $cartProduct->quantity,
                    'product' => $cartProduct->product,
                    'product_variant' => $cartProduct->productVariant,
                ];
            });

        return $items;
    }

    /**
     * Get cart item count for a customer.
     */
    public function getCartItemCount(int $customerId): int
    {
        $cart = ShoppingCart::where('customer_id', $customerId)->first();
        
        if (!$cart) {
            return 0;
        }

        return CartProduct::where('cart_id', $cart->id)
            ->sum('quantity');
    }

    /**
     * Add item to cart.
     */
    public function addToCart(int $customerId, int $productId, ?int $productVariantId = null, int $quantity = 1)
    {
        // Validate product exists and is active
        $product = Product::where('id', $productId)
            ->where('is_active', true)
            ->firstOrFail();

        // If variant is provided, validate it
        $variant = null;
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

        // Get or create cart
        $cart = $this->getOrCreateCart($customerId);

        // Check if item already exists in cart
        $existingCartProduct = CartProduct::where('cart_id', $cart->id)
            ->where('product_id', $productId)
            ->where('product_variant_id', $productVariantId)
            ->first();

        if ($existingCartProduct) {
            // Update quantity
            $newQuantity = $existingCartProduct->quantity + $quantity;
            
            // Check stock if variant exists
            if ($productVariantId && $variant && $variant->stock !== null && $variant->stock < $newQuantity) {
                throw new \Exception('Insufficient stock available.');
            }

            $existingCartProduct->update(['quantity' => $newQuantity]);
            $existingCartProduct->load(['product.images', 'product.categories', 'productVariant.images', 'productVariant.attributes']);

            return [
                'id' => $existingCartProduct->id,
                'product_id' => $existingCartProduct->product_id,
                'product_variant_id' => $existingCartProduct->product_variant_id,
                'quantity' => $existingCartProduct->quantity,
                'product' => $existingCartProduct->product,
                'product_variant' => $existingCartProduct->productVariant,
            ];
        }

        // Create new cart item
        $cartProduct = CartProduct::create([
            'cart_id' => $cart->id,
            'product_id' => $productId,
            'product_variant_id' => $productVariantId,
            'quantity' => $quantity,
        ]);

        $cartProduct->load(['product.images', 'product.categories', 'productVariant.images', 'productVariant.attributes']);

        return [
            'id' => $cartProduct->id,
            'product_id' => $cartProduct->product_id,
            'product_variant_id' => $cartProduct->product_variant_id,
            'quantity' => $cartProduct->quantity,
            'product' => $cartProduct->product,
            'product_variant' => $cartProduct->productVariant,
        ];
    }

    /**
     * Update cart item quantity.
     */
    public function updateCartItem(int $customerId, int $cartItemId, int $quantity)
    {
        $cart = ShoppingCart::where('customer_id', $customerId)->firstOrFail();

        $cartProduct = CartProduct::where('id', $cartItemId)
            ->where('cart_id', $cart->id)
            ->firstOrFail();

        if ($quantity <= 0) {
            $cartProduct->delete();
            throw new \Exception('Item removed from cart.');
        }

        // Check stock if variant exists
        if ($cartProduct->product_variant_id) {
            $variant = $cartProduct->productVariant;
            if ($variant && $variant->stock !== null && $variant->stock < $quantity) {
                throw new \Exception('Insufficient stock available.');
            }
        }

        $cartProduct->update(['quantity' => $quantity]);
        $cartProduct->load(['product.images', 'product.categories', 'productVariant.images', 'productVariant.attributes']);

        return [
            'id' => $cartProduct->id,
            'product_id' => $cartProduct->product_id,
            'product_variant_id' => $cartProduct->product_variant_id,
            'quantity' => $cartProduct->quantity,
            'product' => $cartProduct->product,
            'product_variant' => $cartProduct->productVariant,
        ];
    }

    /**
     * Remove item from cart.
     */
    public function removeFromCart(int $customerId, int $cartItemId): bool
    {
        $cart = ShoppingCart::where('customer_id', $customerId)->firstOrFail();

        $cartProduct = CartProduct::where('id', $cartItemId)
            ->where('cart_id', $cart->id)
            ->firstOrFail();

        $cartProduct->delete();

        return true;
    }

    /**
     * Clear entire cart for a customer.
     */
    public function clearCart(int $customerId): int
    {
        $cart = ShoppingCart::where('customer_id', $customerId)->first();
        
        if (!$cart) {
            return 0;
        }

        return CartProduct::where('cart_id', $cart->id)->delete();
    }
}
