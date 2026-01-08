import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes/admin';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface Order {
    id: number;
    order_number: string;
    status: string;
    total: string;
    email: string;
    created_at: string;
    customer: {
        id: number;
        name: string;
    } | null;
}

interface LowStockProduct {
    id: number;
    name: string;
    stock: number;
    sku: string | null;
    is_variable: boolean;
}

interface LowStockVariant {
    id: number;
    product_id: number;
    product_name: string;
    stock: number;
    sku: string | null;
    is_variable: boolean;
}

interface DashboardProps {
    latestOrders: Order[];
    lowStockProducts: LowStockProduct[];
    lowStockVariants: LowStockVariant[];
    lowStockThreshold: number;
}

export default function Dashboard({ 
    latestOrders, 
    lowStockProducts, 
    lowStockVariants, 
    lowStockThreshold 
}: DashboardProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Overview of your e-commerce platform
                    </p>
                </div>

                {(lowStockProducts.length > 0 || lowStockVariants.length > 0) && (
                    <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                <CardTitle className="text-yellow-900 dark:text-yellow-100">
                                    Low Stock Warning
                                </CardTitle>
                            </div>
                            <CardDescription className="text-yellow-800 dark:text-yellow-200">
                                {lowStockProducts.length + lowStockVariants.length} product{lowStockProducts.length + lowStockVariants.length !== 1 ? 's' : ''} with stock at or below {lowStockThreshold}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {lowStockProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center justify-between rounded-lg border border-yellow-200 bg-white p-3 dark:border-yellow-800 dark:bg-neutral-900"
                                    >
                                        <div>
                                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {product.name}
                                            </div>
                                            {product.sku && (
                                                <div className="text-sm text-muted-foreground">
                                                    SKU: {product.sku}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                                                {product.stock} in stock
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {lowStockVariants.map((variant) => (
                                    <div
                                        key={`variant-${variant.id}`}
                                        className="flex items-center justify-between rounded-lg border border-yellow-200 bg-white p-3 dark:border-yellow-800 dark:bg-neutral-900"
                                    >
                                        <div>
                                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {variant.product_name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Variant {variant.sku ? `(SKU: ${variant.sku})` : `#${variant.id}`}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                                                {variant.stock} in stock
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Latest Orders</CardTitle>
                        <CardDescription>
                            {latestOrders.length} most recent order{latestOrders.length !== 1 ? 's' : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {latestOrders.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                No orders yet. Orders will appear here once customers start placing them.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="px-4 py-3 text-left text-sm font-medium">
                                                Order Number
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">
                                                Customer
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">
                                                Email
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">
                                                Total
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {latestOrders.map((order) => (
                                            <tr
                                                key={order.id}
                                                className="border-b transition-colors hover:bg-muted/50"
                                            >
                                                <td className="px-4 py-3 font-medium">
                                                    {order.order_number}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {order.customer?.name || 'Guest'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {order.email}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}
                                                    >
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    ${parseFloat(order.total).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {formatDate(order.created_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
