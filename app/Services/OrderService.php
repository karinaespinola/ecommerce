<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Customer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    public function __construct(
        protected CartService $cartService,
        protected StockService $stockService
    ) {
    }

    /**
     * Create an order from cart items.
     *
     * @param int $customerId
     * @param array $validatedData
     * @param Collection $cartItems
     * @return Order
     * @throws \Exception
     */
    public function createOrderFromCart(int $customerId, array $validatedData, Collection $cartItems): Order
    {
        // Calculate totals
        $subtotal = $this->calculateSubtotal($cartItems);
        $tax = $subtotal * 0.10; // 10% tax (you can make this configurable)
        $shipping = 10.00; // Fixed shipping (you can make this configurable)
        $total = $subtotal + $tax + $shipping;

        // Generate unique order number
        $orderNumber = 'ORD-' . strtoupper(Str::random(8));

        return DB::transaction(function () use ($customerId, $validatedData, $cartItems, $orderNumber, $subtotal, $tax, $shipping, $total) {
            // Create order
            $order = Order::create([
                'customer_id' => $customerId,
                'order_number' => $orderNumber,
                'status' => 'pending',
                'subtotal' => $subtotal,
                'tax' => $tax,
                'shipping' => $shipping,
                'total' => $total,
                'email' => $validatedData['email'],
                'phone' => $validatedData['phone'] ?? null,
                'billing_address' => $validatedData['billing_address'],
                'shipping_address' => $validatedData['shipping_address'],
            ]);

            // Create order items and decrease stock
            $this->createOrderItems($order, $cartItems);

            // Update customer default addresses
            $this->updateCustomerAddresses($customerId, $validatedData);

            // Clear cart
            $this->cartService->clearCart($customerId);

            return $order;
        });
    }

    /**
     * Calculate subtotal from cart items.
     */
    protected function calculateSubtotal(Collection $cartItems): float
    {
        return $cartItems->reduce(function ($sum, $item) {
            $price = $item['product_variant'] 
                ? (float) $item['product_variant']['price'] 
                : (float) $item['product']['price'];
            return $sum + ($price * $item['quantity']);
        }, 0);
    }

    /**
     * Create order items and decrease stock.
     */
    protected function createOrderItems(Order $order, Collection $cartItems): void
    {
        foreach ($cartItems as $item) {
            $price = $item['product_variant'] 
                ? (float) $item['product_variant']['price'] 
                : (float) $item['product']['price'];
            
            $productName = $item['product']['name'];
            $variantName = $this->getVariantName($item);

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
            $this->stockService->decreaseStock($item);
            
        }
    }

    /**
     * Get variant name from cart item.
     */
    protected function getVariantName(array $item): ?string
    {
        if ($item['product_variant'] && isset($item['product_variant']['attributes'])) {
            return collect($item['product_variant']['attributes'])
                ->map(fn($attr) => "{$attr['name']}: {$attr['pivot']['value']}")
                ->join(', ');
        }
        return null;
    }



    /**
     * Update customer default addresses.
     */
    protected function updateCustomerAddresses(int $customerId, array $validatedData): void
    {
        $customer = Customer::find($customerId);
        if ($customer) {
            $customer->update([
                'default_shipping_address' => $validatedData['shipping_address'],
                'default_billing_address' => $validatedData['billing_address'],
            ]);
        }
    }
}
