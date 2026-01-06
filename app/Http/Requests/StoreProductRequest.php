<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $data = $this->all();

        // Cast variant stock values to integers and ensure attributes keys are strings
        if (isset($data['variants']) && is_array($data['variants'])) {
            foreach ($data['variants'] as $variantIndex => $variant) {
                if (is_array($variant)) {
                    if (isset($variant['stock'])) {
                        $data['variants'][$variantIndex]['stock'] = (int) $variant['stock'];
                    }
                    if (isset($variant['attributes']) && is_array($variant['attributes'])) {
                        // Ensure attribute keys are strings
                        $normalizedAttributes = [];
                        foreach ($variant['attributes'] as $attrId => $value) {
                            $normalizedAttributes[(string) $attrId] = $value;
                        }
                        $data['variants'][$variantIndex]['attributes'] = $normalizedAttributes;
                    }
                }
            }
        }

        $this->merge($data);
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $variants = $this->input('variants', []);
            $isVariable = $this->input('is_variable', false);
            
            foreach ($variants as $variantIndex => $variant) {
                if (isset($variant['attributes']) && is_array($variant['attributes'])) {
                    foreach (array_keys($variant['attributes']) as $attrId) {
                        if (!\App\Models\Attribute::where('id', $attrId)->exists()) {
                            $validator->errors()->add(
                                "variants.{$variantIndex}.attributes.{$attrId}",
                                "The selected attribute ID {$attrId} is invalid."
                            );
                        }
                    }
                }
            }

            // Validate that image is not provided for variable products
            if ($isVariable && $this->hasFile('image')) {
                $validator->errors()->add(
                    'image',
                    'Product image cannot be set for variable products.'
                );
            }
        });
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $isVariable = $this->input('is_variable', false);

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:products,slug'],
            'description' => ['nullable', 'string'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'sku' => ['nullable', 'string', 'max:255', 'unique:products,sku'],
            'is_active' => ['boolean'],
            'is_variable' => ['boolean'],
            'image' => $isVariable ? ['nullable'] : ['nullable', 'image', 'max:2048'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['exists:categories,id'],
            'variants' => ['nullable', 'array'],
            'variants.*' => ['required', 'array'],
            'variants.*.attributes' => ['required', 'array'],
            'variants.*.attributes.*' => ['required', 'string'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.stock' => ['required', 'integer', 'min:0'],
            'variants.*.sku' => ['nullable', 'string', 'max:255'],
            'variants.*.images' => ['nullable', 'array'],
            'variants.*.images.*' => ['nullable', 'image', 'max:2048'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'image.max' => 'The product image must be less than 2MB.',
            'image.image' => 'The product image must be a valid image file.',
            'variants.*.images.*.max' => 'The image must be less than 2MB.',
            'variants.*.images.*.image' => 'The file must be a valid image.',
            'variants.*.attributes.required' => 'The attributes are required.',
            'variants.*.attributes.*.required' => 'The attribute value is required.',
            'variants.*.price.required' => 'The price is required.',
            'variants.*.price.numeric' => 'The price must be a number.',
            'variants.*.price.min' => 'The price must be at least 0.',
            'variants.*.stock.required' => 'The stock is required.',
            'variants.*.stock.integer' => 'The stock must be a whole number.',
            'variants.*.stock.min' => 'The stock must be at least 0.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'image' => 'product image',
            'variants.*.sku' => 'SKU',
            'variants.*.images.*' => 'image',
            'variants.*.attributes' => 'attributes',
            'variants.*.attributes.*' => 'attribute value',
            'variants.*.price' => 'price',
            'variants.*.stock' => 'stock',
        ];
    }
}

