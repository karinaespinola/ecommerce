import { Plus, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

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

interface ProductVariantsManagerProps {
    attributes: Attribute[];
    isVariable: boolean;
}

export default function ProductVariantsManager({
    attributes,
    isVariable,
}: ProductVariantsManagerProps) {
    const [selectedAttributes, setSelectedAttributes] = useState<AttributeWithValues[]>([]);
    const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
    const [availableAttributes, setAvailableAttributes] = useState<Attribute[]>(attributes);
    const [newValueInputs, setNewValueInputs] = useState<Record<number, string>>({});

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

    if (!isVariable) {
        return null;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Product Variants</CardTitle>
                    <CardDescription>
                        Select attributes and add values for each. All variants will include all selected attributes.
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

                    {generateVariants.length > 0 && (
                        <div className="mt-6 space-y-3 p-4 bg-muted rounded-lg">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">
                                    Generated Variants ({generateVariants.length})
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    All variants include all selected attributes
                                </p>
                            </div>
                            <div className="grid gap-2 text-sm">
                                {generateVariants.map((variant, idx) => {
                                    const variantString = Object.entries(variant)
                                        .map(([attrId, value]) => {
                                            const attr = availableAttributes.find(
                                                (a) => a.id === parseInt(attrId)
                                            );
                                            return `${attr?.name || 'Unknown'}: ${value}`;
                                        })
                                        .join(' • ');

                                    return (
                                        <div
                                            key={idx}
                                            className="p-2 bg-background rounded border text-muted-foreground"
                                        >
                                            {variantString}
                                        </div>
                                    );
                                })}
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
