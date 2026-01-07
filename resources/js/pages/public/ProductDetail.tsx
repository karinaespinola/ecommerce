import { Head } from '@inertiajs/react';
import PublicLayout from '@/layouts/public/public-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import cart from '@/routes/cart';
import { router } from '@inertiajs/react';

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
    is_primary: boolean;
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
        const primaryImage = images.find(img => img.is_primary) || images[0];
        return `/storage/${primaryImage.image_path}`;
    };

    const handleAddToCart = async () => {
        setLoading(true);
        try {
            const response = await fetch(cart.store().url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    product_id: product.id,
                    product_variant_id: product.is_variable && selectedVariant ? selectedVariant.id : null,
                    quantity: quantity,
                }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add to cart');
            }
            
            window.dispatchEvent(new Event('cartUpdated'));
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
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Product Images */}
                    <div>
                        <Card className="overflow-hidden">
                            <div className="aspect-square bg-gray-100 relative">
                                {getPrimaryImage() ? (
                                    <img
                                        src={getPrimaryImage()!}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
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
                                        className="aspect-square bg-gray-100 rounded overflow-hidden cursor-pointer hover:opacity-75"
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
                    <div>
                        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

                        {product.categories.length > 0 && (
                            <div className="flex gap-2 mb-4">
                                {product.categories.map((cat) => (
                                    <Badge key={cat.id} variant="secondary">
                                        {cat.name}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <div className="text-4xl font-bold mb-6">
                            ${Number(getProductPrice()).toFixed(2)}
                        </div>

                        {product.description && (
                            <div className="mb-6">
                                <h2 className="font-semibold mb-2">Description</h2>
                                <p className="text-gray-600">{product.description}</p>
                            </div>
                        )}

                        {/* Variant Selection */}
                        {product.is_variable && product.variants.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-semibold mb-3">Select Variant</h3>
                                <div className="space-y-2">
                                    {product.variants
                                        .filter(v => v.is_active)
                                        .map((variant) => (
                                            <button
                                                key={variant.id}
                                                onClick={() => {
                                                    setSelectedVariant(variant);
                                                    setQuantity(1);
                                                }}
                                                className={`w-full p-3 border-2 rounded-lg text-left transition-colors ${
                                                    selectedVariant?.id === variant.id
                                                        ? 'border-gray-900 bg-gray-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        {variant.attributes.map((attr, idx) => (
                                                            <span key={attr.id}>
                                                                {attr.name}: {attr.pivot.value}
                                                                {idx < variant.attributes.length - 1 && ', '}
                                                            </span>
                                                        ))}
                                                        <span className="ml-2 font-semibold">
                                                            ${Number(variant.price).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    {variant.stock !== null && (
                                                        <span className="text-sm text-gray-500">
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
                            <h3 className="font-semibold mb-3">Quantity</h3>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={decrementQuantity}
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
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

                        {/* Add to Cart Button */}
                        <Button
                            className="w-full mb-4"
                            size="lg"
                            onClick={handleAddToCart}
                            disabled={loading || isOutOfStock()}
                        >
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            {loading ? 'Adding...' : isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
                        </Button>

                        {/* Additional Info */}
                        <div className="mt-6 space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <span>SKU:</span>
                                <span className="font-medium">
                                    {product.is_variable && selectedVariant
                                        ? selectedVariant.sku || 'N/A'
                                        : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

