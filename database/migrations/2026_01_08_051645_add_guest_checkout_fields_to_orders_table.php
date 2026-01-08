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
            // Drop foreign key constraint first
            $table->dropForeign(['customer_id']);
            
            // Make customer_id nullable for guest checkout
            $table->foreignId('customer_id')->nullable()->change();
            
            // Re-add foreign key constraint with nullable support
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            
            // Add guest checkout fields
            $table->string('email')->nullable()->after('total');
            $table->string('phone')->nullable()->after('email');
            $table->json('shipping_address')->nullable()->after('phone');
            $table->json('billing_address')->nullable()->after('shipping_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Remove guest checkout fields
            $table->dropColumn(['email', 'phone', 'shipping_address', 'billing_address']);
            
            // Drop foreign key constraint
            $table->dropForeign(['customer_id']);
            
            // Make customer_id required again
            $table->foreignId('customer_id')->nullable(false)->change();
            
            // Re-add foreign key constraint
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
        });
    }
};
