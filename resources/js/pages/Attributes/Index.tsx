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
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';

interface Attribute {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface PaginatedAttributes {
    data: Attribute[];
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

interface AttributesIndexProps {
    attributes: PaginatedAttributes;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Attributes',
    },
];

export default function AttributesIndex({ attributes }: AttributesIndexProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);
    const { flash } = usePage().props;

    const handleDelete = (id: number) => {
        router.delete(`/attributes/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attributes" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Attributes</h1>
                        <p className="text-muted-foreground">
                            Manage your product attributes
                        </p>
                    </div>
                    <Link href="/attributes/create">
                        <Button>
                            <Plus className="size-4" />
                            Add Attribute
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
                        <CardTitle>All Attributes</CardTitle>
                        <CardDescription>
                            {attributes.total} attribute{attributes.total !== 1 ? 's' : ''} total
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {attributes.data.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                No attributes found. Create your first attribute to get started.
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
                                                    Slug
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
                                            {attributes.data.map((attribute) => (
                                                <tr
                                                    key={attribute.id}
                                                    className="border-b transition-colors hover:bg-muted/50"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium">
                                                            {attribute.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                                        {attribute.slug}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            variant={
                                                                attribute.is_active
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {attribute.is_active
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link
                                                                href={`/attributes/${attribute.id}`}
                                                            >
                                                                <Button variant="ghost" size="sm">
                                                                    View
                                                                </Button>
                                                            </Link>
                                                            <Link
                                                                href={`/attributes/${attribute.id}/edit`}
                                                            >
                                                                <Button variant="ghost" size="sm">
                                                                    <Pencil className="size-4" />
                                                                </Button>
                                                            </Link>
                                                            <Dialog
                                                                open={deleteDialogOpen === attribute.id}
                                                                onOpenChange={(open) =>
                                                                    setDeleteDialogOpen(
                                                                        open ? attribute.id : null
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
                                                                            Delete Attribute
                                                                        </DialogTitle>
                                                                        <DialogDescription>
                                                                            Are you sure you want to
                                                                            delete "{attribute.name}"?
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
                                                                                    attribute.id
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

                                {attributes.last_page > 1 && (
                                    <div className="flex items-center justify-between border-t pt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {attributes.data.length} of{' '}
                                            {attributes.total} attributes
                                        </div>
                                        <div className="flex gap-2">
                                            {attributes.links.map((link, index) => {
                                                if (
                                                    link.url === null ||
                                                    (index === 0 && attributes.current_page === 1) ||
                                                    (index ===
                                                        attributes.links.length - 1 &&
                                                        attributes.current_page ===
                                                            attributes.last_page)
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

