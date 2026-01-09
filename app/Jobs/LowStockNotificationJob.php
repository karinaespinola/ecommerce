<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\AdminConfigService;
use App\Mail\LowStockAdminMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class LowStockNotificationJob implements ShouldQueue
{
    use Queueable;

    protected Product|ProductVariant $item;
    protected AdminConfigService $adminConfigService;

    /**
     * Create a new job instance.
     */
    public function __construct(array $cartItem)
    {
        $this->item = $cartItem['product_variant_id'] ? 
        ProductVariant::find($cartItem['product_variant_id']) : 
        Product::find($cartItem['product_id']); 
        $this->adminConfigService = new AdminConfigService();
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $adminEmail = $this->getAdminEmail();
            Log::debug('Admin email: ' . $adminEmail);
            if ($adminEmail) {
                Mail::to($adminEmail)->send(new LowStockAdminMail($this->item, $this->item->stock, $this->getLowStockThreshold()));
            }
        }
        catch (\Exception $e) {
            Log::error('Error sending low stock notification: ' . $e->getMessage());
        }

    }

    public function getAdminEmail(): string
    {
        return $this->adminConfigService->get('lowstock_notification_email');
    }

    public function getLowStockThreshold(): int
    {
        return (int) $this->adminConfigService->get('lowstock_threshold') ?? 2;
    }
}
