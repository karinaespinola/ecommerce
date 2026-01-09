<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ReportService;
use App\Services\AdminConfigService;
use App\Mail\DailyOrdersReportMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SendSalesReportToAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-sales-report-to-admin {--date= : The date for the report (Y-m-d format). Defaults to today}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send daily orders report to admin';

    /**
     * Execute the console command.
     */
    public function handle(ReportService $reportService, AdminConfigService $adminConfigService)
    {
        try {
            $date = $this->option('date') 
                ? Carbon::parse($this->option('date')) 
                : Carbon::today();

            $this->info("Generating daily orders report for {$date->format('F j, Y')}...");

            $reportData = $reportService->getDailyOrdersData($date);

            $adminEmail = $adminConfigService->get('lowstock_notification_email') 
                ?? $adminConfigService->get('site_email');

            if (!$adminEmail) {
                $this->error('Admin email not configured. Please set lowstock_notification_email or site_email in admin_config.');
                return Command::FAILURE;
            }

            Mail::to($adminEmail)->send(new DailyOrdersReportMail($reportData));

            $this->info("Daily orders report sent successfully to {$adminEmail}");
            $this->info("Total orders: {$reportData['statistics']['total_orders']}");
            $this->info("Total revenue: $" . number_format($reportData['statistics']['total_revenue'], 2));

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Error sending daily orders report: " . $e->getMessage());
            Log::error('Error sending daily orders report: ' . $e->getMessage(), [
                'exception' => $e,
            ]);
            return Command::FAILURE;
        }
    }
}
