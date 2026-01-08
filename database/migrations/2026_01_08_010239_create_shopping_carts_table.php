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
        // Drop existing carts table
        Schema::dropIfExists('carts');
        
        // Create shopping_carts table
        Schema::create('shopping_carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_variant_id')->nullable()->constrained()->onDelete('cascade');
            $table->integer('quantity');
            $table->timestamps();
            
            $table->unique(['customer_id', 'product_id', 'product_variant_id'], 'unique_customer_cart_item');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shopping_carts');
        
        // Recreate carts table if needed
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('session_id')->nullable()->index();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_variant_id')->nullable()->constrained()->onDelete('cascade');
            $table->integer('quantity');
            $table->timestamps();
            
            $table->unique(['user_id', 'product_id', 'product_variant_id'], 'unique_user_cart_item');
            $table->unique(['session_id', 'product_id', 'product_variant_id'], 'unique_session_cart_item');
        });
    }
};
