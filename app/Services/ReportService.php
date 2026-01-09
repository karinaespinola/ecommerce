<?php

namespace App\Services;

use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Get daily orders data for a specific date.
     * If no date is provided, uses today's date.
     */
    public function getDailyOrdersData(?Carbon $date = null): array
    {
        $date = $date ?? Carbon::today();
        $startOfDay = $date->copy()->startOfDay();
        $endOfDay = $date->copy()->endOfDay();

        // Get all orders for the day with relationships
        $orders = Order::with(['customer', 'items.product', 'items.productVariant'])
            ->whereBetween('created_at', [$startOfDay, $endOfDay])
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate statistics
        $totalOrders = $orders->count();
        $totalRevenue = $orders->sum('total');
        $totalSubtotal = $orders->sum('subtotal');
        $totalTax = $orders->sum('tax');
        $totalShipping = $orders->sum('shipping');
        $averageOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        // Group by status
        $ordersByStatus = $orders->groupBy('status')->map(function ($group) {
            return [
                'count' => $group->count(),
                'revenue' => $group->sum('total'),
            ];
        })->toArray();

        // Get top products sold
        $topProducts = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereBetween('orders.created_at', [$startOfDay, $endOfDay])
            ->select(
                'order_items.product_name',
                'order_items.variant_name',
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.subtotal) as total_revenue')
            )
            ->groupBy('order_items.product_name', 'order_items.variant_name')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get();

        // Get customer breakdown
        $guestOrders = $orders->whereNull('customer_id')->count();
        $registeredOrders = $orders->whereNotNull('customer_id')->count();

        return [
            'date' => $date->format('Y-m-d'),
            'date_formatted' => $date->format('F j, Y'),
            'statistics' => [
                'total_orders' => $totalOrders,
                'total_revenue' => $totalRevenue,
                'total_subtotal' => $totalSubtotal,
                'total_tax' => $totalTax,
                'total_shipping' => $totalShipping,
                'average_order_value' => $averageOrderValue,
                'guest_orders' => $guestOrders,
                'registered_orders' => $registeredOrders,
            ],
            'orders_by_status' => $ordersByStatus,
            'top_products' => $topProducts,
            'orders' => $orders->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'status' => $order->status,
                    'customer_name' => $order->customer ? $order->customer->name : ($order->email ?? 'Guest'),
                    'customer_email' => $order->customer ? $order->customer->email : $order->email,
                    'is_guest' => is_null($order->customer_id),
                    'subtotal' => $order->subtotal,
                    'tax' => $order->tax,
                    'shipping' => $order->shipping,
                    'total' => $order->total,
                    'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                    'created_at_formatted' => $order->created_at->format('M j, Y g:i A'),
                    'items_count' => $order->items->count(),
                    'items' => $order->items->map(function ($item) {
                        return [
                            'product_name' => $item->product_name,
                            'variant_name' => $item->variant_name,
                            'quantity' => $item->quantity,
                            'price' => $item->price,
                            'subtotal' => $item->subtotal,
                        ];
                    }),
                ];
            }),
        ];
    }
}
