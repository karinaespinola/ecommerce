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
import { dashboard } from '@/routes';

interface ProductVariant {
    id: number;
    sku: string;
    pivot: {
        value: string;
    };
}

interface Attribute {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    product_variants?: ProductVariant[];
}

interface AttributesShowProps {
    attribute: Attribute;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Attributes',
        href: '/attributes',
    },
    {
        title: 'View',
    },
];

export default function AttributesShow({ attribute }: AttributesShowProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Attribute: ${attribute.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/attributes">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-semibold">{attribute.name}</h1>
                            <p className="text-muted-foreground">
                                Attribute details and product variants
                            </p>
                        </div>
                    </div>
                    <Link href={`/attributes/${attribute.id}/edit`}>
                        <Button>
                            <Edit className="size-4" />
                            Edit Attribute
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Attribute Information</CardTitle>
                            <CardDescription>
                                Basic details about this attribute
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Name
                                </div>
                                <div className="mt-1 text-base">{attribute.name}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Slug
                                </div>
                                <div className="mt-1 text-base font-mono text-sm">
                                    {attribute.slug}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Status
                                </div>
                                <div className="mt-1">
                                    <Badge
                                        variant={
                                            attribute.is_active ? 'default' : 'secondary'
                                        }
                                    >
                                        {attribute.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    Created
                                </div>
                                <div className="mt-1 text-sm">
                                    {new Date(attribute.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {attribute.product_variants &&
                        attribute.product_variants.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="size-4" />
                                        Product Variants
                                    </CardTitle>
                                    <CardDescription>
                                        Product variants using this attribute
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {attribute.product_variants.map((variant) => (
                                            <div
                                                key={variant.id}
                                                className="rounded-md border p-3"
                                            >
                                                <div className="font-medium">
                                                    Variant #{variant.id}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    SKU: {variant.sku || 'N/A'}
                                                </div>
                                                <div className="mt-1 text-sm">
                                                    Value:{' '}
                                                    <Badge variant="outline">
                                                        {variant.pivot.value}
                                                    </Badge>
                                                </div>
                                            </div>
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

