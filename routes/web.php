<?php

use App\Http\Controllers\AdminConfigController;
use App\Http\Controllers\AttributeController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Customer\AuthController as CustomerAuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductImageController;
use App\Http\Controllers\Public\ProductController as PublicProductController;
use App\Http\Middleware\EnsureCustomerIsAuthenticated;
use App\Http\Middleware\EnsureAdminIsAuthenticated;
use App\Services\AdminConfigService;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// Public web routes (render Inertia pages) - must be defined before auth routes
Route::get('/', [PublicProductController::class, 'index'])->name('home');
Route::get('/products', [PublicProductController::class, 'index'])->name('public.products.index');
Route::get('/products/{slug}', [PublicProductController::class, 'show'])
    ->where('slug', '^(?!\d+$)[a-z0-9-]+$')
    ->name('public.products.show');

// Customer authentication routes
Route::get('/login', [CustomerAuthController::class, 'login'])->name('customer.login');
Route::post('/login', [CustomerAuthController::class, 'authenticate'])->name('customer.authenticate');
Route::get('/register', [CustomerAuthController::class, 'register'])->name('customer.register');
Route::post('/register', [CustomerAuthController::class, 'store'])->name('customer.register.store');
Route::post('/logout', [CustomerAuthController::class, 'logout'])->name('customer.logout');

// Cart routes - view is public, but modifications require authentication
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::middleware([EnsureCustomerIsAuthenticated::class])->group(function () {
    Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
    Route::put('/cart/{id}', [CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/{id}', [CartController::class, 'destroy'])->name('cart.destroy');
    Route::delete('/cart', [CartController::class, 'clear'])->name('cart.clear');
    
    // Checkout routes
    Route::get('/checkout', [CheckoutController::class, 'show'])->name('checkout.show');
    Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
    Route::get('/checkout/success/{order}', [CheckoutController::class, 'success'])->name('checkout.success');
});

Route::middleware([EnsureAdminIsAuthenticated::class])->group(function () {
    // All admin routes use /admin prefix
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('dashboard', function () {
            $latestOrders = \App\Models\Order::with('customer')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
            
            // Get low stock threshold from admin config
            $adminConfigService = new AdminConfigService();
            $lowStockThreshold = (int) $adminConfigService->get('lowstock_threshold', 2);
            
            // Get low stock products (non-variable products with low stock)
            $lowStockProducts = \App\Models\Product::where('is_variable', false)
                ->whereNotNull('stock')
                ->where('stock', '<=', $lowStockThreshold)
                ->get();
            
            // Get variable products with low stock variants
            $lowStockVariants = \App\Models\ProductVariant::with('product')
                ->whereNotNull('stock')
                ->where('stock', '<=', $lowStockThreshold)
                ->get()
                ->map(function ($variant) {
                    return [
                        'id' => $variant->id,
                        'product_id' => $variant->product_id,
                        'product_name' => $variant->product->name,
                        'stock' => $variant->stock,
                        'sku' => $variant->sku,
                        'is_variable' => true,
                    ];
                });
            
            return Inertia::render('dashboard', [
                'latestOrders' => $latestOrders,
                'lowStockProducts' => $lowStockProducts,
                'lowStockVariants' => $lowStockVariants,
                'lowStockThreshold' => $lowStockThreshold,
            ]);
        })->name('dashboard');

        Route::resource('categories', CategoryController::class);
        Route::get('products', [ProductController::class, 'index'])->name('products.index');
        Route::resource('products', ProductController::class)->except(['index']);
        Route::resource('attributes', AttributeController::class);
        
        Route::get('config', [AdminConfigController::class, 'index'])->name('config.index');
        Route::put('config', [AdminConfigController::class, 'update'])->name('config.update');

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
