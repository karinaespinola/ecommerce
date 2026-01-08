<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function __construct(
        protected CategoryService $categoryService
    ) {
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $categories = $this->categoryService->getAll(
            $request->integer('per_page', 15)
        );

        if ($request->wantsJson()) {
            return response()->json($categories);
        }

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Categories/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $category = $this->categoryService->create($request->validated());

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Category created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): Response|JsonResponse
    {
        $category = $this->categoryService->getById($id);

        if (!$category) {
            abort(404);
        }

        if (request()->wantsJson()) {
            return response()->json($category);
        }

        return Inertia::render('Categories/Show', [
            'category' => $category->load('products'),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(int $id): Response
    {
        $category = $this->categoryService->getById($id);

        if (!$category) {
            abort(404);
        }

        return Inertia::render('Categories/Edit', [
            'category' => $category,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCategoryRequest $request, int $id): RedirectResponse
    {
        $category = $this->categoryService->getById($id);

        if (!$category) {
            abort(404);
        }

        $this->categoryService->update($category, $request->validated());

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): RedirectResponse|JsonResponse
    {
        $category = $this->categoryService->getById($id);

        if (!$category) {
            abort(404);
        }

        $this->categoryService->delete($category);

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Category deleted successfully.']);
        }

        return redirect()
            ->route('admin.categories.index')
            ->with('success', 'Category deleted successfully.');
    }
}

