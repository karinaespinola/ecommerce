<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function __construct(
        protected CategoryService $categoryService
    ) {
    }

    /**
     * Get all categories (public API endpoint).
     */
    public function index(Request $request): JsonResponse
    {
        $categories = $this->categoryService->getAllWithoutPagination();

        return response()->json($categories);
    }
}

