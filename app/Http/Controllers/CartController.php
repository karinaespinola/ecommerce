<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(
        protected CartService $cartService
    ) {
    }

    /**
     * Get customer ID from request or session.
     * Creates a guest customer if none exists.
     */
    protected function getCustomerId(Request $request): int
    {
        // Try to get from request first
        if ($request->has('customer_id')) {
            $customerId = (int) $request->input('customer_id');
            Session::put('customer_id', $customerId);
            return $customerId;
        }

        // Try to get from session
        if (Session::has('customer_id')) {
            return (int) Session::get('customer_id');
        }

        // Create a guest customer if none exists
        $guestCustomer = Customer::create([
            'name' => 'Guest',
            'email' => 'guest-' . Session::getId() . '@example.com',
        ]);

        Session::put('customer_id', $guestCustomer->id);

        return $guestCustomer->id;
    }

    /**
     * Display the cart page.
     */
    public function index(Request $request): Response
    {
        $customerId = $this->getCustomerId($request);
        $cartItems = $this->cartService->getCartItems($customerId);
        $cartCount = $this->cartService->getCartItemCount($customerId);

        return Inertia::render('public/Cart', [
            'cartItems' => $cartItems,
            'cartCount' => $cartCount,
        ]);
    }

    /**
     * Get cart items (API endpoint).
     */
    public function show(Request $request): JsonResponse
    {
        $customerId = $this->getCustomerId($request);
        $cartItems = $this->cartService->getCartItems($customerId);
        $cartCount = $this->cartService->getCartItemCount($customerId);

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
            $customerId = $this->getCustomerId($request);
            
            $cartItem = $this->cartService->addToCart(
                $customerId,
                $validated['product_id'],
                $validated['product_variant_id'] ?? null,
                $validated['quantity'] ?? 1
            );

            $cartCount = $this->cartService->getCartItemCount($customerId);

            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'cartItem' => $cartItem,
                    'cartCount' => $cartCount,
                ]);
            }

            return redirect()->back()->with('success', 'Item added to cart.');
        } catch (\Exception $e) {
            if ($request->wantsJson() || $request->expectsJson()) {
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
            $customerId = $this->getCustomerId($request);
            
            $cartItem = $this->cartService->updateCartItem(
                $customerId,
                $id,
                $validated['quantity']
            );
            $cartCount = $this->cartService->getCartItemCount($customerId);

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
            $customerId = $this->getCustomerId($request);
            
            $this->cartService->removeFromCart($customerId, $id);
            $cartCount = $this->cartService->getCartItemCount($customerId);

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
        try {
            $customerId = $this->getCustomerId($request);
            
            $this->cartService->clearCart($customerId);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'cartCount' => 0,
                ]);
            }

            return redirect()->back()->with('success', 'Cart cleared.');
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
}
