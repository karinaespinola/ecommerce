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
import { login } from '@/routes/customer';
import HeroCarousel from '@/components/HeroCarousel';

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
        category_id?: number;
    };
}

export default function Products({ products: initialProducts, categories: initialCategories, filters: initialFilters }: ProductsProps) {
    const { auth } = usePage<SharedData>().props;
    const [searchQuery, setSearchQuery] = useState(initialFilters?.search || '');
    const [categoryId, setCategoryId] = useState<number | null>(initialFilters?.category_id || null);
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
    const fetchProducts = async (page: number = 1, search?: string, categoryId?: number | null) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('per_page', '12');
            params.append('page', page.toString());
            if (search) {
                params.append('search', search);
            }
            if (categoryId) {
                params.append('category_id', categoryId.toString());
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
            fetchProducts(1, searchQuery || undefined, categoryId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProducts(1, searchQuery || undefined, categoryId);
    };

    const handleAddToCart = async (productId: number, variantId?: number) => {
        // Check if customer is authenticated
        if (!auth.customer) {
            // Redirect to login with intended URL
            router.visit(login().url + `?intended=${encodeURIComponent(window.location.href)}`);
            return;
        }

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
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken,
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
                {/* Hero Carousel */}
                <HeroCarousel />

                {/* Categories Section */}
                {categories && categories.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
                            {categoryId && (
                                <Link
                                    href="/products"
                                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                                >
                                    Clear filter
                                </Link>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
                            {categories.map((category) => (
                                <Link
                                    key={category.id}
                                    href={`/products?category_id=${category.id}`}
                                    className={`group flex flex-col items-center gap-2 hover:opacity-80 transition-opacity ${
                                        categoryId === category.id ? 'opacity-100' : ''
                                    }`}
                                >
                                    <div className={`w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 transition-colors ${
                                        categoryId === category.id 
                                            ? 'border-emerald-500 ring-2 ring-emerald-200' 
                                            : 'border-gray-200 group-hover:border-gray-400'
                                    }`}>
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

                {/* Stats Section */}
                <section className="mb-12 py-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div className="animate-fade-in">
                            <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">10K+</div>
                            <div className="text-gray-600 font-medium">Happy Customers</div>
                        </div>
                        <div className="animate-fade-in-delay-1">
                            <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">500+</div>
                            <div className="text-gray-600 font-medium">Products</div>
                        </div>
                        <div className="animate-fade-in-delay-2">
                            <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">50K+</div>
                            <div className="text-gray-600 font-medium">Orders Delivered</div>
                        </div>
                        <div className="animate-fade-in-delay-3">
                            <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">4.8★</div>
                            <div className="text-gray-600 font-medium">Average Rating</div>
                        </div>
                    </div>
                </section>

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

                {/* Testimonials Section */}
                <section className="my-16">
                    <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">What Our Customers Say</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow animate-fade-in">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg mr-4">
                                    JD
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">John Doe</div>
                                    <div className="text-sm text-gray-500">Verified Customer</div>
                                </div>
                            </div>
                            <div className="flex mb-3 text-yellow-400">
                                {'★★★★★'.split('').map((star, i) => (
                                    <span key={i}>{star}</span>
                                ))}
                            </div>
                            <p className="text-gray-600 italic">
                                "Amazing quality products and fast shipping! I've been shopping here for months and always satisfied."
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow animate-fade-in-delay-1">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg mr-4">
                                    SM
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">Sarah Miller</div>
                                    <div className="text-sm text-gray-500">Verified Customer</div>
                                </div>
                            </div>
                            <div className="flex mb-3 text-yellow-400">
                                {'★★★★★'.split('').map((star, i) => (
                                    <span key={i}>{star}</span>
                                ))}
                            </div>
                            <p className="text-gray-600 italic">
                                "Best online shopping experience! Great prices, excellent customer service, and products arrive exactly as described."
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow animate-fade-in-delay-2">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg mr-4">
                                    MW
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">Mike Wilson</div>
                                    <div className="text-sm text-gray-500">Verified Customer</div>
                                </div>
                            </div>
                            <div className="flex mb-3 text-yellow-400">
                                {'★★★★★'.split('').map((star, i) => (
                                    <span key={i}>{star}</span>
                                ))}
                            </div>
                            <p className="text-gray-600 italic">
                                "Silver Wings has become my go-to store. Quality products, competitive prices, and super reliable delivery!"
                            </p>
                        </div>
                    </div>
                </section>

                {/* Pagination */}
                {products && products.last_page > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        {Array.from({ length: products.last_page }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={products.current_page === page ? 'default' : 'outline'}
                                onClick={() => {
                                    fetchProducts(page, searchQuery || undefined, categoryId);
                                }}
                                disabled={loading}
                            >
                                {page}
                            </Button>
                        ))}
                    </div>
                )}

                {/* Newsletter Section */}
                <section className="my-16 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg p-8 md:p-12 text-white">
                    <div className="max-w-2xl mx-auto text-center animate-fade-in">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay Updated</h2>
                        <p className="text-emerald-100 mb-6 text-lg">
                            Subscribe to our newsletter and get exclusive deals, new product alerts, and special offers delivered to your inbox.
                        </p>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
                                if (emailInput && emailInput.value) {
                                    alert('Thank you for subscribing! We\'ll be in touch soon.');
                                    emailInput.value = '';
                                }
                            }}
                            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
                        >
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                required
                                className="flex-1 bg-white text-gray-900 placeholder-gray-500"
                            />
                            <Button type="submit" size="lg" className="bg-white text-emerald-600 hover:bg-gray-100">
                                Subscribe
                            </Button>
                        </form>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}

