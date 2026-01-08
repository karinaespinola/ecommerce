import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
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
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes/admin';

interface AdminConfigIndexProps {
    configs: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Settings',
    },
];

export default function AdminConfigIndex({ configs }: AdminConfigIndexProps) {
    const [processing, setProcessing] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>(configs);
    const { flash, errors } = usePage().props;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);

        router.put('/admin/config', { configs: formData }, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const handleChange = (key: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const configLabels: Record<string, string> = {
        site_name: 'Site Name',
        site_email: 'Site Email',
        currency: 'Currency',
        tax_rate: 'Tax Rate (%)',
        lowstock_threshold: 'Low Stock Threshold',
        lowstock_notification_email: 'Low Stock Notification Email',
    };

    const configDescriptions: Record<string, string> = {
        site_name: 'The name of your e-commerce store',
        site_email: 'The primary email address for your store',
        currency: 'The default currency code (e.g., USD, EUR)',
        tax_rate: 'The default tax rate as a percentage',
        lowstock_threshold: 'The minimum stock level before low stock alerts',
        lowstock_notification_email: 'Email address to receive low stock notifications',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Settings" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your store configuration
                    </p>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
                        {flash.success}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Store Configuration</CardTitle>
                        <CardDescription>
                            Update your store settings and preferences
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {Object.entries(formData).map(([key, value]) => (
                                <div key={key} className="space-y-2">
                                    <Label htmlFor={key}>
                                        {configLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Label>
                                    <Input
                                        id={key}
                                        name={`configs[${key}]`}
                                        value={value || ''}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        placeholder={`Enter ${configLabels[key] || key}`}
                                    />
                                    {configDescriptions[key] && (
                                        <p className="text-xs text-muted-foreground">
                                            {configDescriptions[key]}
                                        </p>
                                    )}
                                    <InputError message={errors?.[`configs.${key}`] as string} />
                                </div>
                            ))}

                            <div className="flex items-center gap-4 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
