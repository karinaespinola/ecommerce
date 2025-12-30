<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class ProductService
{
    /**
     * Get all products with pagination.
     */
    public function getAll(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = Product::query()
            ->with(['categories', 'variants'])
            ->latest();

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['category_id'])) {
            $query->whereHas('categories', fn($q) => $q->where('categories.id', $filters['category_id']));
        }

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage);
    }

    /**
     * Get all active products without pagination.
     */
    public function getAllActive(): Collection
    {
        return Product::query()
            ->where('is_active', true)
            ->with(['categories'])
            ->orderBy('name')
            ->get();
    }

    /**
     * Get a product by ID.
     */
    public function getById(int $id): ?Product
    {
        return Product::with(['categories', 'variants'])->find($id);
    }

    /**
     * Get a product by slug.
     */
    public function getBySlug(string $slug): ?Product
    {
        return Product::where('slug', $slug)
            ->with(['categories', 'variants'])
            ->first();
    }

    /**
     * Create a new product.
     */
    public function create(array $data): Product
    {
        if (!isset($data['slug']) || empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        // Ensure slug is unique
        $data['slug'] = $this->makeSlugUnique($data['slug']);

        // Handle SKU uniqueness
        if (isset($data['sku']) && empty($data['sku'])) {
            $data['sku'] = null;
        }

        $categoryIds = $data['category_ids'] ?? [];
        unset($data['category_ids']);

        $product = Product::create($data);

        if (!empty($categoryIds)) {
            $product->categories()->sync($categoryIds);
        }

        if(isset($data['attributes'])) {
            foreach($data['attributes'] as $attribute) {
                $product->variants()->create([
                    'name' => $attribute['name'],
                    'sku' => $attribute['sku'],
                    'price' => $attribute['price'],
                    'stock' => $attribute['stock'],
                ]);

                $product->variants()->first()->attributes()->attach($attribute['id'], ['value' => $attribute['value']]);
            }
        }

        return $product->load(['categories', 'variants']);
    }

    /**
     * Update a product.
     */
    public function update(Product $product, array $data): Product
    {
        if (isset($data['name']) && (!isset($data['slug']) || empty($data['slug']))) {
            $data['slug'] = Str::slug($data['name']);
        }

        // Ensure slug is unique (excluding current product)
        if (isset($data['slug'])) {
            $data['slug'] = $this->makeSlugUnique($data['slug'], $product->id);
        }

        // Handle SKU uniqueness
        if (isset($data['sku']) && empty($data['sku'])) {
            $data['sku'] = null;
        }

        $categoryIds = $data['category_ids'] ?? null;
        if (isset($data['category_ids'])) {
            unset($data['category_ids']);
        }

        $product->update($data);

        if ($categoryIds !== null) {
            $product->categories()->sync($categoryIds);
        }

        return $product->fresh(['categories', 'variants']);
    }

    /**
     * Delete a product.
     */
    public function delete(Product $product): bool
    {
        return $product->delete();
    }

    /**
     * Make slug unique by appending a number if needed.
     */
    protected function makeSlugUnique(string $slug, ?int $excludeId = null): string
    {
        $originalSlug = $slug;
        $counter = 1;

        while (Product::where('slug', $slug)
            ->when($excludeId, fn($query) => $query->where('id', '!=', $excludeId))
            ->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}

