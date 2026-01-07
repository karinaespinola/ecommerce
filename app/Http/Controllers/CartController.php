<?php

namespace App\Http\Controllers;

use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(
        protected CartService $cartService
    ) {
    }

    /**
     * Display the cart page.
     */
    public function index(): Response
    {
        $cartItems = $this->cartService->getCartItems();
        $cartCount = $this->cartService->getCartItemCount();

        return Inertia::render('public/Cart', [
            'cartItems' => $cartItems,
            'cartCount' => $cartCount,
        ]);
    }

    /**
     * Get cart items (API endpoint).
     */
    public function show(): JsonResponse
    {
        $cartItems = $this->cartService->getCartItems();
        $cartCount = $this->cartService->getCartItemCount();

        return response()->json([
            'items' => $cartItems,
            'count' => $cartCount,
        ]);
    }

    /**
     * Add item to cart.
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'integer|min:1|max:100',
        ]);

        try {
            $cartItem = $this->cartService->addToCart(
                $validated['product_id'],
                $validated['product_variant_id'] ?? null,
                $validated['quantity'] ?? 1
            );

            $cartCount = $this->cartService->getCartItemCount();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'cartItem' => $cartItem,
                    'cartCount' => $cartCount,
                ]);
            }

            return redirect()->back()->with('success', 'Item added to cart.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 400);
            }

            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Update cart item quantity.
     */
    public function update(Request $request, int $id): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1|max:100',
        ]);

        try {
            $cartItem = $this->cartService->updateCartItem($id, $validated['quantity']);
            $cartCount = $this->cartService->getCartItemCount();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'cartItem' => $cartItem,
                    'cartCount' => $cartCount,
                ]);
            }

            return redirect()->back()->with('success', 'Cart updated.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 400);
            }

            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Remove item from cart.
     */
    public function destroy(Request $request, int $id): JsonResponse|RedirectResponse
    {
        try {
            $this->cartService->removeFromCart($id);
            $cartCount = $this->cartService->getCartItemCount();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'cartCount' => $cartCount,
                ]);
            }

            return redirect()->back()->with('success', 'Item removed from cart.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 400);
            }

            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Clear entire cart.
     */
    public function clear(Request $request): JsonResponse|RedirectResponse
    {
        $this->cartService->clearCart();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'cartCount' => 0,
            ]);
        }

        return redirect()->back()->with('success', 'Cart cleared.');
    }
}

