/**
 * @file: FilterChips.tsx
 * @description: Компонент отображения активных фильтров с возможностью быстрого сброса
 * @dependencies: React, Button, Badge
 * @created: 2025-11-10
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterChip {
    id: string;
    label: string;
    value: string | number;
    onRemove: () => void;
}

interface FilterChipsProps {
    chips: FilterChip[];
    onClearAll?: () => void;
    className?: string;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
    chips,
    onClearAll,
    className,
}) => {
    if (!chips || chips.length === 0) {
        return null;
    }

    return (
        <div className={cn('flex flex-wrap items-center gap-2', className)}>
            {chips.map((chip) => (
                <Badge key={chip.id} variant="secondary" className="flex items-center gap-2">
                    <span className="text-xs font-medium">{chip.label}:</span>
                    <span className="text-xs">{chip.value}</span>
                    <button
                        type="button"
                        onClick={chip.onRemove}
                        className="ml-1 rounded-full p-0.5 hover:bg-white/40 transition"
                        aria-label="Сбросить фильтр"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
            {onClearAll && (
                <Button variant="ghost" size="sm" onClick={onClearAll}>
                    Очистить все
                </Button>
            )}
        </div>
    );
};

export default FilterChips;





