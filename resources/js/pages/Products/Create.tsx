import { type BreadcrumbItem } from '@/types';
import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useRef, useState } from 'react';

import InputError from '@/components/input-error';
import ProductVariantsManager from '@/components/ProductVariantsManager';
import ValidationErrors from '@/components/validation-errors';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes/admin';

interface Category {
    id: number;
    name: string;
}

interface Attribute {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
}

interface ProductsCreateProps {
    categories: Category[];
    attributes: Attribute[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Products',
        href: '/admin/products',
    },
    {
        title: 'Create',
    },
];

interface VariantData {
    attributes: Record<number, string>;
    price: number;
    stock: number;
    images: File[];
    primaryNewImageIndex?: number;
    sku?: string;
}

export default function ProductsCreate({ categories, attributes }: ProductsCreateProps) {
    const [processing, setProcessing] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [isVariable, setIsVariable] = useState(false);
    const [variants, setVariants] = useState<VariantData[]>([]);
    const [productImage, setProductImage] = useState<File | null>(null);
    const [featuredImageId, setFeaturedImageId] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const pageProps = usePage().props as { errors?: Record<string, string | string[]> };
    const errors = pageProps.errors || {};

    // Helper to get error message (handles both string and array)
    const getErrorMessage = (key: string): string | undefined => {
        const error = errors[key];
        if (!error) return undefined;
        if (Array.isArray(error)) return error[0];
        return error;
    };

    const handleCategoryToggle = (categoryId: number) => {
        setSelectedCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);

        const formData = new FormData(e.currentTarget);
        formData.set('is_active', isActive ? '1' : '0');
        formData.set('is_variable', isVariable ? '1' : '0');
        
        selectedCategories.forEach((id) => {
            formData.append('category_ids[]', id.toString());
        });

        // Add product image if it's not a variable product
        if (!isVariable && productImage) {
            formData.append('image', productImage);
        } else if (isVariable) {
            // Explicitly set image to null for variable products
            formData.append('image', '');
        }

        // Add variants data if it's a variable product
        if (isVariable && variants.length > 0) {
            variants.forEach((variant, variantIndex) => {
                // Add attributes as an object/map
                Object.entries(variant.attributes).forEach(([attrId, value]) => {
                    formData.append(`variants[${variantIndex}][attributes][${attrId}]`, value);
                });
                // Add price, stock, and images at the variant level
                formData.append(`variants[${variantIndex}][price]`, String(variant.price));
                formData.append(`variants[${variantIndex}][stock]`, String(variant.stock));
                // Add multiple images for this variant
                if (variant.images && variant.images.length > 0) {
                    variant.images.forEach((image) => {
                        formData.append(`variants[${variantIndex}][images][]`, image);
                    });
                }
            });
        }

        // Add featured image ID if specified
        if (featuredImageId) {
            formData.append('featured_image_id', featuredImageId);
        }

        router.post('/admin/products', formData, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Product" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold">Create Product</h1>
                        <p className="text-muted-foreground">
                            Add a new product to your catalog
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <ValidationErrors errors={errors} />
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Information</CardTitle>
                            <CardDescription>
                                Enter the basic details for your product
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    autoFocus
                                    placeholder="Product name"
                                />
                                <InputError message={getErrorMessage('name')} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    placeholder="product-slug (auto-generated if empty)"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty to auto-generate from name
                                </p>
                                <InputError message={getErrorMessage('slug')} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    placeholder="Product description"
                                />
                                <InputError message={getErrorMessage('description')} />
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price</Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                    />
                                    <InputError message={getErrorMessage('price')} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU</Label>
                                    <Input
                                        id="sku"
                                        name="sku"
                                        placeholder="Product SKU"
                                    />
                                    <InputError message={getErrorMessage('sku')} />
                                </div>
                            </div>

                            {!isVariable && (
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Stock</Label>
                                    <Input
                                        id="stock"
                                        name="stock"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                    />
                                    <InputError message={getErrorMessage('stock')} />
                                </div>
                            )}

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={isActive}
                                        onCheckedChange={(checked) =>
                                            setIsActive(checked === true)
                                        }
                                    />
                                    <Label htmlFor="is_active" className="cursor-pointer">
                                        Active
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="is_variable"
                                        checked={isVariable}
                                        onCheckedChange={(checked) => {
                                            setIsVariable(checked === true);
                                            // Clear product image when switching to variable
                                            if (checked === true) {
                                                setProductImage(null);
                                                if (imageInputRef.current) {
                                                    imageInputRef.current.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <Label htmlFor="is_variable" className="cursor-pointer">
                                        Variable Product
                                    </Label>
                                </div>
                            </div>

                            {!isVariable && (
                                <div className="space-y-2">
                                    <Label htmlFor="image">Product Image</Label>
                                    <Input
                                        ref={imageInputRef}
                                        id="image"
                                        name="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            setProductImage(file);
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Upload an image for this product (max 2MB)
                                    </p>
                                    {productImage && (
                                        <div className="mt-2">
                                            <p className="text-sm text-muted-foreground">
                                                Selected: {productImage.name}
                                            </p>
                                        </div>
                                    )}
                                    <InputError message={getErrorMessage('image')} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <ProductVariantsManager
                        attributes={attributes}
                        isVariable={isVariable}
                        onVariantsChange={setVariants}
                        onFeaturedImageChange={setFeaturedImageId}
                    />

                    {categories.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Categories</CardTitle>
                                <CardDescription>
                                    Select the categories for this product
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {categories.map((category) => (
                                        <div
                                            key={category.id}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                id={`category-${category.id}`}
                                                checked={selectedCategories.includes(
                                                    category.id
                                                )}
                                                onCheckedChange={() =>
                                                    handleCategoryToggle(category.id)
                                                }
                                            />
                                            <Label
                                                htmlFor={`category-${category.id}`}
                                                className="cursor-pointer"
                                            >
                                                {category.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                <InputError message={getErrorMessage('category_ids')} />
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Product'}
                        </Button>
                        <Link href="/admin/products">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

