import { useState, useEffect } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AttributeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (attribute: Attribute) => void;
}

interface Attribute {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
}

export default function AttributeModal({
    isOpen,
    onClose,
    onSuccess,
}: AttributeModalProps) {
    const [processing, setProcessing] = useState(false);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setName('');
            setSlug('');
            setIsActive(true);
            setErrors({});
            setProcessing(false);
        }
    }, [isOpen]);

    const getCsrfToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) return token;
        
        const cookies = document.cookie.split(';');
        const xsrfCookie = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
        if (xsrfCookie) {
            return decodeURIComponent(xsrfCookie.split('=')[1]);
        }
        
        return null;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (processing) {
            return; // Prevent double submission
        }
        
        setProcessing(true);
        setErrors({});

        const csrfToken = getCsrfToken();

        try {
            const response = await fetch('/attributes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    name,
                    slug: slug || undefined,
                    is_active: isActive,
                }),
            });

            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('Failed to parse response:', parseError);
                setErrors({ name: 'Invalid response from server' });
                setProcessing(false);
                return;
            }

            if (!response.ok) {
                if (data.errors) {
                    setErrors(data.errors);
                } else {
                    setErrors({ name: data.message || 'Failed to create attribute' });
                }
                setProcessing(false);
                return;
            }

            // Ensure we have a valid attribute object
            if (data && data.id) {
                onSuccess(data);
                setProcessing(false);
                handleClose();
            } else {
                // Fallback if response structure is different
                const newAttribute: Attribute = {
                    id: data.id || Date.now(),
                    name: data.name || name,
                    slug: data.slug || (slug || name.toLowerCase().replace(/\s+/g, '-')),
                    is_active: data.is_active !== undefined ? data.is_active : isActive,
                };
                onSuccess(newAttribute);
                setProcessing(false);
                handleClose();
            }
        } catch (error) {
            console.error('Error creating attribute:', error);
            setErrors({ name: 'An error occurred while creating the attribute' });
            setProcessing(false);
        }
    };

    const handleClose = () => {
        if (processing) {
            setProcessing(false);
        }
        setName('');
        setSlug('');
        setIsActive(true);
        setErrors({});
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Attribute</DialogTitle>
                    <DialogDescription>
                        Add a new attribute that can be used for product variants
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="attribute-name">
                            Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="attribute-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                            placeholder="e.g., Color, Size"
                        />
                        <InputError message={errors?.name as string} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="attribute-slug">Slug</Label>
                        <Input
                            id="attribute-slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="auto-generated if empty"
                        />
                        <p className="text-xs text-muted-foreground">
                            Leave empty to auto-generate from name
                        </p>
                        <InputError message={errors?.slug as string} />
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="attribute-active"
                            checked={isActive}
                            onCheckedChange={(checked) =>
                                setIsActive(checked === true)
                            }
                        />
                        <Label htmlFor="attribute-active" className="cursor-pointer">
                            Active
                        </Label>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={processing}
                        >
                            {processing ? 'Creating...' : 'Create Attribute'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

