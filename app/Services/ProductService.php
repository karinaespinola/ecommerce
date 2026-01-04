<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
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

        // Handle variants if it's a variable product
        if (isset($data['variants']) && is_array($data['variants'])) {
            $this->createVariants($product, $data['variants']);
        }

        return $product->load(['categories', 'variants.attributes']);
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

        // Handle variants if it's a variable product
        if (isset($data['variants']) && is_array($data['variants'])) {
            // Delete existing variants (and their relationships will cascade)
            $product->variants()->delete();
            // Create new variants
            $this->createVariants($product, $data['variants']);
        } elseif (isset($data['is_variable']) && !$data['is_variable']) {
            // If product is no longer variable, delete all variants
            $product->variants()->delete();
        }

        return $product->fresh(['categories', 'variants.attributes']);
    }

    /**
     * Delete a product.
     */
    public function delete(Product $product): bool
    {
        return $product->delete();
    }

    /**
     * Create variants for a product.
     */
    protected function createVariants(Product $product, array $variantsData): void
    {
        foreach ($variantsData as $variantData) {
            // Generate variant name from attributes
            $attributeNames = [];
            $attributes = $variantData['attributes'] ?? [];
            
            foreach ($attributes as $attrId => $value) {
                $attribute = \App\Models\Attribute::find($attrId);
                if ($attribute) {
                    $attributeNames[] = "{$attribute->name}: {$value}";
                }
            }
            
            $variantName = !empty($attributeNames) 
                ? implode(', ', $attributeNames)
                : 'Variant';

            // Create the variant
            $variant = $product->variants()->create([
                'name' => $variantName,
                'sku' => $variantData['sku'] ?? null,
                'price' => $variantData['price'] ?? 0,
                'stock' => $variantData['stock'] ?? 0,
                'is_active' => true,
            ]);

            // Attach attributes with values
            foreach ($attributes as $attrId => $value) {
                $variant->attributes()->attach($attrId, ['value' => $value]);
            }

            // Handle multiple image uploads
            if (isset($variantData['images']) && is_array($variantData['images'])) {
                foreach ($variantData['images'] as $index => $image) {
                    if ($image instanceof UploadedFile) {
                        $this->storeVariantImage($variant, $image, $index);
                    }
                }
            }
        }
    }

    /**
     * Store an image for a variant.
     */
    protected function storeVariantImage(ProductVariant $variant, UploadedFile $file, int $order = 0): void
    {
        $path = $file->store('products/variants', 'public');
        
        $variant->images()->create([
            'image_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'is_primary' => $order === 0,
            'order' => $order,
        ]);
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

