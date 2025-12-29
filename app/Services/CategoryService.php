<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class CategoryService
{
    /**
     * Get all categories with pagination.
     */
    public function getAll(int $perPage = 15): LengthAwarePaginator
    {
        return Category::query()
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Get all categories without pagination.
     */
    public function getAllWithoutPagination(): Collection
    {
        return Category::query()
            ->orderBy('name')
            ->get();
    }

    /**
     * Get a category by ID.
     */
    public function getById(int $id): ?Category
    {
        return Category::find($id);
    }

    /**
     * Get a category by slug.
     */
    public function getBySlug(string $slug): ?Category
    {
        return Category::where('slug', $slug)->first();
    }

    /**
     * Create a new category.
     */
    public function create(array $data): Category
    {
        if (!isset($data['slug']) || empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        // Ensure slug is unique
        $data['slug'] = $this->makeSlugUnique($data['slug']);

        return Category::create($data);
    }

    /**
     * Update a category.
     */
    public function update(Category $category, array $data): Category
    {
        if (isset($data['name']) && (!isset($data['slug']) || empty($data['slug']))) {
            $data['slug'] = Str::slug($data['name']);
        }

        // Ensure slug is unique (excluding current category)
        if (isset($data['slug'])) {
            $data['slug'] = $this->makeSlugUnique($data['slug'], $category->id);
        }

        $category->update($data);

        return $category->fresh();
    }

    /**
     * Delete a category.
     */
    public function delete(Category $category): bool
    {
        return $category->delete();
    }

    /**
     * Make slug unique by appending a number if needed.
     */
    protected function makeSlugUnique(string $slug, ?int $excludeId = null): string
    {
        $originalSlug = $slug;
        $counter = 1;

        while (Category::where('slug', $slug)
            ->when($excludeId, fn($query) => $query->where('id', '!=', $excludeId))
            ->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}

