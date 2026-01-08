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

interface CartProps {
    cartItems: CartItem[];
    cartCount: number;
}

export default function Cart({ cartItems: initialCartItems, cartCount: initialCartCount }: CartProps) {
    const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);
    const [loading, setLoading] = useState<Record<number, boolean>>({});
    const [updating, setUpdating] = useState<Record<number, boolean>>({});

    useEffect(() => {
        setCartItems(initialCartItems);
    }, [initialCartItems]);

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
        // For variable products, check if variant has images first
        if (item.product_variant && item.product_variant.images && item.product_variant.images.length > 0) {
            return `/storage/${item.product_variant.images[0].image_path}`;
        }
        // Fallback to product images
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
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2 text-gray-900">Shopping Cart</h1>
                    <p className="text-muted-foreground">
                        {cartItems.length === 0 
                            ? "Your cart is empty" 
                            : `${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'} in your cart`}
                    </p>
                </div>

                {cartItems.length === 0 ? (
                    <Card className="border-2 border-dashed">
                        <CardContent className="py-16 text-center">
                            <div className="flex flex-col items-center justify-center">
                                <div className="rounded-full bg-muted p-6 mb-6">
                                    <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
                                <p className="text-muted-foreground mb-8 max-w-md">
                                    Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
                                </p>
                                <Link href={publicProducts.index().url}>
                                    <Button size="lg" className="px-8">
                                        Continue Shopping
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all"
                                >
                                    <div className="flex gap-6">
                                        <Link
                                            href={publicProducts.show({ slug: item.product.slug }).url}
                                            className="flex-shrink-0 group"
                                        >
                                            <div className="w-32 h-32 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 group-hover:border-primary/50 transition-colors">
                                                {getItemImage(item) ? (
                                                    <img
                                                        src={getItemImage(item)!}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                        </Link>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-4 mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <Link href={publicProducts.show({ slug: item.product.slug }).url}>
                                                        <h3 className="font-semibold text-lg hover:text-primary  text-gray-900 transition-colors mb-1 line-clamp-2">
                                                            {getItemName(item)}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-lg font-bold text-gray-900">
                                                        ${Number(getItemPrice(item)).toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-gray-900">
                                                        ${(Number(getItemPrice(item)) * item.quantity).toFixed(2)}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        ${Number(getItemPrice(item)).toFixed(2)} × {item.quantity}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200">
                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-gray-600 mr-2">Quantity:</span>
                                                    <div className="flex items-center gap-2 border border-gray-300 rounded-md bg-white">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-r-none hover:bg-gray-100"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            disabled={updating[item.id] || item.quantity <= 1}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-12 text-center font-semibold text-base text-gray-900">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-l-none hover:bg-gray-100"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            disabled={updating[item.id]}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Remove Button */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeItem(item.id)}
                                                    disabled={loading[item.id]}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="pt-4">
                                <Button
                                    onClick={clearCart}
                                    className="w-full bg-black hover:bg-gray-800 text-white border-0"
                                    size="lg"
                                >
                                    Clear Cart
                                </Button>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-8">
                                <h2 className="text-2xl font-bold mb-6 text-gray-900">Order Summary</h2>
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-base">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-base">
                                        <span className="text-gray-600">Shipping</span>
                                        <span className="font-semibold text-sm text-gray-500">Calculated at checkout</span>
                                    </div>
                                    <div className="flex justify-between text-base">
                                        <span className="text-gray-600">Tax</span>
                                        <span className="font-semibold text-sm text-gray-500">Calculated at checkout</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-4 mt-4">
                                        <div className="flex justify-between text-xl">
                                            <span className="font-bold text-gray-900">Total</span>
                                            <span className="font-bold text-gray-900">${subtotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Link href="/checkout" className="block">
                                        <Button className="w-full bg-[#b67778] hover:bg-[#a06667] text-white border-0" size="lg">
                                            Proceed to Checkout
                                        </Button>
                                    </Link>
                                    <Link href={publicProducts.index().url} className="block">
                                        <Button variant="outline" className="w-full" size="lg">
                                            Continue Shopping
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}

