<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Drop old foreign key and column
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
            
            // Remove address fields (moved to customers table)
            $table->dropColumn(['email', 'phone', 'shipping_address', 'billing_address']);
            
            // Add customer_id foreign key (not nullable)
            $table->foreignId('customer_id')->after('id')->constrained()->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Drop customer_id
            $table->dropForeign(['customer_id']);
            $table->dropColumn('customer_id');
            
            // Restore user_id (nullable)
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->onDelete('set null');
            
            // Restore address fields
            $table->string('email')->after('total');
            $table->string('phone')->nullable()->after('email');
            $table->json('shipping_address')->after('phone');
            $table->json('billing_address')->after('shipping_address');
        });
    }
};
