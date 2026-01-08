<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Admin User',
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );
    }
}
