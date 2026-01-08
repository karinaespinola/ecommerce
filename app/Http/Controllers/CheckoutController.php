<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        protected CartService $cartService
    ) {
    }

    /**
     * Display the checkout page.
     * Requires authentication (enforced by middleware).
     */
    public function show(Request $request): Response
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
    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'billing_address' => ['required', 'array'],
            'billing_address.first_name' => ['required', 'string', 'max:255'],
            'billing_address.last_name' => ['required', 'string', 'max:255'],
            'billing_address.address_line_1' => ['required', 'string', 'max:255'],
            'billing_address.address_line_2' => ['nullable', 'string', 'max:255'],
            'billing_address.city' => ['required', 'string', 'max:255'],
            'billing_address.state' => ['required', 'string', 'max:255'],
            'billing_address.postal_code' => ['required', 'string', 'max:20'],
            'billing_address.country' => ['required', 'string', 'max:255'],
            'shipping_address' => ['required', 'array'],
            'shipping_address.first_name' => ['required', 'string', 'max:255'],
            'shipping_address.last_name' => ['required', 'string', 'max:255'],
            'shipping_address.address_line_1' => ['required', 'string', 'max:255'],
            'shipping_address.address_line_2' => ['nullable', 'string', 'max:255'],
            'shipping_address.city' => ['required', 'string', 'max:255'],
            'shipping_address.state' => ['required', 'string', 'max:255'],
            'shipping_address.postal_code' => ['required', 'string', 'max:20'],
            'shipping_address.country' => ['required', 'string', 'max:255'],
        ]);

        $customerId = Auth::guard('customer')->id();
        $cartItems = $this->cartService->getCartItems($customerId);
        
        if ($cartItems->isEmpty()) {
            return redirect()->route('cart.index')
                ->with('error', 'Your cart is empty.');
        }

        // Calculate totals
        $subtotal = $cartItems->reduce(function ($sum, $item) {
            $price = $item['product_variant'] 
                ? (float) $item['product_variant']['price'] 
                : (float) $item['product']['price'];
            return $sum + ($price * $item['quantity']);
        }, 0);

        $tax = $subtotal * 0.10; // 10% tax (you can make this configurable)
        $shipping = 10.00; // Fixed shipping (you can make this configurable)
        $total = $subtotal + $tax + $shipping;

        // Generate unique order number
        $orderNumber = 'ORD-' . strtoupper(Str::random(8));

        // Create order in transaction
        try {
            DB::beginTransaction();

            $order = Order::create([
                'customer_id' => $customerId,
                'order_number' => $orderNumber,
                'status' => 'pending',
                'subtotal' => $subtotal,
                'tax' => $tax,
                'shipping' => $shipping,
                'total' => $total,
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'billing_address' => $validated['billing_address'],
                'shipping_address' => $validated['shipping_address'],
            ]);

            // Create order items and decrease stock
            foreach ($cartItems as $item) {
                $price = $item['product_variant'] 
                    ? (float) $item['product_variant']['price'] 
                    : (float) $item['product']['price'];
                
                $productName = $item['product']['name'];
                $variantName = null;
                
                if ($item['product_variant'] && isset($item['product_variant']['attributes'])) {
                    $variantName = collect($item['product_variant']['attributes'])
                        ->map(fn($attr) => "{$attr['name']}: {$attr['pivot']['value']}")
                        ->join(', ');
                }

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['product_variant_id'],
                    'product_name' => $productName,
                    'variant_name' => $variantName,
                    'quantity' => $item['quantity'],
                    'price' => $price,
                    'subtotal' => $price * $item['quantity'],
                ]);

                // Decrease stock (with row locking to prevent race conditions)
                if ($item['product_variant_id']) {
                    // Product has variant - decrease variant stock
                    $variant = ProductVariant::lockForUpdate()->find($item['product_variant_id']);
                    if ($variant && $variant->stock !== null) {
                        $variant->decrement('stock', $item['quantity']);
                    }
                } else {
                    // Product without variant - decrease product stock
                    $product = Product::lockForUpdate()->find($item['product_id']);
                    if ($product && $product->stock !== null) {
                        $product->decrement('stock', $item['quantity']);
                    }
                }
            }

            // Update customer default addresses
            $customer = Auth::guard('customer')->user();
            $customer->update([
                'default_shipping_address' => $validated['shipping_address'],
                'default_billing_address' => $validated['billing_address'],
            ]);

            // Clear cart
            $this->cartService->clearCart($customerId);

            DB::commit();

            return redirect()->route('checkout.success', ['order' => $order->order_number])
                ->with('success', 'Order placed successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            
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
