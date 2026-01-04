import { type BreadcrumbItem } from '@/types';
import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import ProductVariantsManager from '@/components/ProductVariantsManager';
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
import { dashboard } from '@/routes';

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

interface Product {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    sku: string | null;
    is_active: boolean;
    is_variable: boolean;
    categories: Category[];
}

interface VariantData {
    attributes: Record<number, string>;
    price: string;
    stock: string;
    images: File[];
    sku?: string;
}

interface ProductsEditProps {
    product: Product;
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
        href: '/products',
    },
    {
        title: 'Edit',
    },
];

export default function ProductsEdit({
    product,
    categories,
    attributes,
}: ProductsEditProps) {
    const [processing, setProcessing] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<number[]>(
        product.categories.map((c) => c.id)
    );
    const [isActive, setIsActive] = useState(product.is_active);
    const [isVariable, setIsVariable] = useState(product.is_variable);
    const [variants, setVariants] = useState<VariantData[]>([]);
    const { errors } = usePage().props;

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

        // Add variants data if it's a variable product
        if (isVariable && variants.length > 0) {
            variants.forEach((variant, index) => {
                // Add attributes for this variant
                Object.entries(variant.attributes).forEach(([attrId, value]) => {
                    formData.append(`variants[${index}][attributes][${attrId}]`, value);
                });
                formData.append(`variants[${index}][price]`, variant.price);
                formData.append(`variants[${index}][stock]`, variant.stock);
                if (variant.sku) {
                    formData.append(`variants[${index}][sku]`, variant.sku);
                }
                // Add multiple images for this variant
                if (variant.images && variant.images.length > 0) {
                    variant.images.forEach((image) => {
                        formData.append(`variants[${index}][images][]`, image);
                    });
                }
            });
        }

        router.put(`/products/${product.id}`, formData, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Product: ${product.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/products">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold">Edit Product</h1>
                        <p className="text-muted-foreground">
                            Update product information
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Information</CardTitle>
                            <CardDescription>
                                Update the basic details for your product
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
                                    defaultValue={product.name}
                                    autoFocus
                                />
                                <InputError message={errors?.name as string} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    defaultValue={product.slug}
                                    placeholder="product-slug"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty to auto-generate from name
                                </p>
                                <InputError message={errors?.slug as string} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    defaultValue={product.description || ''}
                                />
                                <InputError message={errors?.description as string} />
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
                                        defaultValue={product.price || ''}
                                    />
                                    <InputError message={errors?.price as string} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU</Label>
                                    <Input
                                        id="sku"
                                        name="sku"
                                        defaultValue={product.sku || ''}
                                    />
                                    <InputError message={errors?.sku as string} />
                                </div>
                            </div>

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
                                        onCheckedChange={(checked) =>
                                            setIsVariable(checked === true)
                                        }
                                    />
                                    <Label htmlFor="is_variable" className="cursor-pointer">
                                        Variable Product
                                    </Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <ProductVariantsManager
                        attributes={attributes}
                        isVariable={isVariable}
                        onVariantsChange={setVariants}
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
                                <InputError message={errors?.category_ids as string} />
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Updating...' : 'Update Product'}
                        </Button>
                        <Link href="/products">
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

