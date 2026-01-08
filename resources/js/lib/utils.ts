import { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isSameUrl(
    url1: NonNullable<InertiaLinkProps['href']>,
    url2: NonNullable<InertiaLinkProps['href']>,
) {
    return resolveUrl(url1) === resolveUrl(url2);
}

export function resolveUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

/**
 * Get CSRF token from meta tag or cookie
 */
export function getCsrfToken(): string | null {
    // Try meta tag first
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (metaToken) return metaToken;
    
    // Fallback to XSRF-TOKEN cookie (Laravel's default)
    const cookies = document.cookie.split(';');
    const xsrfCookie = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
    if (xsrfCookie) {
        return decodeURIComponent(xsrfCookie.split('=')[1]);
    }
    
    return null;
}
