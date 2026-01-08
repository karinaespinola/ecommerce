<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCheckoutRequest;
use App\Models\Order;
use App\Services\CartService;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        protected CartService $cartService,
        protected OrderService $orderService
    ) {
    }

    /**
     * Display the checkout page.
     * Requires authentication (enforced by middleware).
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $customerId = Auth::guard('customer')->id();
        $customer = Auth::guard('customer')->user();

        $cartItems = $this->cartService->getCartItems($customerId);
        $cartCount = $this->cartService->getCartItemCount($customerId);
        
        // Redirect if cart is empty
        if ($cartItems->isEmpty()) {
            return redirect()->route('cart.index')
                ->with('error', 'Your cart is empty. Add items before checkout.');
        }
        
        // Calculate subtotal
        $subtotal = $cartItems->reduce(function ($sum, $item) {
            $price = $item['product_variant'] 
                ? (float) $item['product_variant']['price'] 
                : (float) $item['product']['price'];
            return $sum + ($price * $item['quantity']);
        }, 0);

        return Inertia::render('public/Checkout', [
            'cartItems' => $cartItems,
            'cartCount' => $cartCount,
            'subtotal' => $subtotal,
            'customer' => $customer,
        ]);
    }

    /**
     * Process the checkout and create an order.
     * Requires authentication (enforced by middleware).
     */
    public function store(StoreCheckoutRequest $request)
    {
        $customerId = Auth::guard('customer')->id();
        $cartItems = $this->cartService->getCartItems($customerId);
        
        if ($cartItems->isEmpty()) {
            return redirect()->route('cart.index')
                ->with('error', 'Your cart is empty.');
        }

        try {
            $order = $this->orderService->createOrderFromCart($customerId, $request->validated(), $cartItems);

            return redirect()->route('checkout.success', ['order' => $order->order_number])
                ->with('success', 'Order placed successfully!');

        } catch (\Exception $e) {
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to process order. Please try again.');
        }
    }

    /**
     * Show order success page.
     */
    public function success(Request $request, string $order): Response
    {
        $order = Order::where('order_number', $order)
            ->with(['items.product.images', 'items.productVariant.images'])
            ->firstOrFail();

        return Inertia::render('public/CheckoutSuccess', [
            'order' => $order,
        ]);
    }
}
