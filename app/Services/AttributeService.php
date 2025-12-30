<?php

namespace App\Services;

use App\Models\Attribute;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class AttributeService
{
    /**
     * Get all attributes with pagination.
     */
    public function getAll(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = Attribute::query()->latest();

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage);
    }

    /**
     * Get all attributes without pagination.
     */
    public function getAllWithoutPagination(): Collection
    {
        return Attribute::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get an attribute by ID.
     */
    public function getById(int $id): ?Attribute
    {
        return Attribute::find($id);
    }

    /**
     * Get an attribute by slug.
     */
    public function getBySlug(string $slug): ?Attribute
    {
        return Attribute::where('slug', $slug)->first();
    }

    /**
     * Create a new attribute.
     */
    public function create(array $data): Attribute
    {
        if (!isset($data['slug']) || empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        // Ensure slug is unique
        $data['slug'] = $this->makeSlugUnique($data['slug']);

        return Attribute::create($data);
    }

    /**
     * Update an attribute.
     */
    public function update(Attribute $attribute, array $data): Attribute
    {
        if (isset($data['name']) && (!isset($data['slug']) || empty($data['slug']))) {
            $data['slug'] = Str::slug($data['name']);
        }

        // Ensure slug is unique (excluding current attribute)
        if (isset($data['slug'])) {
            $data['slug'] = $this->makeSlugUnique($data['slug'], $attribute->id);
        }

        $attribute->update($data);

        return $attribute->fresh();
    }

    /**
     * Delete an attribute.
     */
    public function delete(Attribute $attribute): bool
    {
        return $attribute->delete();
    }

    /**
     * Make slug unique by appending a number if needed.
     */
    protected function makeSlugUnique(string $slug, ?int $excludeId = null): string
    {
        $originalSlug = $slug;
        $counter = 1;

        while (Attribute::where('slug', $slug)
            ->when($excludeId, fn($query) => $query->where('id', '!=', $excludeId))
            ->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}

