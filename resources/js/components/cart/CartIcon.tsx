import { Link, usePage } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useRef } from 'react';
import cart from '@/routes/cart';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types';

export function CartIcon() {
    const { cartCount: initialCartCount } = usePage<SharedData>().props;
    const [cartCount, setCartCount] = useState(initialCartCount ?? 0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [badgePulse, setBadgePulse] = useState(false);
    const previousCountRef = useRef(initialCartCount ?? 0);

    const fetchCartCount = async () => {
        try {
            const response = await fetch(cart.show().url, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                },
            });
            
            if (!response.ok) {
                console.error('Failed to fetch cart count:', response.status, response.statusText);
                return;
            }
            
            const data = await response.json();
            const newCount = data.count || 0;
            
            // Trigger animation if count increased
            if (newCount > previousCountRef.current) {
                setIsAnimating(true);
                setBadgePulse(true);
                setTimeout(() => setIsAnimating(false), 600);
                setTimeout(() => setBadgePulse(false), 1000);
            }
            
            previousCountRef.current = newCount;
            setCartCount(newCount);
        } catch (error) {
            console.error('Failed to fetch cart count:', error);
        }
    };

    // Sync cart count with shared prop when it changes (e.g., after Inertia page updates)
    useEffect(() => {
        if (initialCartCount !== undefined && initialCartCount !== cartCount) {
            const newCount = initialCartCount;
            if (newCount > previousCountRef.current) {
                setIsAnimating(true);
                setBadgePulse(true);
                setTimeout(() => setIsAnimating(false), 600);
                setTimeout(() => setBadgePulse(false), 1000);
            }
            previousCountRef.current = newCount;
            setCartCount(newCount);
        }
    }, [initialCartCount, cartCount]);

    useEffect(() => {
        // Initialize with shared prop value on mount
        if (initialCartCount !== undefined) {
            previousCountRef.current = initialCartCount;
            setCartCount(initialCartCount);
        } else {
            // Fallback to API fetch if shared prop is unavailable (backward compatibility)
            fetchCartCount();
        }
        
        // Listen for cart updates
        const handleCartUpdate = (event: Event) => {
            // If the event has cart count data, update immediately
            if (event instanceof CustomEvent && event.detail?.cartCount !== undefined) {
                const newCount = event.detail.cartCount;
                if (newCount > previousCountRef.current) {
                    setIsAnimating(true);
                    setBadgePulse(true);
                    setTimeout(() => setIsAnimating(false), 600);
                    setTimeout(() => setBadgePulse(false), 1000);
                }
                previousCountRef.current = newCount;
                setCartCount(newCount);
            } else {
                // Otherwise fetch from server
                fetchCartCount();
            }
        };
        
        window.addEventListener('cartUpdated', handleCartUpdate);
        
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, []);

    return (
        <Link href={cart.index().url} className="relative group">
            <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                    "relative transition-all duration-300 hover:bg-gray-100 border border-transparent hover:border-gray-200",
                    isAnimating && "animate-bounce"
                )}
            >
                <ShoppingCart className={cn(
                    "h-5 w-5 text-gray-700 transition-all duration-300",
                    isAnimating && "scale-125 text-green-600"
                )} />
                {cartCount > 0 && (
                    <Badge 
                        variant="destructive" 
                        className={cn(
                            "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold transition-all duration-300 shadow-lg",
                            badgePulse && "animate-pulse scale-125 ring-2 ring-red-400"
                        )}
                    >
                        {cartCount > 99 ? '99+' : cartCount}
                    </Badge>
                )}
            </Button>
            {/* Ripple effect on add */}
            {isAnimating && (
                <>
                    <span className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" />
                    <span className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" style={{ animationDelay: '200ms' }} />
                </>
            )}
            {/* Tooltip */}
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {cartCount > 0 ? `${cartCount} item${cartCount > 1 ? 's' : ''} in cart` : 'Cart is empty'}
            </span>
        </Link>
    );
}

