import { X } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ValidationErrorsProps {
    errors: Record<string, string | string[]>;
}

/**
 * Converts technical field names to human-readable labels
 */
function humanizeFieldName(field: string): string {
    // Handle variant fields: variants.0.0.images.0 -> Variant 1, Image 1
    const variantMatch = field.match(/^variants\.(\d+)\.(\d+)\.(.+)$/);
    if (variantMatch) {
        const [, variantIndex, , fieldName] = variantMatch;
        const variantNum = parseInt(variantIndex, 10) + 1;
        
        // Handle nested fields like images.0
        if (fieldName.startsWith('images.')) {
            const imageIndex = parseInt(fieldName.split('.')[1], 10) + 1;
            return `Variant ${variantNum}, Image ${imageIndex}`;
        }
        
        // Handle other variant fields
        const fieldLabels: Record<string, string> = {
            attribute: 'Attribute',
            value: 'Value',
            price: 'Price',
            stock: 'Stock',
            images: 'Images',
        };
        
        const label = fieldLabels[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        return `Variant ${variantNum}, ${label}`;
    }
    
    // Handle category_ids.*
    if (field.startsWith('category_ids.')) {
        return 'Category';
    }
    
    // Handle regular fields - capitalize first letter
    return field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
}

/**
 * Improves error messages to be more user-friendly
 */
function humanizeErrorMessage(message: string): string {
    // Remove "The [field] field" prefix if present
    message = message.replace(/^The (.+?) field /i, '');
    
    // Convert kilobytes to MB for file size errors
    message = message.replace(/must not be greater than (\d+) kilobytes/i, (_, kb) => {
        const mb = (parseInt(kb) / 1024).toFixed(1);
        return `must be less than ${mb}MB`;
    });
    
    // Handle "must be less than 2MB" (already formatted)
    if (message.includes('must be less than 2MB')) {
        return message;
    }
    
    // Improve other common messages
    message = message.replace(/must be a valid image/i, 'must be a valid image file');
    message = message.replace(/must be a number/i, 'must be a valid number');
    message = message.replace(/must be a whole number/i, 'must be a whole number');
    message = message.replace(/must be at least (\d+)/i, 'must be at least $1');
    message = message.replace(/is required/i, 'is required');
    message = message.replace(/must exist/i, 'must be valid');
    message = message.replace(/must be unique/i, 'already exists');
    message = message.replace(/is invalid/i, 'is invalid');
    
    // Capitalize first letter
    return message.charAt(0).toUpperCase() + message.slice(1);
}

export default function ValidationErrors({ errors }: ValidationErrorsProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed || Object.keys(errors).length === 0) {
        return null;
    }

    const allErrorMessages = Object.entries(errors).flatMap(([key, error]) => {
        const messages = Array.isArray(error) ? error : [error];
        return messages.map((msg) => {
            const fieldName = humanizeFieldName(key);
            const errorMsg = humanizeErrorMessage(msg);
            return `${fieldName}: ${errorMsg}`;
        });
    });
    
    const errorCount = allErrorMessages.length;
    const errorMessages = allErrorMessages.slice(0, 3); // Show first 3 errors
    const hasMore = errorCount > 3;

    return (
        <Alert variant="destructive" className="relative">
            <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-6 w-6 p-0"
                onClick={() => setDismissed(true)}
            >
                <X className="h-4 w-4" />
            </Button>
            <AlertTitle>
                {errorCount === 1 ? 'Validation Error' : `Validation Errors (${errorCount})`}
            </AlertTitle>
            <AlertDescription>
                <ul className="list-inside list-disc space-y-1">
                    {errorMessages.map((msg, index) => (
                        <li key={index} className="text-sm">
                            {msg}
                        </li>
                    ))}
                </ul>
                {hasMore && (
                    <p className="mt-2 text-xs opacity-80">
                        And {errorCount - 3} more error(s). See fields below for details.
                    </p>
                )}
            </AlertDescription>
        </Alert>
    );
}

