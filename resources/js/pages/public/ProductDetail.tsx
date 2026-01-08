import { Head, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import cart from '@/routes/cart';
import { router } from '@inertiajs/react';
import { getCsrfToken } from '@/lib/utils';
import { login } from '@/routes/customer';
import { type SharedData } from '@/types';

interface Category {
    id: number;
    name: string;
}

interface Attribute {
    id: number;
    name: string;
    pivot: {
        value: string;
    };
}

interface ProductVariant {
    id: number;
    sku: string | null;
    price: string;
    stock: number | null;
    is_active: boolean;
    attributes: Attribute[];
    images: ProductImage[];
}

interface ProductImage {
    id: number;
    image_path: string;
    order: number;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: string;
    is_variable: boolean;
    categories: Category[];
    variants: ProductVariant[];
    images: ProductImage[];
}

interface ProductDetailProps {
    product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
    const { auth } = usePage<SharedData>().props;
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
        product.is_variable && product.variants.length > 0 ? product.variants[0] : null
    );
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);

    const getProductPrice = (): string => {
        if (product.is_variable && selectedVariant) {
            return selectedVariant.price;
        }
        return product.price;
    };

    const getProductImages = (): ProductImage[] => {
        if (product.is_variable && selectedVariant && selectedVariant.images.length > 0) {
            return selectedVariant.images;
        }
        return product.images;
    };

    const getPrimaryImage = (): string | null => {
        const images = getProductImages();
        if (images.length === 0) return null;
        return `/storage/${images[0].image_path}`;
    };

    const handleAddToCart = async () => {
        // Check if customer is authenticated
        if (!auth.customer) {
            // Redirect to login with intended URL
            router.visit(login().url + `?intended=${encodeURIComponent(window.location.href)}`);
            return;
        }

        console.log('Add to cart clicked', { productId: product.id, variantId: selectedVariant?.id, quantity });
        setLoading(true);
        try {
            const csrfToken = getCsrfToken();
            if (!csrfToken) {
                throw new Error('CSRF token not found');
            }

            const response = await fetch(cart.store().url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    product_id: product.id,
                    product_variant_id: product.is_variable && selectedVariant ? selectedVariant.id : null,
                    quantity: quantity,
                }),
            });
            
            const contentType = response.headers.get('content-type');
            const isJson = contentType && contentType.includes('application/json');
            
            if (!response.ok) {
                let errorMessage = 'Failed to add to cart';
                if (isJson) {
                    try {
                        const error = await response.json();
                        errorMessage = error.message || errorMessage;
                    } catch (e) {
                        console.error('Failed to parse error response:', e);
                    }
                } else {
                    const text = await response.text();
                    console.error('Non-JSON error response:', text);
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            
            let data = null;
            if (isJson) {
                data = await response.json();
                console.log('Item added to cart:', data);
                
                // Update cart count immediately from response
                if (data.cartCount !== undefined) {
                    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cartCount: data.cartCount } }));
                } else {
                    window.dispatchEvent(new Event('cartUpdated'));
                }
            } else {
                window.dispatchEvent(new Event('cartUpdated'));
            }
            
            // Navigate to cart page
            router.visit(cart.index().url);
        } catch (error: any) {
            console.error('Failed to add to cart:', error);
            alert(error.message || 'Failed to add item to cart');
        } finally {
            setLoading(false);
        }
    };

    const incrementQuantity = () => {
        const maxStock = product.is_variable && selectedVariant && selectedVariant.stock !== null
            ? selectedVariant.stock
            : null;
        if (maxStock === null || quantity < maxStock) {
            setQuantity(quantity + 1);
        }
    };

    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const isOutOfStock = (): boolean => {
        if (product.is_variable && selectedVariant) {
            return selectedVariant.stock !== null && selectedVariant.stock === 0;
        }
        return false;
    };

    return (
        <PublicLayout title={product.name}>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Product Images */}
                    <div>
                        <Card className="overflow-hidden border border-gray-200">
                            <div className="aspect-square bg-gray-50 relative">
                                {getPrimaryImage() ? (
                                    <img
                                        src={getPrimaryImage()!}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                        No Image Available
                                    </div>
                                )}
                            </div>
                        </Card>
                        {getProductImages().length > 1 && (
                            <div className="grid grid-cols-4 gap-2 mt-4">
                                {getProductImages().slice(0, 4).map((image) => (
                                    <div
                                        key={image.id}
                                        className="aspect-square bg-gray-50 rounded-lg overflow-hidden cursor-pointer border border-gray-200 hover:border-gray-300 hover:opacity-75 transition-all"
                                    >
                                        <img
                                            src={`/storage/${image.image_path}`}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight mb-4 text-gray-900">{product.name}</h1>

                            {product.categories.length > 0 && (
                                <div className="flex gap-2 mb-6">
                                    {product.categories.map((cat) => (
                                        <Badge key={cat.id} variant="secondary">
                                            {cat.name}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <div className="text-4xl font-bold mb-6 text-gray-900">
                                ${Number(getProductPrice()).toFixed(2)}
                            </div>
                        </div>

                        {product.description && (
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold mb-3 text-gray-900">Description</h2>
                                <p className="text-base text-gray-700 leading-relaxed">{product.description}</p>
                            </div>
                        )}

                        {/* Variant Selection */}
                        {product.is_variable && product.variants.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-3 text-gray-900">Select Variant</h3>
                                <div className="space-y-3">
                                    {product.variants
                                        .filter(v => v.is_active)
                                        .map((variant) => (
                                            <button
                                                key={variant.id}
                                                onClick={() => {
                                                    setSelectedVariant(variant);
                                                    setQuantity(1);
                                                }}
                                                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                                                    selectedVariant?.id === variant.id
                                                        ? 'border-gray-900 bg-gray-50'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex-1">
                                                        <div className="text-base text-gray-900 mb-1">
                                                            {variant.attributes.map((attr, idx) => (
                                                                <span key={attr.id}>
                                                                    {attr.name}: <span className="font-medium">{attr.pivot.value}</span>
                                                                    {idx < variant.attributes.length - 1 && ', '}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <span className="text-lg font-bold text-gray-900">
                                                            ${Number(variant.price).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    {variant.stock !== null && (
                                                        <span className={`text-sm font-medium ml-4 ${
                                                            variant.stock > 0 
                                                                ? 'text-gray-600' 
                                                                : 'text-red-600'
                                                        }`}>
                                                            {variant.stock > 0
                                                                ? `${variant.stock} in stock`
                                                                : 'Out of stock'}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity Selector */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3 text-gray-900">Quantity</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 border border-gray-300 rounded-md bg-white">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-r-none bg-black hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={decrementQuantity}
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-12 text-center font-semibold text-base text-gray-900">{quantity}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-l-none bg-black hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={incrementQuantity}
                                        disabled={
                                            product.is_variable && selectedVariant && selectedVariant.stock !== null
                                                ? quantity >= selectedVariant.stock
                                                : false
                                        }
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <Button
                            className="w-full mb-4 bg-gray-900 hover:bg-gray-800 text-white border-0"
                            size="lg"
                            onClick={handleAddToCart}
                            disabled={loading || isOutOfStock()}
                        >
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            {loading ? 'Adding...' : isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
                        </Button>

                        {/* Additional Info */}
                        <div className="pt-6 border-t border-gray-200">
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">SKU:</span>
                                    <span className="font-medium text-gray-900">
                                        {product.is_variable && selectedVariant
                                            ? selectedVariant.sku || 'N/A'
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

