import { Head, router } from '@inertiajs/react';
import PublicLayout from '@/layouts/public/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import cart from '@/routes/cart';
import publicProducts from '@/routes/public/products';
import { Link } from '@inertiajs/react';
import { getCsrfToken } from '@/lib/utils';

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

interface CartProps {
    cartItems: CartItem[];
    cartCount: number;
}

export default function Cart({ cartItems: initialCartItems, cartCount: initialCartCount }: CartProps) {
    const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);
    const [loading, setLoading] = useState<Record<number, boolean>>({});
    const [updating, setUpdating] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const handleCartUpdate = () => {
            router.reload({ only: ['cartItems', 'cartCount'] });
        };
        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => window.removeEventListener('cartUpdated', handleCartUpdate);
    }, []);

    const updateQuantity = async (cartId: number, newQuantity: number) => {
        if (newQuantity < 1) {
            removeItem(cartId);
            return;
        }

        setUpdating({ ...updating, [cartId]: true });
        try {
            const csrfToken = getCsrfToken();
            if (!csrfToken) {
                throw new Error('CSRF token not found');
            }

            const response = await fetch(cart.update({ id: cartId }).url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    quantity: newQuantity,
                }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update cart');
            }
            
            setCartItems(cartItems.map(item =>
                item.id === cartId ? { ...item, quantity: newQuantity } : item
            ));
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error: any) {
            console.error('Failed to update cart:', error);
            alert(error.message || 'Failed to update cart item');
        } finally {
            setUpdating({ ...updating, [cartId]: false });
        }
    };

    const removeItem = async (cartId: number) => {
        setLoading({ ...loading, [cartId]: true });
        try {
            const csrfToken = getCsrfToken();
            if (!csrfToken) {
                throw new Error('CSRF token not found');
            }

            const response = await fetch(cart.destroy({ id: cartId }).url, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to remove item');
            }
            
            setCartItems(cartItems.filter(item => item.id !== cartId));
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error: any) {
            console.error('Failed to remove item:', error);
            alert(error.message || 'Failed to remove item from cart');
        } finally {
            setLoading({ ...loading, [cartId]: false });
        }
    };

    const clearCart = async () => {
        if (!confirm('Are you sure you want to clear your cart?')) return;

        try {
            const csrfToken = getCsrfToken();
            if (!csrfToken) {
                throw new Error('CSRF token not found');
            }

            const response = await fetch(cart.clear().url, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
            });
            
            if (!response.ok) {
                throw new Error('Failed to clear cart');
            }
            
            setCartItems([]);
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error: any) {
            console.error('Failed to clear cart:', error);
            alert(error.message || 'Failed to clear cart');
        }
    };

    const getItemImage = (item: CartItem): string | null => {
        if (item.product_variant && item.product_variant.attributes) {
            // For variants, we'd need variant images - for now use product image
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

    const calculateSubtotal = (): number => {
        return cartItems.reduce((sum, item) => {
            const price = Number(getItemPrice(item));
            return sum + price * item.quantity;
        }, 0);
    };

    const subtotal = calculateSubtotal();

    return (
        <PublicLayout title="Shopping Cart">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

                {cartItems.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                            <p className="text-lg text-gray-600 mb-4">Your cart is empty</p>
                            <Link href={publicProducts.index().url}>
                                <Button>Continue Shopping</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map((item) => (
                                <Card key={item.id}>
                                    <CardContent className="p-4">
                                        <div className="flex gap-4">
                                            <Link
                                                href={publicProducts.show({ slug: item.product.slug }).url}
                                                className="flex-shrink-0"
                                            >
                                                <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden">
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
                                            </Link>

                                            <div className="flex-1">
                                                <Link href={publicProducts.show({ slug: item.product.slug }).url}>
                                                    <h3 className="font-semibold text-lg hover:text-gray-600 mb-2">
                                                        {getItemName(item)}
                                                    </h3>
                                                </Link>
                                                <p className="text-xl font-bold text-gray-900 mb-4">
                                                    ${Number(getItemPrice(item)).toFixed(2)}
                                                </p>

                                                <div className="flex items-center gap-4">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            disabled={updating[item.id] || item.quantity <= 1}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-12 text-center font-semibold">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            disabled={updating[item.id]}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    {/* Remove Button */}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeItem(item.id)}
                                                        disabled={loading[item.id]}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>

                                                    {/* Item Subtotal */}
                                                    <div className="ml-auto text-lg font-semibold">
                                                        ${(Number(getItemPrice(item)) * item.quantity).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            <Button
                                variant="outline"
                                onClick={clearCart}
                                className="w-full"
                            >
                                Clear Cart
                            </Button>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-semibold">${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Shipping</span>
                                            <span className="font-semibold">Calculated at checkout</span>
                                        </div>
                                        <div className="border-t pt-3">
                                            <div className="flex justify-between text-lg">
                                                <span className="font-semibold">Total</span>
                                                <span className="font-bold">${subtotal.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button className="w-full mb-4" size="lg">
                                        Proceed to Checkout
                                    </Button>
                                    <Link href={publicProducts.index().url}>
                                        <Button variant="outline" className="w-full">
                                            Continue Shopping
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}

