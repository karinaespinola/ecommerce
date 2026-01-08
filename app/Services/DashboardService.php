<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Collection;

class DashboardService
{
    public function __construct(
        protected AdminConfigService $adminConfigService
    ) {
    }

    /**
     * Get dashboard data including latest orders and low stock products.
     */
    public function getDashboardData(int $ordersLimit = 10): array
    {
        return [
            'latestOrders' => $this->getLatestOrders($ordersLimit),
            'lowStockProducts' => $this->getLowStockProducts(),
            'lowStockVariants' => $this->getLowStockVariants(),
            'lowStockThreshold' => $this->getLowStockThreshold(),
        ];
    }

    /**
     * Get latest orders with customer relationship.
     */
    public function getLatestOrders(int $limit = 10): Collection
    {
        return Order::with('customer')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get low stock threshold from admin config.
     */
    public function getLowStockThreshold(int $default = 2): int
    {
        return (int) $this->adminConfigService->get('lowstock_threshold', $default);
    }

    /**
     * Get non-variable products with low stock.
     */
    public function getLowStockProducts(): Collection
    {
        $threshold = $this->getLowStockThreshold();

        return Product::where('is_variable', false)
            ->whereNotNull('stock')
            ->where('stock', '<=', $threshold)
            ->get();
    }

    /**
     * Get variable products with low stock variants.
     */
    public function getLowStockVariants(): Collection
    {
        $threshold = $this->getLowStockThreshold();

        return ProductVariant::with('product')
            ->whereNotNull('stock')
            ->where('stock', '<=', $threshold)
            ->get()
            ->map(function ($variant) {
                return [
                    'id' => $variant->id,
                    'product_id' => $variant->product_id,
                    'product_name' => $variant->product->name,
                    'stock' => $variant->stock,
                    'sku' => $variant->sku,
                    'is_variable' => true,
                ];
            });
    }
}
