<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Jobs\LowStockNotificationJob;

class StockService
{
    public function __construct(
        protected AdminConfigService $adminConfigService
    ) {
    }

    /**
     * Decrease stock for product or variant.
     */
    public function decreaseStock(array $item): void
    {
        if ($item['product_variant_id']) {
            // Product has variant - decrease variant stock
            $variant = ProductVariant::lockForUpdate()->find($item['product_variant_id']);
            if ($variant && $variant->stock !== null) {
                $variant->decrement('stock', $item['quantity']);
                if ($this->isStockBelowThreshold($variant->stock)) {
                    LowStockNotificationJob::dispatch($item);
                }
            }
        } else {
            // Product without variant - decrease product stock
            $product = Product::lockForUpdate()->find($item['product_id']);
            if ($product && $product->stock !== null) {
                $product->decrement('stock', $item['quantity']);
                if ($this->isStockBelowThreshold($product->stock)) {
                    LowStockNotificationJob::dispatch($item);
                }
            }
        }
    }

    public function isStockBelowThreshold(int $stock): bool
    {
        return $stock < $this->getLowStockThreshold();
    }

    public function getLowStockThreshold(): int
    {
        return (int) $this->adminConfigService->get('lowstock_threshold') ?? 2;
    }
}