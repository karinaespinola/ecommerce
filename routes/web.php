<?php

use App\Http\Controllers\AttributeController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductImageController;
use App\Http\Controllers\Public\ProductController as PublicProductController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// Public web routes (render Inertia pages) - must be defined before auth routes
Route::get('/', [PublicProductController::class, 'index'])->name('home');
Route::get('/products', [PublicProductController::class, 'index'])->name('public.products.index');
Route::get('/products/{slug}', [PublicProductController::class, 'show'])
    ->where('slug', '^(?!\d+$)[a-z0-9-]+$')
    ->name('public.products.show');

// Cart routes (public, no auth required)
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
Route::put('/cart/{id}', [CartController::class, 'update'])->name('cart.update');
Route::delete('/cart/{id}', [CartController::class, 'destroy'])->name('cart.destroy');
Route::delete('/cart', [CartController::class, 'clear'])->name('cart.clear');

Route::middleware(['auth', 'verified'])->group(function () {
    // All admin routes use /admin prefix
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('dashboard', function () {
            return Inertia::render('dashboard');
        })->name('dashboard');

        Route::resource('categories', CategoryController::class);
        Route::get('products', [ProductController::class, 'index'])->name('products.index');
        Route::resource('products', ProductController::class)->except(['index']);
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
});

require __DIR__.'/settings.php';
