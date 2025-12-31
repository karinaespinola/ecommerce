<?php

use App\Http\Controllers\AttributeController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductImageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

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
