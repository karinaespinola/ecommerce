import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

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
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes/admin';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Attributes',
        href: '/admin/attributes',
    },
    {
        title: 'Create',
    },
];

export default function AttributesCreate() {
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);

        const formData = new FormData(e.currentTarget);
        // Handle checkbox - if not checked, explicitly set to false
        if (!formData.has('is_active')) {
            formData.append('is_active', '0');
        }
        router.post('/admin/attributes', formData, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Attribute" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/attributes">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold">Create Attribute</h1>
                        <p className="text-muted-foreground">
                            Add a new product attribute
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Attribute Information</CardTitle>
                        <CardDescription>
                            Enter the details for your new attribute
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
                                    placeholder="Attribute name (e.g., Color, Size)"
                                />
                                <InputError message="" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    placeholder="attribute-slug (auto-generated if empty)"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty to auto-generate from name
                                </p>
                                <InputError message="" />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_active"
                                    name="is_active"
                                    defaultChecked={true}
                                    value="1"
                                />
                                <Label
                                    htmlFor="is_active"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Active
                                </Label>
                                <InputError message="" />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create Attribute'}
                                </Button>
                                <Link href="/admin/attributes">
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

