<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductImageRequest;
use App\Http\Requests\UpdateProductImageRequest;
use App\Models\Image;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductImageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, string $type, int $id): Response|JsonResponse
    {
        $imageable = $this->getImageable($type, $id);
        $images = $imageable->images()->orderBy('order')->get();

        if ($request->wantsJson()) {
            return response()->json($images);
        }

        return Inertia::render('ProductImages/Index', [
            'imageable' => $imageable,
            'images' => $images,
            'type' => $type,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(string $type, int $id): Response
    {
        $imageable = $this->getImageable($type, $id);

        return Inertia::render('ProductImages/Create', [
            'imageable' => $imageable,
            'type' => $type,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProductImageRequest $request, string $type, int $id): RedirectResponse|JsonResponse
    {
        $imageable = $this->getImageable($type, $id);

        $image = $imageable->images()->create($request->validated());

        if ($request->wantsJson()) {
            return response()->json($image, 201);
        }

        return redirect()
            ->route('admin.images.index', [$type, $id])
            ->with('success', 'Image created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $type, int $id, int $imageId): Response|JsonResponse
    {
        $imageable = $this->getImageable($type, $id);
        $image = $imageable->images()->findOrFail($imageId);

        if (request()->wantsJson()) {
            return response()->json($image);
        }

        return Inertia::render('ProductImages/Show', [
            'image' => $image,
            'imageable' => $imageable,
            'type' => $type,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $type, int $id, int $imageId): Response
    {
        $imageable = $this->getImageable($type, $id);
        $image = $imageable->images()->findOrFail($imageId);

        return Inertia::render('ProductImages/Edit', [
            'image' => $image,
            'imageable' => $imageable,
            'type' => $type,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProductImageRequest $request, string $type, int $id, int $imageId): RedirectResponse|JsonResponse
    {
        $imageable = $this->getImageable($type, $id);
        $image = $imageable->images()->findOrFail($imageId);

        $image->update($request->validated());

        if ($request->wantsJson()) {
            return response()->json($image);
        }

        return redirect()
            ->route('admin.images.index', [$type, $id])
            ->with('success', 'Image updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $type, int $id, int $imageId): RedirectResponse|JsonResponse
    {
        $imageable = $this->getImageable($type, $id);
        $image = $imageable->images()->findOrFail($imageId);

        $image->delete();

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Image deleted successfully.']);
        }

        return redirect()
            ->route('admin.images.index', [$type, $id])
            ->with('success', 'Image deleted successfully.');
    }

    /**
     * Get the imageable model based on type.
     */
    private function getImageable(string $type, int $id): Product|ProductVariant
    {
        return match ($type) {
            'products' => Product::findOrFail($id),
            'product-variants' => ProductVariant::findOrFail($id),
            default => abort(404, 'Invalid imageable type'),
        };
    }
}
