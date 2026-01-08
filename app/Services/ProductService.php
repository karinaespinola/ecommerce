<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class ProductService
{
    /**
     * Get all products with pagination.
     */
    public function getAll(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = Product::query()
            ->with([
                'categories',
                'variants' => function ($q) {
                    $q->where('is_active', true)->with('images');
                },
                'images',
                'featuredImage'
            ])
            ->latest();

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['category_id'])) {
            $query->whereHas('categories', fn($q) => $q->where('categories.id', $filters['category_id']));
        }
        
        Log::debug('Here are the filters', compact('filters'));
        if (isset($filters['search'])) {
            Log::debug('Search:', $filters['search']);
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

       // Log::debug('Products', $query->get()->toArray());

        return $query->paginate($perPage);
    }

    /**
     * Format products for public display with correct images and prices.
     */
    public function formatProductsForPublic(LengthAwarePaginator $products): LengthAwarePaginator
    {
        $products->getCollection()->transform(function ($product) {
            if ($product->is_variable) {
                // For variable products: use featured_image_id
                $featuredImage = null;
                if ($product->featured_image_id && $product->featuredImage) {
                    $featuredImage = $product->featuredImage;
                } else {
                    // Fallback: get first image from first variant
                    if ($product->variants->isNotEmpty()) {
                        $firstVariant = $product->variants->first();
                        if ($firstVariant && $firstVariant->images->isNotEmpty()) {
                            $featuredImage = $firstVariant->images->first();
                        }
                    }
                }

                // Calculate minimum price from active variants
                $minPrice = $product->variants
                    ->where('is_active', true)
                    ->min('price');

                // Format the product
                $product->display_price = $minPrice !== null ? (string) $minPrice : (string) $product->price;
                $product->price_display = $minPrice !== null ? "from $" . number_format($minPrice, 2) : "$" . number_format($product->price, 2);
                $product->featured_image = $featuredImage;
                $product->images = $featuredImage ? collect([$featuredImage]) : collect();
            } else {
                // For non-variable products: use featured_image_id or first image
                $featuredImage = null;
                if ($product->featured_image_id && $product->featuredImage) {
                    $featuredImage = $product->featuredImage;
                } else {
                    // Fallback: first image
                    $featuredImage = $product->images->first();
                }
                
                $product->display_price = (string) $product->price;
                $product->price_display = "$" . number_format($product->price, 2);
                $product->featured_image = $featuredImage;
            }

            return $product;
        });

        return $products;
    }

    /**
     * Get all active products without pagination.
     */
    public function getAllActive(): Collection
    {
        return Product::query()
            ->where('is_active', true)
            ->with(['categories', 'images'])
            ->orderBy('name')
            ->get();
    }

    /**
     * Get a product by ID.
     */
    public function getById(int $id): ?Product
    {
        return Product::with(['categories', 'variants.attributes', 'variants.images', 'images'])->find($id);
    }

    /**
     * Get a product by slug.
     */
    public function getBySlug(string $slug): ?Product
    {
        return Product::where('slug', $slug)
            ->with(['categories', 'variants', 'images', 'featuredImage'])
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

        // Check if product is variable before handling image
        $isVariable = $data['is_variable'] ?? false;

        // Handle product image (only for non-variable products)
        $image = null;
        if (isset($data['image']) && $data['image'] instanceof UploadedFile) {
            $image = $data['image'];
            unset($data['image']);
        } elseif ($isVariable) {
            // Explicitly unset image for variable products
            unset($data['image']);
        }

        $featuredImageIdString = $data['featured_image_id'] ?? null;
        unset($data['featured_image_id']);

        $product = Product::create($data);

        if (!empty($categoryIds)) {
            $product->categories()->sync($categoryIds);
        }

        // Store product image if provided and product is not variable
        if ($image && !$isVariable) {
            $this->storeProductImage($product, $image);
        }

        // Handle variants if it's a variable product
        if (isset($data['variants']) && is_array($data['variants'])) {
            $this->createVariants($product, $data['variants'], $featuredImageIdString);
        }

        Log::debug('Create product - featured_image_id after variants', [
            'featured_image_id' => $product->fresh()->featured_image_id,
        ]);

        return $product->load(['categories', 'variants.attributes', 'variants.images', 'images', 'featuredImage']);
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

        // Check if product is variable before handling image
        $isVariable = $data['is_variable'] ?? $product->is_variable;

        // Handle product image (only for non-variable products)
        $image = null;
        if (isset($data['image']) && $data['image'] instanceof UploadedFile) {
            $image = $data['image'];
            unset($data['image']);
        } elseif ($isVariable) {
            // Delete existing product images if switching to variable
            $product->images()->delete();
            unset($data['image']);
        } elseif (isset($data['image']) && $data['image'] === '') {
            // Empty string means explicitly set to null
            unset($data['image']);
        }

        // Extract featured_image_id before updating product (it needs special handling)
        $featuredImageIdString = $data['featured_image_id'] ?? null;
        Log::debug('Update product - featured_image_id from request', [
            'featured_image_id' => $featuredImageIdString,
            'is_variable' => $isVariable,
        ]);
        unset($data['featured_image_id']);

        $product->update($data);

        if ($categoryIds !== null) {
            $product->categories()->sync($categoryIds);
        }

        // Store product image if provided and product is not variable
        if ($image && !$isVariable) {
            // Delete existing product images before adding new one
            $product->images()->delete();
            $this->storeProductImage($product, $image);
        }

        // Handle variants if it's a variable product
        if (isset($data['variants']) && is_array($data['variants'])) {
            // Update variants intelligently to preserve existing images
            $this->updateVariants($product, $data['variants'], $featuredImageIdString);
        } elseif (isset($data['is_variable']) && !$data['is_variable']) {
            // If product is no longer variable, delete all variants
            $product->variants()->delete();
            $product->update(['featured_image_id' => null]);
        }

        return $product->fresh(['categories', 'variants.attributes', 'variants.images', 'images', 'featuredImage']);
    }

    /**
     * Delete a product.
     */
    public function delete(Product $product): bool
    {
        return $product->delete();
    }

    /**
     * Update variants for a product, preserving existing images.
     */
    protected function updateVariants(Product $product, array $variantsData, ?string $featuredImageIdString = null): void
    {
        $featuredImage = null;
        
        // Get existing variants with their attributes
        $existingVariants = $product->variants()->with('attributes')->get();
        $existingVariantsMap = [];
        
        foreach ($existingVariants as $existingVariant) {
            $key = $this->getVariantKeyFromAttributes($existingVariant->attributes);
            $existingVariantsMap[$key] = $existingVariant;
        }
        
        $processedVariantKeys = [];
        
        foreach ($variantsData as $variantIndex => $variant) {
            if (empty($variant) || !is_array($variant)) {
                continue;
            }

            // Extract attributes, price, stock, and images from the variant
            if (!isset($variant['attributes']) || !is_array($variant['attributes']) || empty($variant['attributes'])) {
                continue;
            }

            $attributes = [];
            foreach ($variant['attributes'] as $attrId => $value) {
                $attributes[(int) $attrId] = $value;
            }

            if (empty($attributes)) {
                continue;
            }

            // Generate key for this variant
            $variantKey = $this->getVariantKeyFromAttributesArray($attributes);
            $processedVariantKeys[] = $variantKey;

            // Check if variant already exists
            $variantModel = $existingVariantsMap[$variantKey] ?? null;
            
            if ($variantModel) {
                // Update existing variant
                $variantModel->update([
                    'sku' => $variant['sku'] ?? $variantModel->sku,
                    'price' => $variant['price'] ?? $variantModel->price,
                    'stock' => $variant['stock'] ?? $variantModel->stock,
                ]);
                
                // Sync attributes (in case values changed)
                $variantModel->attributes()->detach();
                foreach ($attributes as $attrId => $value) {
                    $variantModel->attributes()->attach($attrId, ['value' => $value]);
                }
                
                // Debug: Log what we received for this variant
                Log::debug("Processing variant {$variantModel->id}", [
                    'variant_data_keys' => array_keys($variant),
                    'has_existing_image_ids' => isset($variant['existing_image_ids']),
                    'existing_image_ids' => $variant['existing_image_ids'] ?? null,
                ]);
                
                // Handle image deletions - delete images that are not in the existing_image_ids list
                if (isset($variant['existing_image_ids']) && is_array($variant['existing_image_ids'])) {
                    // Check for sentinel value first
                    $hasSentinel = in_array('__empty__', $variant['existing_image_ids'], true);
                    
                    if ($hasSentinel) {
                        // Sentinel value means delete all existing images
                        $deletedCount = $variantModel->images()->delete();
                        Log::info("Deleted all images for variant {$variantModel->id}: {$deletedCount} images deleted");
                    } else {
                        // Filter out sentinel value and convert to integers
                        $keepImageIds = array_filter(
                            array_map('intval', $variant['existing_image_ids']),
                            fn($id) => $id > 0
                        );
                        
                        if (!empty($keepImageIds)) {
                            // Delete images not in the keep list
                            $existingImageIds = $variantModel->images()->pluck('id')->toArray();
                            $imagesToDelete = array_diff($existingImageIds, $keepImageIds);
                            
                            if (!empty($imagesToDelete)) {
                                $deletedCount = $variantModel->images()->whereIn('id', $imagesToDelete)->delete();
                                Log::info("Deleted images for variant {$variantModel->id}: " . count($imagesToDelete) . " images deleted", [
                                    'keep_ids' => $keepImageIds,
                                    'delete_ids' => $imagesToDelete,
                                    'deleted_count' => $deletedCount
                                ]);
                            }
                        } else {
                            // Empty array without sentinel - this shouldn't happen, but if it does, don't delete anything
                            Log::warning("Empty existing_image_ids array without sentinel for variant {$variantModel->id}");
                        }
                    }
                } else {
                    // If existing_image_ids is not provided, keep all existing images (don't delete anything)
                    Log::debug("No existing_image_ids provided for variant {$variantModel->id}, keeping all images");
                }
            } else {
                // Create new variant
                $variantModel = ProductVariant::create([
                    'product_id' => $product->id,
                    'sku' => $variant['sku'] ?? null,
                    'price' => $variant['price'] ?? 0,
                    'stock' => $variant['stock'] ?? 0,
                    'is_active' => true,
                ]);

                // Attach attributes with values
                foreach ($attributes as $attrId => $value) {
                    $variantModel->attributes()->attach($attrId, ['value' => $value]);
                }
            }

            // Handle new image uploads
            if (!empty($variant['images']) && is_array($variant['images'])) {
                $existingImageCount = $variantModel->images()->count();
                foreach ($variant['images'] as $imageIndex => $image) {
                    if ($image instanceof UploadedFile) {
                        $storedImage = $this->storeVariantImage($variantModel, $image, $existingImageCount + $imageIndex);
                        
                        // Check if this is the featured image
                        // Format: "new-{variantIndex}-{imageIndex}"
                        if ($featuredImageIdString && $featuredImageIdString === "new-{$variantIndex}-{$imageIndex}") {
                            $featuredImage = $storedImage;
                        }
                    }
                }
            }
        }
        
        // Delete variants that are no longer in the new data
        foreach ($existingVariantsMap as $key => $existingVariant) {
            if (!in_array($key, $processedVariantKeys)) {
                $existingVariant->delete();
            }
        }
        
        // Set featured image on product
        Log::debug('Setting featured image (updateVariants)', [
            'featuredImageIdString' => $featuredImageIdString,
            'hasFeaturedImage' => $featuredImage !== null,
            'featuredImageId' => $featuredImage?->id,
        ]);
        
        if ($featuredImage) {
            $product->update(['featured_image_id' => $featuredImage->id]);
            Log::info('Set featured_image_id to new image (updateVariants)', ['image_id' => $featuredImage->id]);
        } elseif ($featuredImageIdString && str_starts_with($featuredImageIdString, 'existing-')) {
            // For existing images, parse the image ID from the string
            // Format: "existing-{variantIndex}-{imageId}"
            $parts = explode('-', $featuredImageIdString);
            if (count($parts) >= 3) {
                $imageId = (int) end($parts);
                $image = \App\Models\Image::find($imageId);
                if ($image) {
                    $product->update(['featured_image_id' => $image->id]);
                    Log::info('Set featured_image_id to existing image (updateVariants)', ['image_id' => $image->id]);
                } else {
                    Log::warning('Featured image ID not found (updateVariants)', ['image_id' => $imageId]);
                }
            } else {
                Log::warning('Invalid featured_image_id format (updateVariants)', ['format' => $featuredImageIdString]);
            }
        } elseif ($featuredImageIdString === null || $featuredImageIdString === '') {
            // Clear featured image if explicitly set to null/empty
            $product->update(['featured_image_id' => null]);
            Log::info('Cleared featured_image_id (updateVariants)');
        } else {
            Log::warning('Unhandled featured_image_id format (updateVariants)', ['format' => $featuredImageIdString]);
        }
    }

    /**
     * Get variant key from attributes collection.
     */
    protected function getVariantKeyFromAttributes($attributes): string
    {
        $attributeMap = [];
        foreach ($attributes as $attr) {
            $attributeMap[$attr->id] = $attr->pivot->value;
        }
        return $this->getVariantKeyFromAttributesArray($attributeMap);
    }

    /**
     * Get variant key from attributes array.
     */
    protected function getVariantKeyFromAttributesArray(array $attributes): string
    {
        ksort($attributes);
        return implode('|', array_map(fn($id, $value) => "{$id}:{$value}", array_keys($attributes), $attributes));
    }

    /**
     * Create variants for a product.
     */
    protected function createVariants(Product $product, array $variantsData, ?string $featuredImageIdString = null): void
    {
        $featuredImage = null;
        
        foreach ($variantsData as $variantIndex => $variant) {
            if (empty($variant) || !is_array($variant)) {
                continue;
            }

            // Extract attributes, price, stock, and images from the variant
            if (!isset($variant['attributes']) || !is_array($variant['attributes']) || empty($variant['attributes'])) {
                continue;
            }

            $attributes = [];
            foreach ($variant['attributes'] as $attrId => $value) {
                $attributes[(int) $attrId] = $value;
            }

            if (empty($attributes)) {
                continue;
            }

            $variantModel = ProductVariant::create([
                'product_id' => $product->id,
                'sku' => $variant['sku'] ?? null,
                'price' => $variant['price'] ?? 0,
                'stock' => $variant['stock'] ?? 0,
                'is_active' => true,
            ]);

            // Attach attributes with values
            foreach ($attributes as $attrId => $value) {
                $variantModel->attributes()->attach($attrId, ['value' => $value]);
            }

            // Handle multiple image uploads
            if (!empty($variant['images']) && is_array($variant['images'])) {
                foreach ($variant['images'] as $imageIndex => $image) {
                    if ($image instanceof UploadedFile) {
                        $storedImage = $this->storeVariantImage($variantModel, $image, $imageIndex);
                        
                        // Check if this is the featured image
                        // Format: "new-{variantIndex}-{imageIndex}"
                        if ($featuredImageIdString && $featuredImageIdString === "new-{$variantIndex}-{$imageIndex}") {
                            $featuredImage = $storedImage;
                        }
                    }
                }
            }
        }
        
        // Set featured image on product
        if ($featuredImage) {
            $product->update(['featured_image_id' => $featuredImage->id]);
        } elseif ($featuredImageIdString && str_starts_with($featuredImageIdString, 'existing-')) {
            // For existing images, parse the image ID from the string
            // Format: "existing-{variantIndex}-{imageId}"
            $parts = explode('-', $featuredImageIdString);
            if (count($parts) >= 3) {
                $imageId = (int) end($parts);
                $image = \App\Models\Image::find($imageId);
                if ($image) {
                    $product->update(['featured_image_id' => $image->id]);
                }
            }
        } elseif ($featuredImageIdString === null || $featuredImageIdString === '') {
            // Clear featured image if explicitly set to null/empty
            $product->update(['featured_image_id' => null]);
        }
    }

    /**
     * Store an image for a variant.
     */
    protected function storeVariantImage(ProductVariant $variant, UploadedFile $file, int $order = 0): \App\Models\Image
    {
        $path = $file->store('products/variants', 'public');
        
        return $variant->images()->create([
            'image_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'order' => $order,
        ]);
    }

    /**
     * Store an image for a product.
     */
    protected function storeProductImage(Product $product, UploadedFile $file): void
    {
        $path = $file->store('products', 'public');
        
        $image = $product->images()->create([
            'image_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'order' => 0,
        ]);
        
        // Set as featured image if product doesn't have one
        if (!$product->featured_image_id) {
            $product->update(['featured_image_id' => $image->id]);
        }
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

