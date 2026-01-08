import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    sku: string | null;
    is_active: boolean;
    is_variable: boolean;
    categories: Category[];
    created_at: string;
    updated_at: string;
}

interface PaginatedProducts {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface ProductsIndexProps {
    products: PaginatedProducts;
    categories: Category[];
    filters: {
        is_active?: string;
        category_id?: string;
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Products',
    },
];

export default function ProductsIndex({
    products,
    categories,
    filters,
}: ProductsIndexProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(
        filters.category_id || 'all'
    );
    const [statusFilter, setStatusFilter] = useState(
        filters.is_active !== undefined ? filters.is_active : 'all'
    );
    const { flash } = usePage().props;

    const handleDelete = (id: number) => {
        router.delete(`/admin/products/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(null);
            },
        });
    };

    const handleFilter = () => {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (categoryFilter !== 'all') params.category_id = categoryFilter;
        if (statusFilter !== 'all') params.is_active = statusFilter;

        router.get('/admin/products', params, {
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setCategoryFilter('all');
        setStatusFilter('all');
        router.get('/admin/products', {}, { preserveScroll: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Products</h1>
                        <p className="text-muted-foreground">
                            Manage your product catalog
                        </p>
                    </div>
                    <Link href="/admin/products/create">
                        <Button>
                            <Plus className="size-4" />
                            Add Product
                        </Button>
                    </Link>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
                        {flash.success}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>
                            Filter products by status, category, or search term
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search products..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleFilter();
                                            }
                                        }}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <Select
                                value={categoryFilter}
                                onValueChange={setCategoryFilter}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={category.id.toString()}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="1">Active</SelectItem>
                                    <SelectItem value="0">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleFilter}>Apply Filters</Button>
                            {(search || categoryFilter !== 'all' || statusFilter !== 'all') && (
                                <Button
                                    variant="outline"
                                    onClick={clearFilters}
                                    className="gap-2"
                                >
                                    <X className="size-4" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>All Products</CardTitle>
                        <CardDescription>
                            {products.total} product{products.total !== 1 ? 's' : ''} total
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {products.data.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                No products found. Create your first product to get started.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="px-4 py-3 text-left text-sm font-medium">
                                                    Name
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-medium">
                                                    SKU
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-medium">
                                                    Price
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-medium">
                                                    Categories
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-medium">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.data.map((product) => (
                                                <tr
                                                    key={product.id}
                                                    className="border-b transition-colors hover:bg-muted/50"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium">
                                                            {product.name}
                                                        </div>
                                                        {product.description && (
                                                            <div className="text-xs text-muted-foreground line-clamp-1">
                                                                {product.description}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                                        {product.sku || (
                                                            <span className="italic">No SKU</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {product.price
                                                            ? `$${Number(product.price).toFixed(2)}`
                                                            : 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {product.categories.length > 0 ? (
                                                                product.categories.map((category) => (
                                                                    <Badge
                                                                        key={category.id}
                                                                        variant="secondary"
                                                                    >
                                                                        {category.name}
                                                                    </Badge>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground italic">
                                                                    No categories
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            variant={
                                                                product.is_active
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                        >
                                                            {product.is_active
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link href={`/admin/products/${product.id}`}>
                                                                <Button variant="ghost" size="sm">
                                                                    View
                                                                </Button>
                                                            </Link>
                                                            <Link
                                                                href={`/admin/products/${product.id}/edit`}
                                                            >
                                                                <Button variant="ghost" size="sm">
                                                                    <Pencil className="size-4" />
                                                                </Button>
                                                            </Link>
                                                            <Dialog
                                                                open={deleteDialogOpen === product.id}
                                                                onOpenChange={(open) =>
                                                                    setDeleteDialogOpen(
                                                                        open ? product.id : null
                                                                    )
                                                                }
                                                            >
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-destructive hover:text-destructive"
                                                                    >
                                                                        <Trash2 className="size-4" />
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>
                                                                            Delete Product
                                                                        </DialogTitle>
                                                                        <DialogDescription>
                                                                            Are you sure you want to
                                                                            delete "{product.name}"?
                                                                            This action cannot be
                                                                            undone.
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <DialogFooter>
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() =>
                                                                                setDeleteDialogOpen(
                                                                                    null
                                                                                )
                                                                            }
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                        <Button
                                                                            variant="destructive"
                                                                            onClick={() =>
                                                                                handleDelete(
                                                                                    product.id
                                                                                )
                                                                            }
                                                                        >
                                                                            Delete
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {products.last_page > 1 && (
                                    <div className="flex items-center justify-between border-t pt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {products.data.length} of{' '}
                                            {products.total} products
                                        </div>
                                        <div className="flex gap-2">
                                            {products.links.map((link, index) => {
                                                if (
                                                    link.url === null ||
                                                    (index === 0 && products.current_page === 1) ||
                                                    (index ===
                                                        products.links.length - 1 &&
                                                        products.current_page ===
                                                            products.last_page)
                                                ) {
                                                    return (
                                                        <span
                                                            key={index}
                                                            className="px-3 py-2 text-sm text-muted-foreground"
                                                            dangerouslySetInnerHTML={{
                                                                __html: link.label,
                                                            }}
                                                        />
                                                    );
                                                }

                                                return (
                                                    <Link
                                                        key={index}
                                                        href={link.url!}
                                                        className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                                            link.active
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'hover:bg-muted'
                                                        }`}
                                                        dangerouslySetInnerHTML={{
                                                            __html: link.label,
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

