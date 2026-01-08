<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAttributeRequest;
use App\Http\Requests\UpdateAttributeRequest;
use App\Services\AttributeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttributeController extends Controller
{
    public function __construct(
        protected AttributeService $attributeService
    ) {
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $attributes = $this->attributeService->getAll(
            $request->integer('per_page', 15),
            $request->only(['is_active', 'search'])
        );

        if ($request->wantsJson()) {
            return response()->json($attributes);
        }

        return Inertia::render('Attributes/Index', [
            'attributes' => $attributes,
            'filters' => $request->only(['is_active', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Attributes/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAttributeRequest $request): RedirectResponse|JsonResponse
    {
        $attribute = $this->attributeService->create($request->validated());

        if ($request->wantsJson()) {
            return response()->json($attribute);
        }

        return redirect()
            ->route('admin.attributes.index')
            ->with('success', 'Attribute created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id): Response|JsonResponse
    {
        $attribute = $this->attributeService->getById($id);

        if (!$attribute) {
            abort(404);
        }

        if (request()->wantsJson()) {
            return response()->json($attribute);
        }

        return Inertia::render('Attributes/Show', [
            'attribute' => $attribute->load('productVariants'),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(int $id): Response
    {
        $attribute = $this->attributeService->getById($id);

        if (!$attribute) {
            abort(404);
        }

        return Inertia::render('Attributes/Edit', [
            'attribute' => $attribute,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAttributeRequest $request, int $id): RedirectResponse
    {
        $attribute = $this->attributeService->getById($id);

        if (!$attribute) {
            abort(404);
        }

        $this->attributeService->update($attribute, $request->validated());

        return redirect()
            ->route('admin.attributes.index')
            ->with('success', 'Attribute updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id): RedirectResponse|JsonResponse
    {
        $attribute = $this->attributeService->getById($id);

        if (!$attribute) {
            abort(404);
        }

        $this->attributeService->delete($attribute);

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Attribute deleted successfully.']);
        }

        return redirect()
            ->route('admin.attributes.index')
            ->with('success', 'Attribute deleted successfully.');
    }
}

