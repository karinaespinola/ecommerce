<?php

namespace App\Http\Controllers;

use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(
        protected CartService $cartService
    ) {
    }

    /**
     * Get authenticated customer ID.
     */
    protected function getCustomerId(): ?int
    {
        return Auth::guard('customer')->id();
    }

    /**
     * Display the cart page.
     */
    public function index(Request $request): Response
    {
        $customerId = $this->getCustomerId();
        
        if (!$customerId) {
            return Inertia::render('public/Cart', [
                'cartItems' => [],
                'cartCount' => 0,
            ]);
        }

        $cartData = $this->cartService->getCartData($customerId);

        return Inertia::render('public/Cart', [
            'cartItems' => $cartData['items'],
            'cartCount' => $cartData['count'],
        ]);
    }

    /**
     * Get cart items (API endpoint).
     */
    public function show(Request $request): JsonResponse
    {
        $customerId = $this->getCustomerId();
        
        if (!$customerId) {
            return response()->json([
                'items' => [],
                'count' => 0,
            ]);
        }

        $cartData = $this->cartService->getCartData($customerId);

        return response()->json([
            'items' => $cartData['items'],
            'count' => $cartData['count'],
        ]);
    }

    /**
     * Add item to cart.
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        try {
            $validated = $request->validate([
                'product_id' => 'required|exists:products,id',
                'product_variant_id' => 'nullable|exists:product_variants,id',
                'quantity' => 'integer|min:1|max:100',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }
            throw $e;
        }

        try {
            $customerId = $this->getCustomerId();
            
            $data = $this->cartService->addToCartWithData(
                $customerId,
                $validated['product_id'],
                $validated['product_variant_id'] ?? null,
                $validated['quantity'] ?? 1
            );

            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    ...$data,
                ]);
            }

            return redirect()->back()->with('success', 'Item added to cart.');
        } catch (\Exception $e) {
            return $this->handleException($e, $request);
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
            $customerId = $this->getCustomerId();
            
            $data = $this->cartService->updateCartItemWithData(
                $customerId,
                $id,
                $validated['quantity']
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    ...$data,
                ]);
            }

            return redirect()->back()->with('success', 'Cart updated.');
        } catch (\Exception $e) {
            return $this->handleException($e, $request);
        }
    }

    /**
     * Remove item from cart.
     */
    public function destroy(Request $request, int $id): JsonResponse|RedirectResponse
    {
        try {
            $customerId = $this->getCustomerId();
            
            $data = $this->cartService->removeFromCartWithData($customerId, $id);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    ...$data,
                ]);
            }

            return redirect()->back()->with('success', 'Item removed from cart.');
        } catch (\Exception $e) {
            return $this->handleException($e, $request);
        }
    }

    /**
     * Clear entire cart.
     */
    public function clear(Request $request): JsonResponse|RedirectResponse
    {
        try {
            $customerId = $this->getCustomerId();
            
            $this->cartService->clearCart($customerId);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'cartCount' => 0,
                ]);
            }

            return redirect()->back()->with('success', 'Cart cleared.');
        } catch (\Exception $e) {
            return $this->handleException($e, $request);
        }
    }

    /**
     * Handle exceptions and return appropriate response.
     */
    protected function handleException(\Exception $e, Request $request): JsonResponse|RedirectResponse
    {
        if ($request->wantsJson() || $request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }

        return redirect()->back()->with('error', $e->getMessage());
    }
}
