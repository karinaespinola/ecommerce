<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Services\AttributeService;
use App\Services\CategoryService;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    public function __construct(
        protected ProductService $productService,
        protected CategoryService $categoryService,
        protected AttributeService $attributeService
    ) {
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $products = $this->productService->getAll(
            $request->integer('per_page', 15),
            $request->only(['is_active', 'category_id', 'search'])
        );

        if ($request->wantsJson()) {
            return response()->json($products);
        }

        $categories = $this->categoryService->getAllWithoutPagination();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['is_active', 'category_id', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $categories = $this->categoryService->getAllWithoutPagination();
        $attributes = $this->attributeService->getAllWithoutPagination();

        return Inertia::render('Products/Create', [
            'categories' => $categories,
            'attributes' => $attributes,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProductRequest $request): RedirectResponse
    {
        $this->productService->create($request->validated());

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): Response|JsonResponse
    {
        $product = $this->productService->getById($id);

        if (!$product) {
            abort(404);
        }

        if (request()->wantsJson()) {
            return response()->json($product);
        }

        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(int $id): Response
    {
        $product = $this->productService->getById($id);

        if (!$product) {
            abort(404);
        }

        $categories = $this->categoryService->getAllWithoutPagination();
        $attributes = $this->attributeService->getAllWithoutPagination();

        return Inertia::render('Products/Edit', [
            'product' => $product,
            'categories' => $categories,
            'attributes' => $attributes,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProductRequest $request, int $id): RedirectResponse
    {
        $product = $this->productService->getById($id);

        if (!$product) {
            abort(404);
        }

        Log::debug('Request data', $request->all());

        $this->productService->update($product, $request->validated());

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): RedirectResponse|JsonResponse
    {
        $product = $this->productService->getById($id);

        if (!$product) {
            abort(404);
        }

        $this->productService->delete($product);

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Product deleted successfully.']);
        }

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product deleted successfully.');
    }
}

