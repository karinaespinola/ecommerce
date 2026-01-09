<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\CategoryService;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
class ProductController extends Controller
{
    public function __construct(
        protected ProductService $productService,
        protected CategoryService $categoryService
    ) {
    }

    /**
     * Display a listing of active products for public view.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $search = trim($request->input('search', ''));
        $categoryId = $request->integer('category_id', 0);
        
        $filters = [
            'is_active' => true,
        ];
        
        if (!empty($search)) {
            $filters['search'] = $search;
        }
        
        if ($categoryId > 0) {
            $filters['category_id'] = $categoryId;
        }

        $products = $this->productService->getAll(
            $request->integer('per_page', 12),
            $filters
        );

        // Format products for public display
        $products = $this->productService->formatProductsForPublic($products);

        $categories = $this->categoryService->getAllWithoutPagination();

        // If request is to /api/products or wants JSON, return JSON
        if ($request->is('api/products') || $request->wantsJson()) {
            return response()->json([
                'products' => $products,
                'categories' => $categories,
            ]);
        }

        return Inertia::render('public/Products', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_id']),
        ]);
    }

    /**
     * Display the specified product.
     */
    public function show(Request $request, string $slug): Response|JsonResponse
    {
        // If slug is purely numeric, it's likely an ID - let it fall through to admin route
        if (is_numeric($slug)) {
            abort(404);
        }

        $product = $this->productService->getBySlug($slug);

        if (!$product || !$product->is_active) {
            abort(404);
        }

        // Load relationships
        $product->load(['categories', 'variants.attributes', 'images', 'variants.images']);

        if ($request->wantsJson()) {
            return response()->json($product);
        }

        return Inertia::render('public/ProductDetail', [
            'product' => $product,
        ]);
    }
}

