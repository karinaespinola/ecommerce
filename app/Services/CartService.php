<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;

class CartService
{
    /**
     * Get cart items for current user or session.
     */
    public function getCartItems(): Collection
    {
        $query = Cart::query()
            ->with([
                'product.images',
                'product.categories',
                'productVariant.images',
                'productVariant.attributes'
            ]);

        if (Auth::check()) {
            $query->where('user_id', Auth::id());
        } else {
            $query->where('session_id', $this->getSessionId());
        }

        return $query->get();
    }

    /**
     * Get cart item count.
     */
    public function getCartItemCount(): int
    {
        $query = Cart::query();

        if (Auth::check()) {
            $query->where('user_id', Auth::id());
        } else {
            $query->where('session_id', $this->getSessionId());
        }

        return $query->sum('quantity');
    }

    /**
     * Add item to cart.
     */
    public function addToCart(int $productId, ?int $productVariantId = null, int $quantity = 1): Cart
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

        $userId = Auth::check() ? Auth::id() : null;
        $sessionId = Auth::check() ? null : $this->getSessionId();

        // Check if item already exists in cart
        $existingCart = Cart::query()
            ->where('product_id', $productId)
            ->where('product_variant_id', $productVariantId)
            ->when($userId, fn($q) => $q->where('user_id', $userId))
            ->when($sessionId, fn($q) => $q->where('session_id', $sessionId))
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
        return Cart::create([
            'user_id' => $userId,
            'session_id' => $sessionId,
            'product_id' => $productId,
            'product_variant_id' => $productVariantId,
            'quantity' => $quantity,
        ])->load(['product.images', 'productVariant.images']);
    }

    /**
     * Update cart item quantity.
     */
    public function updateCartItem(int $cartId, int $quantity): Cart
    {
        $cart = Cart::with(['product', 'productVariant'])
            ->where('id', $cartId)
            ->when(Auth::check(), fn($q) => $q->where('user_id', Auth::id()))
            ->when(!Auth::check(), fn($q) => $q->where('session_id', $this->getSessionId()))
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
    public function removeFromCart(int $cartId): bool
    {
        $cart = Cart::query()
            ->where('id', $cartId)
            ->when(Auth::check(), fn($q) => $q->where('user_id', Auth::id()))
            ->when(!Auth::check(), fn($q) => $q->where('session_id', $this->getSessionId()))
            ->firstOrFail();

        return $cart->delete();
    }

    /**
     * Clear entire cart.
     */
    public function clearCart(): int
    {
        $query = Cart::query();

        if (Auth::check()) {
            $query->where('user_id', Auth::id());
        } else {
            $query->where('session_id', $this->getSessionId());
        }

        return $query->delete();
    }

    /**
     * Get or create session ID for guest users.
     */
    protected function getSessionId(): string
    {
        if (!Session::has('cart_session_id')) {
            Session::put('cart_session_id', Session::getId());
        }

        return Session::get('cart_session_id');
    }

    /**
     * Merge session cart to user cart (for when user logs in).
     */
    public function mergeSessionCartToUser(int $userId): void
    {
        $sessionId = Session::get('cart_session_id');
        
        if (!$sessionId) {
            return;
        }

        $sessionCartItems = Cart::where('session_id', $sessionId)->get();

        foreach ($sessionCartItems as $sessionItem) {
            // Check if user already has this item
            $existingCart = Cart::where('user_id', $userId)
                ->where('product_id', $sessionItem->product_id)
                ->where('product_variant_id', $sessionItem->product_variant_id)
                ->first();

            if ($existingCart) {
                // Merge quantities
                $existingCart->update([
                    'quantity' => $existingCart->quantity + $sessionItem->quantity
                ]);
                $sessionItem->delete();
            } else {
                // Transfer to user
                $sessionItem->update([
                    'user_id' => $userId,
                    'session_id' => null
                ]);
            }
        }

        Session::forget('cart_session_id');
    }
}

