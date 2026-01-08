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
        Schema::table('shopping_carts', function (Blueprint $table) {
            // Drop the old unique constraint
            $table->dropUnique('unique_customer_cart_item');
            
            // Drop foreign keys and columns
            $table->dropForeign(['product_id']);
            $table->dropForeign(['product_variant_id']);
            $table->dropColumn(['product_id', 'product_variant_id', 'quantity']);
            
            // Add unique constraint on customer_id for one-to-one relationship
            $table->unique('customer_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shopping_carts', function (Blueprint $table) {
            // Remove unique constraint on customer_id
            $table->dropUnique(['customer_id']);
            
            // Re-add columns
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_variant_id')->nullable()->constrained()->onDelete('cascade');
            $table->integer('quantity');
            
            // Re-add unique constraint
            $table->unique(['customer_id', 'product_id', 'product_variant_id'], 'unique_customer_cart_item');
        });
    }
};
