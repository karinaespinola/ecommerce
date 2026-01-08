import { type BreadcrumbItem } from '@/types';
import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useRef, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
    slug: string;
    description: string | null;
    image: string | null;
}

interface CategoriesEditProps {
    category: Category;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Categories',
        href: '/categories',
    },
    {
        title: 'Edit',
    },
];

export default function CategoriesEdit({ category }: CategoriesEditProps) {
    const [processing, setProcessing] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const { errors } = usePage().props;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);

        const formData = new FormData(e.currentTarget);
        router.put(`/categories/${category.id}`, formData, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Category: ${category.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/categories">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold">Edit Category</h1>
                        <p className="text-muted-foreground">
                            Update category information
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Category Information</CardTitle>
                        <CardDescription>
                            Update the details for this category
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    defaultValue={category.name}
                                    autoFocus
                                />
                                <InputError message={errors?.name as string} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    defaultValue={category.slug}
                                    placeholder="category-slug"
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
                                    defaultValue={category.description || ''}
                                />
                                <InputError message={errors?.description as string} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">Category Image</Label>
                                <Input
                                    ref={imageInputRef}
                                    id="image"
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setImage(file);
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Upload an image for this category (max 2MB)
                                </p>
                                {image && (
                                    <div className="mt-2">
                                        <p className="text-sm text-muted-foreground">
                                            Selected: {image.name}
                                        </p>
                                    </div>
                                )}
                                {!image && category.image && (
                                    <div className="mt-2">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Current image:
                                        </p>
                                        <img
                                            src={`/storage/${category.image}`}
                                            alt={category.name}
                                            className="w-32 h-32 object-cover rounded"
                                        />
                                    </div>
                                )}
                                <InputError message={errors?.image as string} />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Updating...' : 'Update Category'}
                                </Button>
                                <Link href="/categories">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

