import { Head, Link, router, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public/public-layout';
import { type SharedData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Search, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import publicProducts from '@/routes/public/products';
import cart from '@/routes/cart';

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface ProductImage {
    id: number;
    image_path: string;
    is_primary: boolean;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: string;
    is_active: boolean;
    categories: Category[];
    images: ProductImage[];
}

interface PaginatedProducts {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface ProductsProps {
    products: PaginatedProducts;
    categories?: Category[];
    filters: {
        category_id?: number;
        search?: string;
    };
}

export default function Products({ products, categories: initialCategories, filters }: ProductsProps) {
    const [selectedCategory, setSelectedCategory] = useState<number | undefined>(filters.category_id);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [categories, setCategories] = useState<Category[]>(initialCategories || []);

    // Fetch categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories');
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data);
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };

        fetchCategories();
    }, []);

    const handleCategoryFilter = (categoryId: number | undefined) => {
        setSelectedCategory(categoryId);
        router.get(publicProducts.index().url, {
            category_id: categoryId,
            search: searchQuery || undefined,
        }, { preserveScroll: true, replace: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(publicProducts.index().url, {
            category_id: selectedCategory,
            search: searchQuery || undefined,
        }, { preserveScroll: true, replace: true });
    };

    const handleAddToCart = async (productId: number, variantId?: number) => {
        try {
            const response = await fetch(cart.store().url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    product_id: productId,
                    product_variant_id: variantId || null,
                    quantity: 1,
                }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add to cart');
            }
            
            // Refresh cart count (will be handled by CartIcon)
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error: any) {
            console.error('Failed to add to cart:', error);
            alert(error.message || 'Failed to add item to cart');
        }
    };

    const getProductImage = (product: Product): string | null => {
        if (product.images && product.images.length > 0) {
            const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
            return `/storage/${primaryImage.image_path}`;
        }
        return null;
    };

    return (
        <PublicLayout title="Products">
            <div className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <div 
                    className="relative rounded-lg p-12 mb-12 overflow-hidden min-h-[400px] flex items-center"
                    style={{
                        backgroundImage: 'url(/images/hero-outfit.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    {/* Overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30"></div>
                    <div className="relative z-10 max-w-2xl text-white">
                        <h1 className="text-4xl font-bold mb-4">#Big Fashion Sale</h1>
                        <p className="text-xl mb-2">Limited Time Offer!</p>
                        <p className="text-3xl font-bold mb-4">Up to 50% OFF!</p>
                        <p className="text-lg">Redefine Your Everyday Style</p>
                    </div>
                </div>

                {/* Category Icons */}
                <div className="mb-8">
                    <div className="flex items-center gap-6 overflow-x-auto pb-4">
                        <button
                            onClick={() => handleCategoryFilter(undefined)}
                            className={`flex flex-col items-center gap-2 min-w-[80px] p-4 rounded-lg transition-colors ${
                                !selectedCategory ? 'bg-gray-100' : 'hover:bg-gray-50'
                            }`}
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-2xl">📦</span>
                            </div>
                            <span className="text-sm font-medium">All</span>
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryFilter(category.id)}
                                className={`flex flex-col items-center gap-2 min-w-[80px] p-4 rounded-lg transition-colors ${
                                    selectedCategory === category.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                                }`}
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-2xl">🏷️</span>
                                </div>
                                <span className="text-sm font-medium">{category.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mb-8">
                    <div className="relative max-w-md">
                        <Input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                </form>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.data.map((product) => (
                        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <Link href={publicProducts.show({ slug: product.slug }).url}>
                                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                    {getProductImage(product) ? (
                                        <img
                                            src={getProductImage(product)!}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            No Image
                                        </div>
                                    )}
                                    <button
                                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            // Favorite functionality can be added later
                                        }}
                                    >
                                        <Heart className="h-4 w-4" />
                                    </button>
                                </div>
                            </Link>
                            <CardContent className="p-4">
                                <Link href={publicProducts.show({ slug: product.slug }).url}>
                                    <h3 className="font-semibold text-lg mb-2 hover:text-gray-600">
                                        {product.name}
                                    </h3>
                                </Link>
                                {product.categories.length > 0 && (
                                    <div className="flex gap-2 mb-2">
                                        {product.categories.slice(0, 2).map((cat) => (
                                            <Badge key={cat.id} variant="secondary" className="text-xs">
                                                {cat.name}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <p className="text-2xl font-bold text-gray-900">
                                    ${Number(product.price).toFixed(2)}
                                </p>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                                <Button
                                    className="w-full"
                                    onClick={() => handleAddToCart(product.id)}
                                >
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Add to Cart
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {/* Pagination */}
                {products.last_page > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        {Array.from({ length: products.last_page }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={products.current_page === page ? 'default' : 'outline'}
                                onClick={() => {
                                    router.get(publicProducts.index().url, {
                                        page,
                                        category_id: selectedCategory,
                                        search: searchQuery || undefined,
                                    });
                                }}
                            >
                                {page}
                            </Button>
                        ))}
                    </div>
                )}

                {products.data.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No products found.</p>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}

