import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

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
}

interface PaginatedCategories {
    data: Category[];
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

interface CategoriesIndexProps {
    categories: PaginatedCategories;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Categories',
    },
];

export default function CategoriesIndex({ categories }: CategoriesIndexProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);
    const { flash } = usePage().props;

    const handleDelete = (id: number) => {
        router.delete(`/categories/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Categories</h1>
                        <p className="text-muted-foreground">
                            Manage your product categories
                        </p>
                    </div>
                    <Link href="/admin/categories/create">
                        <Button>
                            <Plus className="size-4" />
                            Add Category
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
                        <CardTitle>All Categories</CardTitle>
                        <CardDescription>
                            {categories.total} category{categories.total !== 1 ? 'ies' : ''} total
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {categories.data.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                No categories found. Create your first category to get started.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="px-4 py-3 text-left text-sm font-medium">
                                                    Image
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-medium">
                                                    Name
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-medium">
                                                    Slug
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-medium">
                                                    Description
                                                </th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.data.map((category) => (
                                                <tr
                                                    key={category.id}
                                                    className="border-b transition-colors hover:bg-muted/50"
                                                >
                                                    <td className="px-4 py-3">
                                                        {category.image ? (
                                                            <img
                                                                src={`/storage/${category.image}`}
                                                                alt={category.name}
                                                                className="w-12 h-12 object-cover rounded"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                                                                No Image
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium">
                                                            {category.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                                        {category.slug}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                                        {category.description || (
                                                            <span className="italic">No description</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link
                                                                href={`/categories/${category.id}`}
                                                            >
                                                                <Button variant="ghost" size="sm">
                                                                    View
                                                                </Button>
                                                            </Link>
                                                            <Link
                                                                href={`/categories/${category.id}/edit`}
                                                            >
                                                                <Button variant="ghost" size="sm">
                                                                    <Pencil className="size-4" />
                                                                </Button>
                                                            </Link>
                                                            <Dialog
                                                                open={deleteDialogOpen === category.id}
                                                                onOpenChange={(open) =>
                                                                    setDeleteDialogOpen(
                                                                        open ? category.id : null
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
                                                                            Delete Category
                                                                        </DialogTitle>
                                                                        <DialogDescription>
                                                                            Are you sure you want to
                                                                            delete "{category.name}"?
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
                                                                                    category.id
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

                                {categories.last_page > 1 && (
                                    <div className="flex items-center justify-between border-t pt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {categories.data.length} of{' '}
                                            {categories.total} categories
                                        </div>
                                        <div className="flex gap-2">
                                            {categories.links.map((link, index) => {
                                                if (
                                                    link.url === null ||
                                                    (index === 0 && categories.current_page === 1) ||
                                                    (index ===
                                                        categories.links.length - 1 &&
                                                        categories.current_page ===
                                                            categories.last_page)
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

