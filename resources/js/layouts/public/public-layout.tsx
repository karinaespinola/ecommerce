import { type ReactNode } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { home } from '@/routes';
import { login, register, logout } from '@/routes/customer';
import { dashboard } from '@/routes/admin';
import { ShoppingCart, Search, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CartIcon } from '@/components/cart/CartIcon';
import { useState } from 'react';

interface PublicLayoutProps {
    children: ReactNode;
    title?: string;
}

export default function PublicLayout({ children, title = 'Shop' }: PublicLayoutProps) {
    const { auth } = usePage<SharedData>().props;
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    return (
        <>
            <Head title={title} />
            <div className="min-h-screen flex flex-col bg-white">
                {/* Top Bar */}
                <div className="bg-gray-100 border-b border-gray-200 py-2">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-end text-sm text-gray-600">
                            <div className="flex items-center gap-4">
                                <Link href="#" className="hover:text-gray-900">About</Link>
                                <Link href="#" className="hover:text-gray-900">Contact</Link>
                                {auth.customer ? (
                                    <Link
                                        href={logout()}
                                        as="button"
                                        method="post"
                                        className="hover:text-gray-900"
                                    >
                                        Logout
                                    </Link>
                                ) : (
                                    <>
                                        <Link href={register()} className="hover:text-gray-900">Sign Up</Link>
                                        <Link href={login()} className="hover:text-gray-900">Log In</Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between gap-4">
                            {/* Logo */}
                            <Link href={home()} className="flex items-center gap-2">
                                <div className="text-2xl font-bold text-gray-900">Silver Wings</div>
                            </Link>

                            {/* Search Bar */}
                            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4">
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="Search product or brand here..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border-gray-300 rounded-md text-gray-900"
                                    />
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                            </form>

                            {/* Right Side Actions */}
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <CartIcon />
                                </div>
                                {auth.customer && (
                                    <Link href={dashboard().url}>
                                        <Button variant="ghost" size="icon">
                                            <User className="h-5 w-5" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1">
                    {children}
                </main>

                {/* Footer */}
                <footer className="bg-gray-900 text-white mt-auto">
                    <div className="container mx-auto px-4 py-12">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Silver Wings</h3>
                                <p className="text-gray-400 text-sm">Let's Shop Beyond Boundaries</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">About</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><Link href="#" className="hover:text-white">About Us</Link></li>
                                    <li><Link href="#" className="hover:text-white">Careers</Link></li>
                                    <li><Link href="#" className="hover:text-white">Blog</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Customer Service</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><Link href="#" className="hover:text-white">Help Center</Link></li>
                                    <li><Link href="#" className="hover:text-white">Contact Us</Link></li>
                                    <li><Link href="#" className="hover:text-white">Shipping Info</Link></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Legal</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><Link href="#" className="hover:text-white">Terms & Conditions</Link></li>
                                    <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                            <p>&copy; {new Date().getFullYear()} Silver Wings. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}

