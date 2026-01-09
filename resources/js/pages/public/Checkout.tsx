import { Head, useForm, usePage, router } from '@inertiajs/react';
import PublicLayout from '@/layouts/public/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';
import cart from '@/routes/cart';
import publicProducts from '@/routes/public/products';
import ValidationErrors from '@/components/validation-errors';

interface ProductImage {
    id: number;
    image_path: string;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    price: string;
    images: ProductImage[];
}

interface ProductVariant {
    id: number;
    price: string;
    images?: ProductImage[];
    attributes?: Array<{
        id: number;
        name: string;
        pivot: {
            value: string;
        };
    }>;
}

interface CartItem {
    id: number;
    product_id: number;
    product_variant_id: number | null;
    quantity: number;
    product: Product;
    product_variant: ProductVariant | null;
}

interface Customer {
    id: number;
    name: string;
    email: string;
    phone?: string;
    default_billing_address?: any;
    default_shipping_address?: any;
}

interface CheckoutProps {
    cartItems: CartItem[];
    cartCount: number;
    subtotal: number;
    customer: Customer; // Always present since checkout requires authentication
}

export default function Checkout({ cartItems, cartCount, subtotal, customer }: CheckoutProps) {
    const [sameAsBilling, setSameAsBilling] = useState(true);
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

    const { data, setData, post, processing, errors } = useForm({
        email: customer.email || '',
        phone: customer.phone || '',
        billing_address: {
            first_name: customer.default_billing_address?.first_name || '',
            last_name: customer.default_billing_address?.last_name || '',
            address_line_1: customer.default_billing_address?.address_line_1 || '',
            address_line_2: customer.default_billing_address?.address_line_2 || '',
            city: customer.default_billing_address?.city || '',
            state: customer.default_billing_address?.state || '',
            postal_code: customer.default_billing_address?.postal_code || '',
            country: customer.default_billing_address?.country || 'United States',
        },
        shipping_address: {
            first_name: customer.default_shipping_address?.first_name || '',
            last_name: customer.default_shipping_address?.last_name || '',
            address_line_1: customer.default_shipping_address?.address_line_1 || '',
            address_line_2: customer.default_shipping_address?.address_line_2 || '',
            city: customer.default_shipping_address?.city || '',
            state: customer.default_shipping_address?.state || '',
            postal_code: customer.default_shipping_address?.postal_code || '',
            country: customer.default_shipping_address?.country || 'United States',
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Ensure shipping address matches billing if "same as billing" is checked
        const submitData = sameAsBilling 
            ? { ...data, shipping_address: { ...data.billing_address } }
            : data;
        
        router.post('/checkout', submitData, {
            onError: (errors) => {
                console.error('Checkout errors:', errors);
            },
            onSuccess: () => {
                // Success is handled by redirect
            },
        });
    };

    const handleSameAsBillingChange = (checked: boolean) => {
        setSameAsBilling(checked);
        if (checked) {
            setData('shipping_address', { ...data.billing_address });
        }
    };

    const tax = subtotal * 0.10;
    const shipping = 10.00;
    const total = subtotal + tax + shipping;

    const getItemImage = (item: CartItem): string | null => {
        if (item.product_variant && item.product_variant.images && item.product_variant.images.length > 0) {
            return `/storage/${item.product_variant.images[0].image_path}`;
        }
        if (item.product.images && item.product.images.length > 0) {
            return `/storage/${item.product.images[0].image_path}`;
        }
        return null;
    };

    const getItemPrice = (item: CartItem): string => {
        if (item.product_variant) {
            return item.product_variant.price;
        }
        return item.product.price;
    };

    const getItemName = (item: CartItem): string => {
        let name = item.product.name;
        if (item.product_variant && item.product_variant.attributes) {
            const variantDetails = item.product_variant.attributes
                .map(attr => `${attr.name}: ${attr.pivot.value}`)
                .join(', ');
            name += ` (${variantDetails})`;
        }
        return name;
    };

    if (cartItems.length === 0) {
        return (
            <PublicLayout title="Checkout">
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <Card className="border-2 border-dashed">
                        <CardContent className="py-16 text-center">
                            <div className="flex flex-col items-center justify-center">
                                <div className="rounded-full bg-muted p-6 mb-6">
                                    <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
                                <p className="text-muted-foreground mb-8 max-w-md">
                                    Add items to your cart before proceeding to checkout.
                                </p>
                                <Link href={publicProducts.index().url}>
                                    <Button size="lg" className="px-8">
                                        Continue Shopping
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout title="Checkout">
            <Head title="Checkout" />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <Link href={cart.index().url} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Cart
                    </Link>
                    <h1 className="text-4xl font-bold tracking-tight mb-2 text-gray-900">Checkout</h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Checkout Form */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Flash Messages */}
                            {flash?.error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                                    {flash.error}
                                </div>
                            )}
                            {flash?.success && (
                                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
                                    {flash.success}
                                </div>
                            )}
                            {/* Validation Errors */}
                            {Object.keys(errors).length > 0 && (
                                <ValidationErrors errors={errors} />
                            )}
                            {/* Contact Information */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">Contact Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="email" className="text-gray-900">Email Address *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                            placeholder="your.email@example.com"
                                            className={`text-gray-900 placeholder:text-gray-400 ${errors.email ? 'border-red-500' : ''}`}
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="phone" className="text-gray-900">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="(555) 123-4567"
                                            className={`text-gray-900 placeholder:text-gray-400 ${errors.phone ? 'border-red-500' : ''}`}
                                        />
                                        {errors.phone && (
                                            <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Billing Address */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">Billing Address</h2>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="billing_first_name" className="text-gray-900">First Name *</Label>
                                            <Input
                                                id="billing_first_name"
                                                value={data.billing_address.first_name}
                                                onChange={(e) => setData('billing_address', {
                                                    ...data.billing_address,
                                                    first_name: e.target.value
                                                })}
                                                required
                                                placeholder="John"
                                                className={`text-gray-900 placeholder:text-gray-400 ${errors['billing_address.first_name'] ? 'border-red-500' : ''}`}
                                            />
                                            {errors['billing_address.first_name'] && (
                                                <p className="text-sm text-red-500 mt-1">{errors['billing_address.first_name']}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="billing_last_name" className="text-gray-900">Last Name *</Label>
                                            <Input
                                                id="billing_last_name"
                                                value={data.billing_address.last_name}
                                                onChange={(e) => setData('billing_address', {
                                                    ...data.billing_address,
                                                    last_name: e.target.value
                                                })}
                                                required
                                                placeholder="Doe"
                                                className={`text-gray-900 placeholder:text-gray-400 ${errors['billing_address.last_name'] ? 'border-red-500' : ''}`}
                                            />
                                            {errors['billing_address.last_name'] && (
                                                <p className="text-sm text-red-500 mt-1">{errors['billing_address.last_name']}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="billing_address_line_1" className="text-gray-900">Address Line 1 *</Label>
                                        <Input
                                            id="billing_address_line_1"
                                            value={data.billing_address.address_line_1}
                                            onChange={(e) => setData('billing_address', {
                                                ...data.billing_address,
                                                address_line_1: e.target.value
                                            })}
                                            required
                                            placeholder="123 Main Street"
                                            className={`text-gray-900 placeholder:text-gray-400 ${errors['billing_address.address_line_1'] ? 'border-red-500' : ''}`}
                                        />
                                        {errors['billing_address.address_line_1'] && (
                                            <p className="text-sm text-red-500 mt-1">{errors['billing_address.address_line_1']}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="billing_address_line_2" className="text-gray-900">Address Line 2</Label>
                                        <Input
                                            id="billing_address_line_2"
                                            value={data.billing_address.address_line_2}
                                            onChange={(e) => setData('billing_address', {
                                                ...data.billing_address,
                                                address_line_2: e.target.value
                                            })}
                                            placeholder="Apt 4B (optional)"
                                            className="text-gray-900 placeholder:text-gray-400"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="billing_city" className="text-gray-900">City *</Label>
                                            <Input
                                                id="billing_city"
                                                value={data.billing_address.city}
                                                onChange={(e) => setData('billing_address', {
                                                    ...data.billing_address,
                                                    city: e.target.value
                                                })}
                                                required
                                                placeholder="New York"
                                                className={`text-gray-900 placeholder:text-gray-400 ${errors['billing_address.city'] ? 'border-red-500' : ''}`}
                                            />
                                            {errors['billing_address.city'] && (
                                                <p className="text-sm text-red-500 mt-1">{errors['billing_address.city']}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="billing_state" className="text-gray-900">State *</Label>
                                            <Input
                                                id="billing_state"
                                                value={data.billing_address.state}
                                                onChange={(e) => setData('billing_address', {
                                                    ...data.billing_address,
                                                    state: e.target.value
                                                })}
                                                required
                                                placeholder="NY"
                                                className={`text-gray-900 placeholder:text-gray-400 ${errors['billing_address.state'] ? 'border-red-500' : ''}`}
                                            />
                                            {errors['billing_address.state'] && (
                                                <p className="text-sm text-red-500 mt-1">{errors['billing_address.state']}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="billing_postal_code" className="text-gray-900">Postal Code *</Label>
                                            <Input
                                                id="billing_postal_code"
                                                value={data.billing_address.postal_code}
                                                onChange={(e) => setData('billing_address', {
                                                    ...data.billing_address,
                                                    postal_code: e.target.value
                                                })}
                                                required
                                                placeholder="10001"
                                                className={`text-gray-900 placeholder:text-gray-400 ${errors['billing_address.postal_code'] ? 'border-red-500' : ''}`}
                                            />
                                            {errors['billing_address.postal_code'] && (
                                                <p className="text-sm text-red-500 mt-1">{errors['billing_address.postal_code']}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="billing_country" className="text-gray-900">Country *</Label>
                                            <Input
                                                id="billing_country"
                                                value={data.billing_address.country}
                                                onChange={(e) => setData('billing_address', {
                                                    ...data.billing_address,
                                                    country: e.target.value
                                                })}
                                                required
                                                placeholder="United States"
                                                className={`text-gray-900 placeholder:text-gray-400 ${errors['billing_address.country'] ? 'border-red-500' : ''}`}
                                            />
                                            {errors['billing_address.country'] && (
                                                <p className="text-sm text-red-500 mt-1">{errors['billing_address.country']}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">Shipping Address</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="same_as_billing"
                                            checked={sameAsBilling}
                                            onCheckedChange={handleSameAsBillingChange}
                                        />
                                        <Label htmlFor="same_as_billing" className="font-normal cursor-pointer text-gray-900">
                                            Same as billing address
                                        </Label>
                                    </div>

                                    {!sameAsBilling && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="shipping_first_name" className="text-gray-900">First Name *</Label>
                                                    <Input
                                                        id="shipping_first_name"
                                                        value={data.shipping_address.first_name}
                                                        onChange={(e) => setData('shipping_address', {
                                                            ...data.shipping_address,
                                                            first_name: e.target.value
                                                        })}
                                                        required
                                                        placeholder="John"
                                                        className={`text-gray-900 placeholder:text-gray-400 ${errors['shipping_address.first_name'] ? 'border-red-500' : ''}`}
                                                    />
                                                    {errors['shipping_address.first_name'] && (
                                                        <p className="text-sm text-red-500 mt-1">{errors['shipping_address.first_name']}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Label htmlFor="shipping_last_name" className="text-gray-900">Last Name *</Label>
                                                    <Input
                                                        id="shipping_last_name"
                                                        value={data.shipping_address.last_name}
                                                        onChange={(e) => setData('shipping_address', {
                                                            ...data.shipping_address,
                                                            last_name: e.target.value
                                                        })}
                                                        required
                                                        placeholder="Doe"
                                                        className={`text-gray-900 placeholder:text-gray-400 ${errors['shipping_address.last_name'] ? 'border-red-500' : ''}`}
                                                    />
                                                    {errors['shipping_address.last_name'] && (
                                                        <p className="text-sm text-red-500 mt-1">{errors['shipping_address.last_name']}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="shipping_address_line_1" className="text-gray-900">Address Line 1 *</Label>
                                                <Input
                                                    id="shipping_address_line_1"
                                                    value={data.shipping_address.address_line_1}
                                                    onChange={(e) => setData('shipping_address', {
                                                        ...data.shipping_address,
                                                        address_line_1: e.target.value
                                                    })}
                                                    required
                                                    placeholder="123 Main Street"
                                                    className={`text-gray-900 placeholder:text-gray-400 ${errors['shipping_address.address_line_1'] ? 'border-red-500' : ''}`}
                                                />
                                                {errors['shipping_address.address_line_1'] && (
                                                    <p className="text-sm text-red-500 mt-1">{errors['shipping_address.address_line_1']}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label htmlFor="shipping_address_line_2" className="text-gray-900">Address Line 2</Label>
                                                <Input
                                                    id="shipping_address_line_2"
                                                    value={data.shipping_address.address_line_2}
                                                    onChange={(e) => setData('shipping_address', {
                                                        ...data.shipping_address,
                                                        address_line_2: e.target.value
                                                    })}
                                                    placeholder="Apt 4B (optional)"
                                                    className="text-gray-900 placeholder:text-gray-400"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="shipping_city" className="text-gray-900">City *</Label>
                                                    <Input
                                                        id="shipping_city"
                                                        value={data.shipping_address.city}
                                                        onChange={(e) => setData('shipping_address', {
                                                            ...data.shipping_address,
                                                            city: e.target.value
                                                        })}
                                                        required
                                                        placeholder="New York"
                                                        className={`text-gray-900 placeholder:text-gray-400 ${errors['shipping_address.city'] ? 'border-red-500' : ''}`}
                                                    />
                                                    {errors['shipping_address.city'] && (
                                                        <p className="text-sm text-red-500 mt-1">{errors['shipping_address.city']}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Label htmlFor="shipping_state" className="text-gray-900">State *</Label>
                                                    <Input
                                                        id="shipping_state"
                                                        value={data.shipping_address.state}
                                                        onChange={(e) => setData('shipping_address', {
                                                            ...data.shipping_address,
                                                            state: e.target.value
                                                        })}
                                                        required
                                                        placeholder="NY"
                                                        className={`text-gray-900 placeholder:text-gray-400 ${errors['shipping_address.state'] ? 'border-red-500' : ''}`}
                                                    />
                                                    {errors['shipping_address.state'] && (
                                                        <p className="text-sm text-red-500 mt-1">{errors['shipping_address.state']}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="shipping_postal_code" className="text-gray-900">Postal Code *</Label>
                                                    <Input
                                                        id="shipping_postal_code"
                                                        value={data.shipping_address.postal_code}
                                                        onChange={(e) => setData('shipping_address', {
                                                            ...data.shipping_address,
                                                            postal_code: e.target.value
                                                        })}
                                                        required
                                                        placeholder="10001"
                                                        className={`text-gray-900 placeholder:text-gray-400 ${errors['shipping_address.postal_code'] ? 'border-red-500' : ''}`}
                                                    />
                                                    {errors['shipping_address.postal_code'] && (
                                                        <p className="text-sm text-red-500 mt-1">{errors['shipping_address.postal_code']}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Label htmlFor="shipping_country" className="text-gray-900">Country *</Label>
                                                    <Input
                                                        id="shipping_country"
                                                        value={data.shipping_address.country}
                                                        onChange={(e) => setData('shipping_address', {
                                                            ...data.shipping_address,
                                                            country: e.target.value
                                                        })}
                                                        required
                                                        placeholder="United States"
                                                        className={`text-gray-900 placeholder:text-gray-400 ${errors['shipping_address.country'] ? 'border-red-500' : ''}`}
                                                    />
                                                    {errors['shipping_address.country'] && (
                                                        <p className="text-sm text-red-500 mt-1">{errors['shipping_address.country']}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-8">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">Order Summary</h2>
                                <div className="space-y-4 mb-6">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                                {getItemImage(item) ? (
                                                    <img
                                                        src={getItemImage(item)!}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                                    {getItemName(item)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Qty: {item.quantity}
                                                </p>
                                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                                    ${(Number(getItemPrice(item)) * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-gray-200 pt-4 space-y-4">
                                    <div className="flex justify-between text-base">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-base">
                                        <span className="text-gray-600">Tax</span>
                                        <span className="font-semibold text-gray-900">${tax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-base">
                                        <span className="text-gray-600">Shipping</span>
                                        <span className="font-semibold text-gray-900">${shipping.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-4 mt-4">
                                        <div className="flex justify-between text-xl">
                                            <span className="font-bold text-gray-900">Total</span>
                                            <span className="font-bold text-gray-900">${total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full mt-6 bg-[#b67778] hover:bg-[#a06667] text-white border-0"
                                    size="lg"
                                    disabled={processing}
                                >
                                    {processing ? 'Processing...' : 'Place Order'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </PublicLayout>
    );
}
