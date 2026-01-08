import { Head, Link, router, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public/public-layout';
import { type SharedData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import publicProducts from '@/routes/public/products';
import cart from '@/routes/cart';
import { getCsrfToken } from '@/lib/utils';

interface Category {
    id: number;
    name: string;
    slug: string;
    image: string | null;
}

interface ProductImage {
    id: number;
    image_path: string;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: string;
    is_active: boolean;
    is_variable?: boolean;
    categories: Category[];
    images: ProductImage[];
    featured_image?: ProductImage | null;
    display_price?: string;
    price_display?: string;
}

interface PaginatedProducts {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface ProductsProps {
    products?: PaginatedProducts;
    categories?: Category[];
    filters?: {
        search?: string;
    };
}

export default function Products({ products: initialProducts, categories: initialCategories, filters: initialFilters }: ProductsProps) {
    const [searchQuery, setSearchQuery] = useState(initialFilters?.search || '');
    const [categories, setCategories] = useState<Category[]>(initialCategories || []);
    const [products, setProducts] = useState<PaginatedProducts | null>(initialProducts || null);
    const [loading, setLoading] = useState(!initialProducts);
    const [currentPage, setCurrentPage] = useState(initialProducts?.current_page || 1);
    const [error, setError] = useState<string | null>(null);

    // Fetch categories from API if not provided via props
    useEffect(() => {
        const fetchCategories = async () => {
            // Only fetch if we don't have initial categories
            if (initialCategories && initialCategories.length > 0) {
                return;
            }
            
            try {
                const response = await fetch('/api/categories');
                if (response.ok) {
                    const data = await response.json();
                    // Categories API returns an array directly
                    if (Array.isArray(data)) {
                        setCategories(data);
                    } else {
                        console.error('Unexpected categories response format:', data);
                    }
                } else {
                    console.error('Failed to fetch categories:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };

        fetchCategories();
    }, [initialCategories]);

    // Fetch products from API
    const fetchProducts = async (page: number = 1, search?: string) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('per_page', '12');
            params.append('page', page.toString());
            if (search) {
                params.append('search', search);
            }

            const url = `/api/products?${params.toString()}`;
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                // API returns { products: PaginatedProducts, categories: Category[] }
                if (data.products && data.products.data) {
                    setProducts(data.products);
                    setCurrentPage(page);
                    // Also update categories if provided in response
                    if (data.categories && Array.isArray(data.categories)) {
                        setCategories(data.categories);
                    }
                } else {
                    console.error('No products in response:', data);
                    setError('No products found in response');
                }
            } else {
                const errorText = await response.text();
                console.error('Failed to fetch products:', response.status, errorText);
                setError(`Failed to fetch products: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setError('Failed to fetch products. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Only fetch products from API on mount if not provided via props
    useEffect(() => {
        if (!initialProducts) {
            fetchProducts(1, searchQuery || undefined);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProducts(1, searchQuery || undefined);
    };

    const handleAddToCart = async (productId: number, variantId?: number) => {
        console.log('Add to cart clicked', { productId, variantId });
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
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    product_id: productId,
                    product_variant_id: variantId || null,
                    quantity: 1,
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
            
            if (isJson) {
                const data = await response.json();
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
        } catch (error: any) {
            console.error('Failed to add to cart:', error);
            alert(error.message || 'Failed to add item to cart');
        }
    };

    const getProductImage = (product: Product): string | null => {
        // Use featured_image if available (set by backend)
        if (product.featured_image) {
            return `/storage/${product.featured_image.image_path}`;
        }
        // Fallback to first image in images array
        if (product.images && product.images.length > 0) {
            return `/storage/${product.images[0].image_path}`;
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
                        backgroundImage: 'url(/storage/website/hero.png)',
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

                {/* Categories Section */}
                {categories && categories.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-6 text-gray-900">Shop by Category</h2>
                        <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
                            {categories.map((category) => (
                                <Link
                                    key={category.id}
                                    href="/products"
                                    className="group flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
                                >
                                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 group-hover:border-gray-400 transition-colors">
                                        {category.image ? (
                                            <img
                                                src={`/storage/${category.image}`}
                                                alt={category.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                                <div className="text-2xl">📦</div>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-700 text-center max-w-[80px] group-hover:text-gray-900 transition-colors">
                                        {category.name}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

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

                {/* Error Message */}
                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Products Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">Loading products...</p>
                    </div>
                ) : products && products.data && products.data.length > 0 ? (
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
                                </div>
                            </Link>
                            <CardContent className="p-4 bg-gray-50">
                                <Link href={publicProducts.show({ slug: product.slug }).url}>
                                    <h3 className="font-semibold text-lg mb-2 text-slate-900 hover:text-slate-700 transition-colors">
                                        {product.name}
                                    </h3>
                                </Link>
                                {product.categories.length > 0 && (
                                    <div className="flex gap-2 mb-3">
                                        {product.categories.slice(0, 2).map((cat) => (
                                            <Badge key={cat.id} variant="secondary" className="text-xs">
                                                {cat.name}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <p className="text-2xl font-bold text-emerald-600">
                                    {product.price_display || `$${Number(product.price).toFixed(2)}`}
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
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No products found.</p>
                    </div>
                )}

                {/* Pagination */}
                {products && products.last_page > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        {Array.from({ length: products.last_page }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={products.current_page === page ? 'default' : 'outline'}
                                onClick={() => {
                                    fetchProducts(page, searchQuery || undefined);
                                }}
                                disabled={loading}
                            >
                                {page}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}

