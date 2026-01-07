import { Link } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import cart from '@/routes/cart';

export function CartIcon() {
    const [cartCount, setCartCount] = useState(0);

    const fetchCartCount = async () => {
        try {
            const response = await fetch(cart.show().url);
            const data = await response.json();
            setCartCount(data.count || 0);
        } catch (error) {
            console.error('Failed to fetch cart count:', error);
        }
    };

    useEffect(() => {
        fetchCartCount();
        
        // Listen for cart updates
        const handleCartUpdate = () => {
            fetchCartCount();
        };
        
        window.addEventListener('cartUpdated', handleCartUpdate);
        
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, []);

    return (
        <Link href={cart.index().url}>
            <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                    <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                        {cartCount > 99 ? '99+' : cartCount}
                    </Badge>
                )}
            </Button>
        </Link>
    );
}

