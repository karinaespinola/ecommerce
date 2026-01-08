<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AdminConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $configs = [
            ['key' => 'site_name', 'value' => 'Silver Wings'],
            ['key' => 'site_email', 'value' => 'silverwings@gmail.com'],
            ['key' => 'currency', 'value' => 'USD'],
            ['key' => 'tax_rate', 'value' => '0.00'],
            ['key' => 'lowstock_threshold', 'value' => '2'],
            ['key' => 'lowstock_notification_email', 'value' => 'admin@silverwings.com'],
        ];

        foreach ($configs as $config) {
            $exists = DB::table('admin_config')->where('key', $config['key'])->exists();
            
            DB::table('admin_config')->updateOrInsert(
                ['key' => $config['key']],
                array_merge(
                    ['value' => $config['value'], 'updated_at' => now()],
                    $exists ? [] : ['created_at' => now()]
                )
            );
        }
    }
}
