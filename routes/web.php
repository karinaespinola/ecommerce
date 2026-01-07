<?php

use App\Http\Controllers\AttributeController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductImageController;
use App\Http\Controllers\Public\CategoryController as PublicCategoryController;
use App\Http\Controllers\Public\ProductController as PublicProductController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// Public routes
Route::get('/', [PublicProductController::class, 'index'])->name('home');
Route::get('/products', [PublicProductController::class, 'index'])->name('public.products.index');
Route::get('/products/{slug}', [PublicProductController::class, 'show'])->name('public.products.show');

// Public API routes
Route::get('/api/categories', [PublicCategoryController::class, 'index'])->name('public.categories.index');

// Cart routes (public, no auth required)
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::get('/api/cart', [CartController::class, 'show'])->name('cart.show');
Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
Route::put('/cart/{id}', [CartController::class, 'update'])->name('cart.update');
Route::delete('/cart/{id}', [CartController::class, 'destroy'])->name('cart.destroy');
Route::delete('/cart', [CartController::class, 'clear'])->name('cart.clear');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('categories', CategoryController::class);
    Route::resource('products', ProductController::class);
    Route::resource('attributes', AttributeController::class);

    // Image routes for products and product variants
    // Allowed types: 'products' or 'product-variants'
    Route::prefix('images/{type}/{id}')->where(['type' => 'products|product-variants'])->name('images.')->group(function () {
        Route::get('/', [ProductImageController::class, 'index'])->name('index');
        Route::get('/create', [ProductImageController::class, 'create'])->name('create');
        Route::post('/', [ProductImageController::class, 'store'])->name('store');
        Route::get('/{imageId}', [ProductImageController::class, 'show'])->name('show');
        Route::get('/{imageId}/edit', [ProductImageController::class, 'edit'])->name('edit');
        Route::put('/{imageId}', [ProductImageController::class, 'update'])->name('update');
        Route::delete('/{imageId}', [ProductImageController::class, 'destroy'])->name('destroy');
    });
});

require __DIR__.'/settings.php';
