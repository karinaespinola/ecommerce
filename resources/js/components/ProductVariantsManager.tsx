import { Plus, X } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import AttributeModal from '@/components/AttributeModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Attribute {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
}

interface AttributeWithValues {
    attributeId: number;
    values: string[];
}

interface VariantImage {
    id?: number;
    image_path: string;
    file_name: string;
}

interface VariantData {
    attributes: Record<number, string>;
    price: number;
    stock: number;
    images: File[];
    existingImages: VariantImage[]; // Always defined to ensure deletion tracking works
    sku?: string;
}

interface InitialVariant {
    id?: number;
    attributes: Array<{ id: number; pivot: { value: string } }>;
    price: string | number;
    stock: string | number;
    sku?: string | null;
    images?: Array<{
        id: number;
        image_path: string;
        file_name: string;
    }>;
}

interface ProductVariantsManagerProps {
    attributes: Attribute[];
    isVariable: boolean;
    onVariantsChange?: (variants: VariantData[]) => void;
    onFeaturedImageChange?: (featuredImageId: string | null) => void; // Format: "variantKey-imageType-imageId" or "variantKey-imageType-imageIndex"
    initialVariants?: InitialVariant[];
    initialFeaturedImageId?: number | null;
}

export default function ProductVariantsManager({
    attributes,
    isVariable,
    onVariantsChange,
    onFeaturedImageChange,
    initialVariants,
    initialFeaturedImageId,
}: ProductVariantsManagerProps) {
    const [selectedAttributes, setSelectedAttributes] = useState<AttributeWithValues[]>([]);
    const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
    const [availableAttributes, setAvailableAttributes] = useState<Attribute[]>(attributes);
    const [newValueInputs, setNewValueInputs] = useState<Record<number, string>>({});
    const [variantData, setVariantData] = useState<Record<string, VariantData>>({});
    const [featuredImageId, setFeaturedImageId] = useState<string | null>(null);
    const isInitializedRef = useRef(false);
    const featuredImageInitializedRef = useRef(false);

    useEffect(() => {
        setAvailableAttributes(attributes);
    }, [attributes]);

    // Reset initialization flag when initialVariants change (e.g., after save and reload)
    useEffect(() => {
        if (initialVariants && initialVariants.length > 0) {
            isInitializedRef.current = false;
            featuredImageInitializedRef.current = false;
        }
    }, [initialVariants]);

    // Initialize variantData and selectedAttributes from existing variants when editing
    useEffect(() => {
        if (initialVariants && initialVariants.length > 0 && !isInitializedRef.current) {
            // Initialize variantData with existing variant data
            const initialVariantData: Record<string, VariantData> = {};
            const attributeMap = new Map<number, Set<string>>();
            
            initialVariants.forEach((variant) => {
                const variantAttributes: Record<number, string> = {};
                variant.attributes.forEach((attr) => {
                    variantAttributes[attr.id] = attr.pivot.value;
                    
                    // Also build attribute map for selectedAttributes
                    if (!attributeMap.has(attr.id)) {
                        attributeMap.set(attr.id, new Set());
                    }
                    attributeMap.get(attr.id)!.add(attr.pivot.value);
                });
                
                const key = Object.entries(variantAttributes)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([id, value]) => `${id}:${value}`)
                    .join('|');

                // Ensure images are loaded - handle both array and collection
                // Always set existingImages to an array (even if empty) so the Edit page
                // knows to send existing_image_ids for deletion tracking
                const variantImages = variant.images;
                let existingImages: VariantImage[] = [];
                
                if (variantImages) {
                    if (Array.isArray(variantImages)) {
                        existingImages = variantImages.map(img => ({
                            id: img.id,
                            image_path: img.image_path,
                            file_name: img.file_name,
                        }));
                    } else if (typeof variantImages === 'object' && 'length' in variantImages) {
                        // Handle Laravel collection-like objects
                        existingImages = Array.from(variantImages as any).map((img: any) => ({
                            id: img.id,
                            image_path: img.image_path,
                            file_name: img.file_name,
                        }));
                    }
                }
                // existingImages is always an array (empty if no images)
                // This ensures the Edit page will always send existing_image_ids for deletion tracking
                
                initialVariantData[key] = {
                    attributes: variantAttributes,
                    price: variant.price != null ? Number(variant.price) : 0,
                    stock: variant.stock != null ? Number(variant.stock) : 0,
                    images: [], // New file uploads
                    existingImages: existingImages, // Always an array, never undefined
                    sku: variant.sku ?? '',
                };
            });
            
            // Set both variantData and selectedAttributes together to avoid race conditions
            setVariantData(initialVariantData);
            
            // Convert to selectedAttributes format
            const initialSelectedAttributes: AttributeWithValues[] = Array.from(attributeMap.entries()).map(
                ([attributeId, values]) => ({
                    attributeId,
                    values: Array.from(values),
                })
            );
            
            setSelectedAttributes(initialSelectedAttributes);
            isInitializedRef.current = true;
        }
    }, [initialVariants, initialFeaturedImageId, onFeaturedImageChange]);

    const handleAddAttribute = () => {
        setSelectedAttributes([
            ...selectedAttributes,
            { attributeId: 0, values: [] },
        ]);
    };

    const handleRemoveAttribute = (index: number) => {
        setSelectedAttributes(selectedAttributes.filter((_, i) => i !== index));
        // Clean up the input state for this attribute
        const attributeId = selectedAttributes[index]?.attributeId;
        if (attributeId) {
            const newInputs = { ...newValueInputs };
            delete newInputs[attributeId];
            setNewValueInputs(newInputs);
        }
    };

    const handleAttributeSelect = (index: number, attributeId: string) => {
        const newAttributes = [...selectedAttributes];
        const oldAttributeId = newAttributes[index].attributeId;
        newAttributes[index].attributeId = parseInt(attributeId);
        newAttributes[index].values = []; // Reset values when attribute changes
        
        // Clean up input state
        if (oldAttributeId) {
            const newInputs = { ...newValueInputs };
            delete newInputs[oldAttributeId];
            setNewValueInputs(newInputs);
        }
        
        setSelectedAttributes(newAttributes);
    };

    const handleAddValue = (attributeIndex: number) => {
        const attribute = selectedAttributes[attributeIndex];
        if (!attribute || attribute.attributeId === 0) return;

        const newValue = newValueInputs[attribute.attributeId]?.trim();
        if (!newValue || attribute.values.includes(newValue)) return;

        const newAttributes = [...selectedAttributes];
        newAttributes[attributeIndex].values = [...newAttributes[attributeIndex].values, newValue];
        setSelectedAttributes(newAttributes);

        // Clear the input
        setNewValueInputs({
            ...newValueInputs,
            [attribute.attributeId]: '',
        });
    };

    const handleRemoveValue = (attributeIndex: number, valueIndex: number) => {
        const newAttributes = [...selectedAttributes];
        newAttributes[attributeIndex].values = newAttributes[attributeIndex].values.filter(
            (_, i) => i !== valueIndex
        );
        setSelectedAttributes(newAttributes);
    };

    const handleValueInputChange = (attributeId: number, value: string) => {
        setNewValueInputs({
            ...newValueInputs,
            [attributeId]: value,
        });
    };

    const handleValueInputKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        attributeIndex: number
    ) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddValue(attributeIndex);
        }
    };

    const handleAttributeCreated = (newAttribute: Attribute) => {
        setAvailableAttributes([...availableAttributes, newAttribute]);
        setIsAttributeModalOpen(false);
    };

    const getAvailableAttributesForSelect = (currentIndex: number) => {
        const currentAttributeId = selectedAttributes[currentIndex]?.attributeId;
        return availableAttributes.filter(
            (attr) =>
                attr.is_active &&
                (attr.id === currentAttributeId ||
                    !selectedAttributes.some(
                        (sel, idx) => sel.attributeId === attr.id && idx !== currentIndex
                    ))
        );
    };

    const generateVariants = useMemo(() => {
        // Filter out attributes that aren't selected or have no values
        const validAttributes = selectedAttributes.filter(
            (attr) => attr.attributeId > 0 && attr.values.length > 0
        );

        if (validAttributes.length === 0) return [];

        // Get attribute IDs and their value arrays
        const attributeIds = validAttributes.map((attr) => attr.attributeId);
        const valueArrays = validAttributes.map((attr) => attr.values);

        const combinations: Array<Record<number, string>> = [];

        const generateCombinations = (
            current: Record<number, string>,
            remainingIds: number[],
            remainingValues: string[][]
        ) => {
            if (remainingIds.length === 0) {
                combinations.push({ ...current });
                return;
            }

            const [currentId, ...restIds] = remainingIds;
            const [currentValues, ...restValues] = remainingValues;

            for (const value of currentValues) {
                generateCombinations(
                    { ...current, [currentId]: value },
                    restIds,
                    restValues
                );
            }
        };

        generateCombinations({}, attributeIds, valueArrays);

        return combinations;
    }, [selectedAttributes]);

    // Generate a unique key for each variant based on its attributes
    const getVariantKey = useCallback((variant: Record<number, string>): string => {
        return Object.entries(variant)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([id, value]) => `${id}:${value}`)
            .join('|');
    }, []);

    // Initialize variant data when variants are generated
    // Preserve existing data when combinations change
    useEffect(() => {
        // Don't run during initial load from existing variants
        // Wait until initialization is complete and selectedAttributes are set
        if (initialVariants && initialVariants.length > 0 && !isInitializedRef.current) {
            return;
        }
        
        // Don't clear existing data if generateVariants is empty (during initialization)
        if (generateVariants.length === 0 && initialVariants && initialVariants.length > 0) {
            return;
        }
        
        setVariantData((prevVariantData) => {
            // If we have existing variant data from initialization, merge it with generated variants
            const newVariantData: Record<string, VariantData> = { ...prevVariantData };
            
            generateVariants.forEach((variant) => {
                const key = getVariantKey(variant);
                if (newVariantData[key]) {
                    // Preserve existing data, only update attributes
                    // Explicitly preserve existingImages, price, stock, and sku to ensure they're not lost
                    newVariantData[key] = {
                        ...newVariantData[key],
                        attributes: variant,
                        existingImages: newVariantData[key].existingImages || [],
                        price: newVariantData[key].price ?? 0,
                        stock: newVariantData[key].stock ?? 0,
                        sku: newVariantData[key].sku ?? '',
                    };
                } else {
                    // Create new variant with default values
                    newVariantData[key] = {
                        attributes: variant,
                        price: 0,
                        stock: 0,
                        images: [],
                        existingImages: [],
                        sku: '',
                    };
                }
            });
            
            // Remove variants that are no longer in generateVariants (user removed attributes/values)
            const generatedKeys = new Set(generateVariants.map(v => getVariantKey(v)));
            Object.keys(newVariantData).forEach(key => {
                if (!generatedKeys.has(key)) {
                    delete newVariantData[key];
                }
            });
            
            return newVariantData;
        });
    }, [generateVariants, getVariantKey, initialVariants]);

    // Initialize featured image ID after variants are generated
    // This runs after generateVariants is ready, using the same index that's used in the display
    useEffect(() => {
        if (generateVariants.length > 0 && variantData && Object.keys(variantData).length > 0 && isInitializedRef.current) {
            // Only initialize once if we haven't initialized yet and we have an initialFeaturedImageId
            if (!featuredImageInitializedRef.current && initialFeaturedImageId) {
                // Find which variant contains the featured image using initialFeaturedImageId
                // We need to match the variant by its key (attribute combination) to get the correct index
                let foundFeaturedImageId: string | null = null;
                
                console.log('Initializing featured image, looking for:', initialFeaturedImageId);
                console.log('generateVariants:', generateVariants);
                console.log('variantData keys:', Object.keys(variantData));
                
                for (let variantIndex = 0; variantIndex < generateVariants.length; variantIndex++) {
                    const variant = generateVariants[variantIndex];
                    const variantKey = getVariantKey(variant);
                    const data = variantData[variantKey];
                    
                    console.log(`Checking variant ${variantIndex}, key: ${variantKey}, has data:`, !!data);
                    
                    if (data && data.existingImages && data.existingImages.length > 0) {
                        console.log(`Variant ${variantIndex} has ${data.existingImages.length} images`);
                        for (const img of data.existingImages) {
                            if (!img.id) {
                                console.warn('Image missing id:', img);
                                continue;
                            }
                            
                            // Compare with both number and string to handle type mismatches
                            const imgIdNum = typeof img.id === 'number' ? img.id : Number(img.id);
                            const initialIdNum = typeof initialFeaturedImageId === 'number' ? initialFeaturedImageId : Number(initialFeaturedImageId);
                            
                            console.log(`Comparing image id ${img.id} (${imgIdNum}) with initial ${initialFeaturedImageId} (${initialIdNum})`);
                            
                            if (imgIdNum === initialIdNum || String(img.id) === String(initialFeaturedImageId)) {
                                // Use the same format as in the display: existing-{idx}-{image.id}
                                // This index matches the index used in the table display
                                foundFeaturedImageId = `existing-${variantIndex}-${img.id}`;
                                console.log('Found featured image! Setting to:', foundFeaturedImageId);
                                break;
                            }
                        }
                    }
                    if (foundFeaturedImageId) break;
                }
                
                if (foundFeaturedImageId) {
                    setFeaturedImageId(foundFeaturedImageId);
                    if (onFeaturedImageChange) {
                        onFeaturedImageChange(foundFeaturedImageId);
                    }
                    featuredImageInitializedRef.current = true;
                } else {
                    console.warn('Could not find featured image with id:', initialFeaturedImageId);
                    // Mark as initialized anyway to prevent infinite loops
                    featuredImageInitializedRef.current = true;
                }
            } else if (!initialFeaturedImageId) {
                // If there's no initialFeaturedImageId, mark as initialized anyway
                featuredImageInitializedRef.current = true;
            }
        }
    }, [initialFeaturedImageId, generateVariants, variantData, getVariantKey, onFeaturedImageChange]);

    // Notify parent component when variant data changes
    useEffect(() => {
        if (onVariantsChange) {
            // Ensure all variants have existingImages defined (never undefined)
            const variants = Object.values(variantData).map(variant => ({
                ...variant,
                existingImages: variant.existingImages || [],
            }));
            onVariantsChange(variants);
        }
    }, [variantData, onVariantsChange]);

    const handleVariantFieldChange = (
        variantKey: string,
        field: keyof VariantData,
        value: string | number | File[]
    ) => {
        setVariantData((prev) => {
            let processedValue: string | number | File[] = value;
            
            // Convert string inputs to numbers for price and stock
            if (field === 'price' && typeof value === 'string') {
                processedValue = parseFloat(value) || 0;
            } else if (field === 'stock' && typeof value === 'string') {
                processedValue = parseInt(value, 10) || 0;
            }
            
            return {
                ...prev,
                [variantKey]: {
                    ...prev[variantKey],
                    [field]: processedValue,
                },
            };
        });
    };

    const handleImageChange = (variantKey: string, files: FileList | null) => {
        if (files) {
            const fileArray = Array.from(files);
            handleVariantFieldChange(variantKey, 'images', fileArray);
        } else {
            handleVariantFieldChange(variantKey, 'images', []);
        }
    };

    const handleRemoveImage = (variantIndex: number, imageIndex: number) => {
        // Find variant key from index
        const variant = generateVariants[variantIndex];
        if (!variant) return;
        
        const variantKey = getVariantKey(variant);
        setVariantData((prev) => {
            const current = prev[variantKey];
            if (!current) return prev;
            
            const newImages = current.images.filter((_, idx) => idx !== imageIndex);
            // Clear featured if the removed image was featured
            const featuredId = `new-${variantIndex}-${imageIndex}`;
            if (featuredImageId === featuredId) {
                setFeaturedImageId(null);
                if (onFeaturedImageChange) {
                    onFeaturedImageChange(null);
                }
            } else if (featuredImageId && featuredImageId.startsWith(`new-${variantIndex}-`)) {
                // Update featured image ID if indices shifted
                const parts = featuredImageId.split('-');
                const featuredImageIdx = parseInt(parts[2]);
                if (!isNaN(featuredImageIdx) && featuredImageIdx > imageIndex) {
                    const newFeaturedId = `new-${variantIndex}-${featuredImageIdx - 1}`;
                    setFeaturedImageId(newFeaturedId);
                    if (onFeaturedImageChange) {
                        onFeaturedImageChange(newFeaturedId);
                    }
                }
            }
            return {
                ...prev,
                [variantKey]: {
                    ...current,
                    images: newImages,
                },
            };
        });
    };

    const handleRemoveExistingImage = (variantIndex: number, imageId: number) => {
        // Find variant key from index
        const variant = generateVariants[variantIndex];
        if (!variant) return;
        
        const variantKey = getVariantKey(variant);
        setVariantData((prev) => {
            const current = prev[variantKey];
            if (!current) return prev;
            
            // Always ensure existingImages is an array (never undefined)
            // This is important so the Edit page knows to send existing_image_ids for deletion tracking
            const currentExistingImages = current.existingImages || [];
            const newExistingImages = currentExistingImages.filter((img) => img.id !== imageId);
            
            // Clear featured if the removed image was featured
            const featuredId = `existing-${variantIndex}-${imageId}`;
            if (featuredImageId === featuredId) {
                setFeaturedImageId(null);
                if (onFeaturedImageChange) {
                    onFeaturedImageChange(null);
                }
            }
            
            // Create updated variant data with existingImages always defined as an array
            const updatedVariant = {
                ...current,
                // Always set existingImages to an array, even if empty
                // This ensures the Edit page will send existing_image_ids for deletion tracking
                existingImages: newExistingImages,
            };
            
            return {
                ...prev,
                [variantKey]: updatedVariant,
            };
        });
    };

    const handleSetFeaturedImage = (imageId: string) => {
        setFeaturedImageId(imageId);
        if (onFeaturedImageChange) {
            onFeaturedImageChange(imageId);
        }
    };

    if (!isVariable) {
        return null;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Product Variants</CardTitle>
                    <CardDescription>
                        Select attributes and add values for each. All combinations of attribute values will be generated as variants below.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        {selectedAttributes.map((attr, index) => {
                            const availableAttrs = getAvailableAttributesForSelect(index);
                            const selectedAttribute = availableAttributes.find(
                                (a) => a.id === attr.attributeId
                            );
                            const currentInputValue = newValueInputs[attr.attributeId] || '';

                            return (
                                <div
                                    key={index}
                                    className="p-4 border rounded-lg space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold">
                                            {selectedAttribute
                                                ? selectedAttribute.name
                                                : 'Select Attribute'}
                                        </Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveAttribute(index)}
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <Select
                                            value={
                                                attr.attributeId > 0
                                                    ? attr.attributeId.toString()
                                                    : undefined
                                            }
                                            onValueChange={(value) =>
                                                handleAttributeSelect(index, value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an attribute" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableAttrs.map((attribute) => (
                                                    <SelectItem
                                                        key={attribute.id}
                                                        value={attribute.id.toString()}
                                                    >
                                                        {attribute.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {attr.attributeId > 0 && (
                                        <div className="space-y-2">
                                            <Label className="text-sm">
                                                Values for {selectedAttribute?.name}
                                            </Label>
                                            
                                            {attr.values.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {attr.values.map((value, valueIndex) => (
                                                        <Badge
                                                            key={valueIndex}
                                                            variant="secondary"
                                                            className="flex items-center gap-1 px-2 py-1"
                                                        >
                                                            {value}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveValue(
                                                                        index,
                                                                        valueIndex
                                                                    )
                                                                }
                                                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                                            >
                                                                <X className="size-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <Input
                                                    value={currentInputValue}
                                                    onChange={(e) =>
                                                        handleValueInputChange(
                                                            attr.attributeId,
                                                            e.target.value
                                                        )
                                                    }
                                                    onKeyDown={(e) =>
                                                        handleValueInputKeyDown(e, index)
                                                    }
                                                    placeholder={`Add ${selectedAttribute?.name.toLowerCase()} value`}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => handleAddValue(index)}
                                                    disabled={!currentInputValue.trim()}
                                                >
                                                    <Plus className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddAttribute}
                        >
                            <Plus className="size-4 mr-2" />
                            Add Attribute
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAttributeModalOpen(true)}
                        >
                            <Plus className="size-4 mr-2" />
                            Create New Attribute
                        </Button>
                    </div>

                    {selectedAttributes.length > 0 && generateVariants.length === 0 && (
                        <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                            <p className="text-sm text-muted-foreground">
                                Add values to the selected attributes above to generate variants. Each combination of attribute values will create a separate variant.
                            </p>
                        </div>
                    )}

                    {generateVariants.length > 0 && (
                        <div className="mt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-semibold">
                                        Generated Variants
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {generateVariants.length} variant{generateVariants.length !== 1 ? 's' : ''} will be created
                                    </p>
                                </div>
                            </div>
                            
                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold">Variation</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                                    Price <span className="text-destructive">*</span>
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold">
                                                    Stock <span className="text-destructive">*</span>
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold">SKU</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold">Images</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {generateVariants.map((variant, idx) => {
                                                const variantKey = getVariantKey(variant);
                                                const data = variantData[variantKey] || {
                                                    attributes: variant,
                                                    price: 0,
                                                    stock: 0,
                                                    images: [],
                                                    existingImages: [],
                                                    sku: '',
                                                };

                                                const variantString = Object.entries(variant)
                                                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                                    .map(([attrId, value]) => {
                                                        const attr = availableAttributes.find(
                                                            (a) => a.id === parseInt(attrId)
                                                        );
                                                        return `${attr?.name || 'Unknown'}: ${value}`;
                                                    })
                                                    .join(', ');

                                                return (
                                                    <tr key={idx} className="hover:bg-muted/30">
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm font-medium">
                                                                {variantString}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Input
                                                                id={`price-${idx}`}
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={data.price != null ? String(data.price) : ''}
                                                                onChange={(e) =>
                                                                    handleVariantFieldChange(
                                                                        variantKey,
                                                                        'price',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder="0.00"
                                                                required
                                                                className="w-32"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Input
                                                                id={`stock-${idx}`}
                                                                type="number"
                                                                min="0"
                                                                value={data.stock != null ? String(data.stock) : ''}
                                                                onChange={(e) =>
                                                                    handleVariantFieldChange(
                                                                        variantKey,
                                                                        'stock',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder="0"
                                                                required
                                                                className="w-32"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Input
                                                                id={`sku-${idx}`}
                                                                value={data.sku || ''}
                                                                onChange={(e) =>
                                                                    handleVariantFieldChange(
                                                                        variantKey,
                                                                        'sku',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder="Optional"
                                                                className="w-32"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="space-y-2 min-w-[200px]">
                                                                <Input
                                                                    id={`images-${idx}`}
                                                                    type="file"
                                                                    accept="image/*"
                                                                    multiple
                                                                    onChange={(e) => {
                                                                        handleImageChange(variantKey, e.target.files);
                                                                    }}
                                                                    className="cursor-pointer text-xs"
                                                                />
                                                                {/* Existing images */}
                                                                {data.existingImages && data.existingImages.length > 0 && (
                                                                    <div className="space-y-1.5">
                                                                        {data.existingImages.map((image) => {
                                                                            if (!image.id) return null;
                                                                            const imageId = `existing-${idx}-${image.id}`;
                                                                            const isFeatured = featuredImageId === imageId;
                                                                            // Debug log for first image
                                                                            if (idx === 0 && data.existingImages.indexOf(image) === 0) {
                                                                                console.log('Rendering image, featuredImageId:', featuredImageId, 'imageId:', imageId, 'isFeatured:', isFeatured);
                                                                            }
                                                                            return (
                                                                                <div
                                                                                    key={image.id}
                                                                                    className={`flex items-center gap-2 p-1.5 border rounded text-xs ${
                                                                                        isFeatured ? 'border-primary bg-primary/5' : ''
                                                                                    }`}
                                                                                >
                                                                                    <input
                                                                                        type="radio"
                                                                                        name="product-featured-image"
                                                                                        id={`featured-existing-${variantKey}-${image.id}`}
                                                                                        checked={isFeatured}
                                                                                        onChange={() => handleSetFeaturedImage(imageId)}
                                                                                        className="cursor-pointer"
                                                                                    />
                                                                                    <label
                                                                                        htmlFor={`featured-existing-${variantKey}-${image.id}`}
                                                                                        className="flex items-center gap-1.5 flex-1 cursor-pointer"
                                                                                    >
                                                                                        <img
                                                                                            src={`/storage/${image.image_path}`}
                                                                                            alt={image.file_name}
                                                                                            className="w-6 h-6 object-cover rounded"
                                                                                        />
                                                                                        <span className="truncate flex-1">
                                                                                            {image.file_name}
                                                                                        </span>
                                                                                        {isFeatured && (
                                                                                            <Badge variant="default" className="text-xs">
                                                                                                Featured
                                                                                            </Badge>
                                                                                        )}
                                                                                    </label>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            handleRemoveExistingImage(idx, image.id!)
                                                                                        }
                                                                                        className="ml-auto hover:bg-destructive/20 rounded-full p-0.5"
                                                                                    >
                                                                                        <X className="size-3" />
                                                                                    </button>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                                {/* New file uploads */}
                                                                {data.images && data.images.length > 0 && (
                                                                    <div className="space-y-1.5">
                                                                        {data.images.map((image, imgIdx) => {
                                                                            const imageId = `new-${idx}-${imgIdx}`;
                                                                            const isFeatured = featuredImageId === imageId;
                                                                            // Use file name + size + lastModified for stable key
                                                                            const imageKey = `${image.name}-${image.size}-${image.lastModified}-${imgIdx}`;
                                                                            return (
                                                                                <div
                                                                                    key={imageKey}
                                                                                    className={`flex items-center gap-2 p-1.5 border rounded text-xs ${
                                                                                        isFeatured ? 'border-primary bg-primary/5' : ''
                                                                                    }`}
                                                                                >
                                                                                    <input
                                                                                        type="radio"
                                                                                        name="product-featured-image"
                                                                                        id={`featured-new-${variantKey}-${imgIdx}`}
                                                                                        checked={isFeatured}
                                                                                        onChange={() => handleSetFeaturedImage(imageId)}
                                                                                        className="cursor-pointer"
                                                                                    />
                                                                                    <label
                                                                                        htmlFor={`featured-new-${variantKey}-${imgIdx}`}
                                                                                        className="flex items-center gap-1.5 flex-1 cursor-pointer"
                                                                                    >
                                                                                        <span className="truncate flex-1">
                                                                                            {image.name}
                                                                                        </span>
                                                                                        {isFeatured && (
                                                                                            <Badge variant="default" className="text-xs">
                                                                                                Featured
                                                                                            </Badge>
                                                                                        )}
                                                                                    </label>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            handleRemoveImage(idx, imgIdx)
                                                                                        }
                                                                                        className="ml-auto hover:bg-destructive/20 rounded-full p-0.5"
                                                                                    >
                                                                                        <X className="size-3" />
                                                                                    </button>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AttributeModal
                isOpen={isAttributeModalOpen}
                onClose={() => setIsAttributeModalOpen(false)}
                onSuccess={handleAttributeCreated}
            />
        </>
    );
}
