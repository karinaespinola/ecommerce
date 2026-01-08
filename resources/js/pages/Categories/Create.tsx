import { type BreadcrumbItem } from '@/types';
import { Form, Head, Link, router } from '@inertiajs/react';
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
        title: 'Create',
    },
];

export default function CategoriesCreate() {
    const [processing, setProcessing] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);

        const formData = new FormData(e.currentTarget);
        router.post('/admin/categories', formData, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Category" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/categories">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold">Create Category</h1>
                        <p className="text-muted-foreground">
                            Add a new product category
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Category Information</CardTitle>
                        <CardDescription>
                            Enter the details for your new category
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
                                    autoFocus
                                    placeholder="Category name"
                                />
                                <InputError message="" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    placeholder="category-slug (auto-generated if empty)"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty to auto-generate from name
                                </p>
                                <InputError message="" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    placeholder="Category description"
                                />
                                <InputError message="" />
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
                                <InputError message="" />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create Category'}
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

