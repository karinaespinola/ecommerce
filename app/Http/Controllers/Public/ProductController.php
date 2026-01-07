<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\CategoryService;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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
        $filters = [
            'is_active' => true,
            'category_id' => $request->integer('category_id'),
            'search' => $request->string('search')->toString(),
        ];

        $products = $this->productService->getAll(
            $request->integer('per_page', 12),
            array_filter($filters, fn($value) => $value !== null && $value !== '')
        );

        $categories = $this->categoryService->getAllWithoutPagination();

        if ($request->wantsJson()) {
            return response()->json([
                'products' => $products,
                'categories' => $categories,
            ]);
        }

        return Inertia::render('public/Products', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['category_id', 'search']),
        ]);
    }

    /**
     * Display the specified product.
     */
    public function show(Request $request, string $slug): Response|JsonResponse
    {
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

