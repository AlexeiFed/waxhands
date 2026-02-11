/**
 * @file: FilterDrawer.tsx
 * @description: Мобильный drawer для управления фильтрами
 * @dependencies: Sheet, Button
 * @created: 2025-11-10
 */

import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface FilterDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    onApply?: () => void;
    onReset?: () => void;
    applyLabel?: string;
    resetLabel?: string;
    showFooter?: boolean;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
    open,
    onOpenChange,
    title = 'Фильтры',
    description,
    children,
    onApply,
    onReset,
    applyLabel = 'Применить',
    resetLabel = 'Сбросить',
    showFooter = true,
}) => {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="px-4 pb-6 pt-4">
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                    {description && <SheetDescription>{description}</SheetDescription>}
                </SheetHeader>

                <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-4">
                    {children}
                </div>

                {showFooter && (
                    <SheetFooter className="mt-4 flex-row justify-between gap-2">
                        <Button variant="outline" onClick={onReset}>
                            {resetLabel}
                        </Button>
                        <Button onClick={onApply}>
                            {applyLabel}
                        </Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default FilterDrawer;








