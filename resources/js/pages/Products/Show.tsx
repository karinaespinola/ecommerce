import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Package, Tag } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes/admin';

interface Category {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number | null;
    sku: string | null;
    is_active: boolean;
    is_variable: boolean;
    created_at: string;
    updated_at: string;
    categories: Category[];
}

interface ProductsShowProps {
    product: Product;
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
        title: 'View',
    },
];

export default function ProductsShow({ product }: ProductsShowProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Product: ${product.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/products">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-semibold">{product.name}</h1>
                            <p className="text-muted-foreground">
                                Product details and information
                            </p>
                        </div>
                    </div>
                    <Link href={`/admin/products/${product.id}/edit`}>
                        <Button>
                            <Edit className="size-4" />
                            Edit Product
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Information</CardTitle>
                            <CardDescription>
                                Basic details about this product
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Name
                                </div>
                                <div className="mt-1 text-base">{product.name}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Slug
                                </div>
                                <div className="mt-1 text-base font-mono text-sm">
                                    {product.slug}
                                </div>
                            </div>
                            {product.description && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Description
                                    </div>
                                    <div className="mt-1 text-base">
                                        {product.description}
                                    </div>
                                </div>
                            )}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Price
                                    </div>
                                    <div className="mt-1 text-base">
                                        {product.price
                                            ? `$${Number(product.price).toFixed(2)}`
                                            : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        SKU
                                    </div>
                                    <div className="mt-1 text-base">
                                        {product.sku || (
                                            <span className="text-muted-foreground italic">
                                                No SKU
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {!product.is_variable && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Stock
                                    </div>
                                    <div className="mt-1 text-base">
                                        {product.stock !== null ? (
                                            <span className="flex items-center gap-2">
                                                <Package className="size-4" />
                                                {product.stock} units
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground italic">
                                                Not tracked
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-4">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Status
                                    </div>
                                    <div className="mt-1">
                                        <Badge
                                            variant={
                                                product.is_active ? 'default' : 'outline'
                                            }
                                        >
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Type
                                    </div>
                                    <div className="mt-1">
                                        <Badge variant="secondary">
                                            {product.is_variable
                                                ? 'Variable'
                                                : 'Simple'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Created
                                </div>
                                <div className="mt-1 text-sm">
                                    {new Date(product.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {product.categories && product.categories.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="size-4" />
                                    Categories
                                </CardTitle>
                                <CardDescription>
                                    Categories this product belongs to
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {product.categories.map((category) => (
                                        <Link
                                            key={category.id}
                                            href={`/categories/${category.id}`}
                                        >
                                            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                                                {category.name}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

