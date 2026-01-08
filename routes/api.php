<?php

use App\Http\Controllers\CartController;
use App\Http\Controllers\Public\CategoryController as PublicCategoryController;
use App\Http\Controllers\Public\ProductController as PublicProductController;
use Illuminate\Support\Facades\Route;

// Public API routes (return JSON)
// Note: Routes in api.php are automatically prefixed with /api
Route::get('/categories', [PublicCategoryController::class, 'index'])->name('public.categories.index');
Route::get('/products', [PublicProductController::class, 'index'])->name('public.products.api');

// Cart API routes
Route::get('/cart', [CartController::class, 'show'])->name('cart.show');

