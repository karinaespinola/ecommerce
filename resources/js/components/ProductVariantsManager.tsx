import { Plus, X } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';

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

interface VariantData {
    attributes: Record<number, string>;
    price: string;
    stock: string;
    images: File[];
    sku?: string;
}

interface ProductVariantsManagerProps {
    attributes: Attribute[];
    isVariable: boolean;
    onVariantsChange?: (variants: VariantData[]) => void;
}

export default function ProductVariantsManager({
    attributes,
    isVariable,
    onVariantsChange,
}: ProductVariantsManagerProps) {
    const [selectedAttributes, setSelectedAttributes] = useState<AttributeWithValues[]>([]);
    const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
    const [availableAttributes, setAvailableAttributes] = useState<Attribute[]>(attributes);
    const [newValueInputs, setNewValueInputs] = useState<Record<number, string>>({});
    const [variantData, setVariantData] = useState<Record<string, VariantData>>({});

    useEffect(() => {
        setAvailableAttributes(attributes);
    }, [attributes]);

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
        setVariantData((prevVariantData) => {
            const newVariantData: Record<string, VariantData> = {};
            generateVariants.forEach((variant) => {
                const key = getVariantKey(variant);
                if (prevVariantData[key]) {
                    // Preserve existing data, only update attributes
                    newVariantData[key] = {
                        ...prevVariantData[key],
                        attributes: variant,
                    };
                } else {
                    // Create new variant with default values
                    newVariantData[key] = {
                        attributes: variant,
                        price: '',
                        stock: '',
                        images: [],
                        sku: '',
                    };
                }
            });
            return newVariantData;
        });
    }, [generateVariants, getVariantKey]);

    // Notify parent component when variant data changes
    useEffect(() => {
        if (onVariantsChange) {
            const variants = Object.values(variantData);
            onVariantsChange(variants);
        }
    }, [variantData, onVariantsChange]);

    const handleVariantFieldChange = (
        variantKey: string,
        field: keyof VariantData,
        value: string | File[]
    ) => {
        setVariantData((prev) => ({
            ...prev,
            [variantKey]: {
                ...prev[variantKey],
                [field]: value,
            },
        }));
    };

    const handleImageChange = (variantKey: string, files: FileList | null) => {
        if (files) {
            const fileArray = Array.from(files);
            handleVariantFieldChange(variantKey, 'images', fileArray);
        } else {
            handleVariantFieldChange(variantKey, 'images', []);
        }
    };

    const handleRemoveImage = (variantKey: string, imageIndex: number) => {
        setVariantData((prev) => {
            const current = prev[variantKey];
            const newImages = current.images.filter((_, idx) => idx !== imageIndex);
            return {
                ...prev,
                [variantKey]: {
                    ...current,
                    images: newImages,
                },
            };
        });
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
                                                    price: '',
                                                    stock: '',
                                                    images: [],
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
                                                                value={data.price}
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
                                                                value={data.stock}
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
                                                                {data.images && data.images.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {data.images.map((image, imgIdx) => (
                                                                            <Badge
                                                                                key={imgIdx}
                                                                                variant="secondary"
                                                                                className="flex items-center gap-1 px-2 py-0.5 text-xs"
                                                                            >
                                                                                <span className="truncate max-w-[120px]">
                                                                                    {image.name}
                                                                                </span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        handleRemoveImage(variantKey, imgIdx)
                                                                                    }
                                                                                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                                                                >
                                                                                    <X className="size-3" />
                                                                                </button>
                                                                            </Badge>
                                                                        ))}
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
