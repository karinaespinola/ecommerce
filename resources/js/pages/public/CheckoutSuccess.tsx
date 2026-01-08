import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/public/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { home } from '@/routes';
import publicProducts from '@/routes/public/products';

interface ProductImage {
    id: number;
    image_path: string;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    images?: ProductImage[];
}

interface ProductVariant {
    id: number;
    images?: ProductImage[];
}

interface OrderItem {
    id: number;
    product_id: number;
    product_variant_id: number | null;
    product_name: string;
    variant_name: string | null;
    quantity: number;
    price: string;
    subtotal: string;
    product?: Product;
    product_variant?: ProductVariant | null;
}

interface Order {
    id: number;
    order_number: string;
    status: string;
    subtotal: string;
    tax: string;
    shipping: string;
    total: string;
    items: OrderItem[];
}

interface CheckoutSuccessProps {
    order: Order;
}

export default function CheckoutSuccess({ order }: CheckoutSuccessProps) {
    const getItemImage = (item: OrderItem): string | null => {
        // For variable products, check if variant has images first
        if (item.product_variant && item.product_variant.images && item.product_variant.images.length > 0) {
            return `/storage/${item.product_variant.images[0].image_path}`;
        }
        // Fallback to product images
        if (item.product && item.product.images && item.product.images.length > 0) {
            return `/storage/${item.product.images[0].image_path}`;
        }
        return null;
    };

    const getItemName = (item: OrderItem): string => {
        let name = item.product_name;
        if (item.variant_name) {
            name += ` (${item.variant_name})`;
        }
        return name;
    };

    return (
        <PublicLayout title="Order Confirmation">
            <Head title="Order Confirmation" />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2 text-gray-900">Order Confirmed!</h1>
                    <p className="text-muted-foreground">
                        Thank you for your purchase. Your order has been received.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Order Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Success Message Card */}
                        <Card className="border-2 border-green-200 bg-green-50/50">
                            <CardContent className="py-8">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="rounded-full bg-green-100 p-4 mb-4">
                                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2 text-gray-900">Order Confirmed!</h2>
                                    <p className="text-lg text-gray-600 mb-4">
                                        Your order <span className="font-semibold text-gray-900">{order.order_number}</span> has been successfully placed.
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        You will receive an email confirmation shortly.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Items List */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h2 className="text-2xl font-bold mb-6 text-gray-900">Order Items</h2>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                                    >
                                        {item.product && (
                                            <Link
                                                href={publicProducts.show({ slug: item.product.slug }).url}
                                                className="flex-shrink-0 group"
                                            >
                                                <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 group-hover:border-primary/50 transition-colors">
                                                    {getItemImage(item) ? (
                                                        <img
                                                            src={getItemImage(item)!}
                                                            alt={item.product_name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-4 mb-2">
                                                <div className="flex-1 min-w-0">
                                                    {item.product ? (
                                                        <Link href={publicProducts.show({ slug: item.product.slug }).url}>
                                                            <h3 className="font-semibold text-lg hover:text-primary text-gray-900 transition-colors mb-1 line-clamp-2">
                                                                {getItemName(item)}
                                                            </h3>
                                                        </Link>
                                                    ) : (
                                                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                                                            {getItemName(item)}
                                                        </h3>
                                                    )}
                                                    <p className="text-sm text-gray-500">
                                                        Quantity: {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-gray-900">
                                                        ${Number(item.subtotal).toFixed(2)}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        ${Number(item.price).toFixed(2)} × {item.quantity}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-8">
                            <h2 className="text-2xl font-bold mb-6 text-gray-900">Order Summary</h2>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-base">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold text-gray-900">${Number(order.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-base">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="font-semibold text-gray-900">${Number(order.tax).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-base">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="font-semibold text-gray-900">${Number(order.shipping).toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-4 mt-4">
                                    <div className="flex justify-between text-xl">
                                        <span className="font-bold text-gray-900">Total</span>
                                        <span className="font-bold text-gray-900">${Number(order.total).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Link href={publicProducts.index().url} className="block">
                                    <Button className="w-full bg-[#b67778] hover:bg-[#a06667] text-white border-0" size="lg">
                                        Continue Shopping
                                    </Button>
                                </Link>
                                <Link href={home().url} className="block">
                                    <Button variant="outline" className="w-full" size="lg">
                                        Back to Home
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
