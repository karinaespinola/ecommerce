import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Package } from 'lucide-react';

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
    slug: string;
    description: string | null;
    image: string | null;
    created_at: string;
    updated_at: string;
    products?: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
}

interface CategoriesShowProps {
    category: Category;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Categories',
        href: '/admin/categories',
    },
    {
        title: 'View',
    },
];

export default function CategoriesShow({ category }: CategoriesShowProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Category: ${category.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/categories">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-semibold">{category.name}</h1>
                            <p className="text-muted-foreground">
                                Category details and products
                            </p>
                        </div>
                    </div>
                    <Link href={`/admin/categories/${category.id}/edit`}>
                        <Button>
                            <Edit className="size-4" />
                            Edit Category
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Category Information</CardTitle>
                            <CardDescription>
                                Basic details about this category
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {category.image && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-2">
                                        Image
                                    </div>
                                    <img
                                        src={`/storage/${category.image}`}
                                        alt={category.name}
                                        className="w-full max-w-md h-auto rounded-lg"
                                    />
                                </div>
                            )}
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Name
                                </div>
                                <div className="mt-1 text-base">{category.name}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Slug
                                </div>
                                <div className="mt-1 text-base font-mono text-sm">
                                    {category.slug}
                                </div>
                            </div>
                            {category.description && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Description
                                    </div>
                                    <div className="mt-1 text-base">
                                        {category.description}
                                    </div>
                                </div>
                            )}
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Created
                                </div>
                                <div className="mt-1 text-sm">
                                    {new Date(category.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {category.products && category.products.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="size-4" />
                                    Products
                                </CardTitle>
                                <CardDescription>
                                    Products in this category
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {category.products.map((product) => (
                                        <Link
                                            key={product.id}
                                            href={`/admin/products/${product.id}`}
                                            className="block rounded-md border p-3 transition-colors hover:bg-muted"
                                        >
                                            <div className="font-medium">{product.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {product.slug}
                                            </div>
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

